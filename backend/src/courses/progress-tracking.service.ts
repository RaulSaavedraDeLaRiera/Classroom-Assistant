import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CourseEnrollment, CourseEnrollmentDocument } from './schemas/course-enrollment.schema';
import { StudentExercise, StudentExerciseDocument } from '../students/schemas/student-exercise.schema';
import { StudentModule, StudentModuleDocument } from '../students/schemas/student-module.schema';
import { CourseExercise, CourseExerciseDocument } from './schemas/course-exercise.schema';
import { CourseModule, CourseModuleDocument } from './schemas/course-module.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProgressTrackingService {
  constructor(
    @InjectModel(CourseEnrollment.name) private courseEnrollmentModel: Model<CourseEnrollmentDocument>,
    @InjectModel(StudentExercise.name) private studentExerciseModel: Model<StudentExerciseDocument>,
    @InjectModel(StudentModule.name) private studentModuleModel: Model<StudentModuleDocument>,
    @InjectModel(CourseExercise.name) private courseExerciseModel: Model<CourseExerciseDocument>,
    @InjectModel(CourseModule.name) private courseModuleModel: Model<CourseModuleDocument>,
    private notificationsService: NotificationsService,
  ) {}

  // Order course modules using linked-list (previousModuleId/nextModuleId), with fallbacks
  private orderCourseModules(modules: any[]): any[] {
    if (!Array.isArray(modules) || modules.length === 0) return [];

    // Map for O(1) lookup
    const moduleMap = new Map(modules.map(m => [m._id.toString(), m]));

    // Find head: module whose previousModuleId is null or not present in this set
    let head = modules.find(m => !m.previousModuleId || !moduleMap.has(m.previousModuleId.toString())) || modules[0];

    const ordered: any[] = [];
    const visited = new Set<string>();
    while (head && !visited.has(head._id.toString())) {
      ordered.push(head);
      visited.add(head._id.toString());
      head = head.nextModuleId ? moduleMap.get(head.nextModuleId.toString()) : null;
    }

    // Fallback: append any unvisited modules, using numeric 'order' if available
    const remaining = modules.filter(m => !visited.has(m._id.toString()));
    if (remaining.length > 0) {
      const sortedRemaining = [...remaining].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      ordered.push(...sortedRemaining);
    }

    return ordered;
  }

  // Order exercises within a module using previousExerciseId/nextExerciseId linked-list
  private orderExercisesByModule(exercises: any[], moduleId: any): any[] {
    if (!Array.isArray(exercises) || exercises.length === 0 || !moduleId) return [];

    const inModule = exercises.filter(ex => ex && ex.courseModuleId && ex.courseModuleId.toString() === moduleId.toString());
    if (inModule.length === 0) return [];

    const exerciseMap = new Map(inModule.map((e: any) => [e._id.toString(), e]));

    // Find head in this module
    let current = inModule.find((e: any) => !e.previousExerciseId || !exerciseMap.has(e.previousExerciseId.toString())) || inModule[0];
    const ordered: any[] = [];
    const visited = new Set<string>();
    while (current && !visited.has(current._id.toString())) {
      ordered.push(current);
      visited.add(current._id.toString());
      current = current.nextExerciseId ? exerciseMap.get(current.nextExerciseId.toString()) : null;
    }

    // Append any unlinked leftovers to maintain stability
    for (const ex of inModule) {
      if (!visited.has(ex._id.toString())) ordered.push(ex);
    }

    return ordered;
  }

  // Calculate and update enrollment progress
  async updateEnrollmentProgress(courseId: string, studentId: string): Promise<void> {
   
    // Get enrollment
    const enrollment = await this.courseEnrollmentModel.findOne({
      courseId: new Types.ObjectId(courseId),
      studentId: new Types.ObjectId(studentId),
      visible: true
    }).exec();

    if (!enrollment) {
      return;
    }

    // Get all course exercises and modules
    const courseModules = await this.courseModuleModel.find({
      courseId: new Types.ObjectId(courseId),
      visible: true
    }).exec();

    const courseModuleIds = courseModules.map(m => m._id);
    const courseExercises = await this.courseExerciseModel.find({
      courseModuleId: { $in: courseModuleIds },
      visible: true
    }).exec();

    // Build deterministic order: modules chain → exercises chain per module
    const orderedModules = this.orderCourseModules(courseModules);
     const orderedCourseExercises: any[] = [];
    for (const mod of orderedModules) {
      const orderedInModule = this.orderExercisesByModule(courseExercises, mod._id);
      orderedCourseExercises.push(...orderedInModule);
    }
    // Include any exercises whose module wasn't in orderedModules (edge-case)
    if (orderedCourseExercises.length < courseExercises.length) {
      const included = new Set(orderedCourseExercises.map(ex => ex._id.toString()));
      for (const ex of courseExercises) {
        if (!included.has(ex._id.toString())) {
          orderedCourseExercises.push(ex);
        }
      }
    }

    // Get student's exercises and modules
    const studentExercises = await this.studentExerciseModel.find({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      visible: true
    }).exec();

    const studentModules = await this.studentModuleModel.find({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      visible: true
    }).exec();

    // Calculate exercise statistics - only count course exercises (not manual/extra exercises)
    const totalExercises = orderedCourseExercises.length;
    const completedExercises = studentExercises.filter(se => 
      (se.status === 'completed' || se.status === 'reviewed') && se.courseExerciseId
    ).length;
   const completedExerciseIds = studentExercises
      .filter(se => (se.status === 'completed' || se.status === 'reviewed') && se.courseExerciseId)
      .map(se => se.courseExerciseId);

    // Calculate module statistics
    const totalModules = courseModules.length;
    const completedModules = studentModules.filter(sm => sm.status === 'completed').length;
    const completedModuleIds = studentModules
      .filter(sm => sm.status === 'completed')
      .map(sm => sm.courseModuleId);

    // Calculate grade statistics
    const exerciseScores: number[] = [];
    let totalPoints = 0;
    let earnedPoints = 0;
    let completedWithScoreCount = 0;
    let completedWithScoreSum = 0;

    for (const courseExercise of orderedCourseExercises) {
      const studentExercise = studentExercises.find(se => 
        se.courseExerciseId && se.courseExerciseId.toString() === courseExercise._id.toString()
      );

      if (studentExercise && (studentExercise.status === 'completed' || studentExercise.status === 'reviewed') && studentExercise.score !== null) {
        // Use maxScore from course exercise or student exercise
        const maxPoints = courseExercise.maxScore || studentExercise.maxScore || 10;
        const normalizedScore = Math.min(100, Math.max(0, (studentExercise.score / maxPoints) * 100));
        
        exerciseScores.push(normalizedScore);
        totalPoints += maxPoints;
        earnedPoints += studentExercise.score;
        completedWithScoreCount += 1;
        completedWithScoreSum += normalizedScore;
      } else {
        // Exercise not completed or no score
        exerciseScores.push(0);
        totalPoints += courseExercise.maxScore || 10;
      }
    }

    // Calculate average score based ONLY on completed/reviewed with score
    const averageScore = completedWithScoreCount > 0
      ? completedWithScoreSum / completedWithScoreCount
      : 0;
   
    // Calculate overall progress (based only on exercises completed)
    const overallProgress = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

    // Update enrollment
    await this.courseEnrollmentModel.findByIdAndUpdate(enrollment._id, {
      progress: overallProgress,
      totalExercises,
      completedExercises,
      totalModules,
      completedModules,
      averageScore: Math.round(averageScore * 100) / 100, // Round to 2 decimal places
      totalPoints,
      earnedPoints,
      exerciseScores,
      completedExerciseIds,
      completedModuleIds
    }).exec();
  }

  // Mark exercise as completed
  async markExerciseCompleted(courseId: string, studentId: string, exerciseId: string, score?: number): Promise<void> {
   
    // Update student exercise
    const updateData: any = {
      completedAt: new Date()
    };

    if (score !== undefined) {
      // If score is provided, mark as 'reviewed' (teacher has graded it)
      updateData.status = 'reviewed';
      updateData.score = score;
      updateData.bestScore = Math.max(updateData.bestScore || 0, score);
      updateData.attempts = (updateData.attempts || 0) + 1;
      updateData.scores = [...(updateData.scores || []), { 
        score: score, 
        timestamp: new Date() 
      }];
    } else {
      // If no score provided, mark as 'completed' (student completed it)
      updateData.status = 'completed';
    }

    await this.studentExerciseModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(exerciseId),
        studentId: new Types.ObjectId(studentId),
        visible: true
      },
      updateData,
      { new: true }
    ).exec();

    // Check if module should be marked as completed (do this before enrollment calc)
    await this.checkModuleCompletion(courseId, studentId, exerciseId);

    // Update sequential exercise statuses based on completion
    await this.updateSequentialExerciseStatuses(courseId, studentId, exerciseId, 'completed');

    // Update enrollment progress AFTER module status may have changed
    await this.updateEnrollmentProgress(courseId, studentId);
  }

  // Mark exercise as not completed (teacher action)
  async markExerciseNotCompleted(courseId: string, studentId: string, exerciseId: string): Promise<void> {
   
    // Update student exercise
    await this.studentExerciseModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(exerciseId),
        studentId: new Types.ObjectId(studentId),
        visible: true
      },
      {
        status: 'pending',
        completedAt: null,
        score: null
      },
      { new: true }
    ).exec();

    // Check if module should be marked as not completed (do this before enrollment calc)
    await this.checkModuleCompletion(courseId, studentId, exerciseId);

    // Update sequential exercise statuses based on setting to pending
    await this.updateSequentialExerciseStatuses(courseId, studentId, exerciseId, 'pending');

    // Update enrollment progress AFTER module status may have changed
    await this.updateEnrollmentProgress(courseId, studentId);
  }

  // Check if module should be marked as completed/not completed
  private async checkModuleCompletion(courseId: string, studentId: string, exerciseId: string): Promise<void> {
   // Resolve student exercise first (exerciseId refers to StudentExercise)
    const studentExercise = await this.studentExerciseModel.findById(exerciseId).exec();
    if (!studentExercise) {
   return;
    }
    if (!studentExercise.courseExerciseId) {
      return;
    }
    // Get the course exercise to find its module
    const courseExercise = await this.courseExerciseModel.findById(studentExercise.courseExerciseId).exec();
    if (!courseExercise) {
     return;
    }

    const moduleId = courseExercise.courseModuleId;

    // Get all exercises in this module
    const moduleExercises = await this.courseExerciseModel.find({
      courseModuleId: moduleId,
      visible: true
    }).exec();
   
    // Get student's exercises for this course (schema has no courseModuleId field)
    const studentModuleExercises = await this.studentExerciseModel.find({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      visible: true
    }).exec();
    
    // Check if all exercises are completed
    const allCompleted = moduleExercises.every(me => {
      const studentExercise = studentModuleExercises.find(se => 
        se.courseExerciseId && 
        se.courseExerciseId.toString() === me._id.toString()
      );
      return studentExercise && 
        (studentExercise.status === 'completed' || studentExercise.status === 'reviewed');
    });
    const completedCount = moduleExercises.filter(me => {
      const se = studentModuleExercises.find(s => s.courseExerciseId && s.courseExerciseId.toString() === me._id.toString());
      return se && (se.status === 'completed' || se.status === 'reviewed');
    }).length;
   
    // Update module status
    const newModuleStatus = allCompleted ? 'completed' : 'active';
    
    const updated = await this.studentModuleModel.findOneAndUpdate(
      {
        studentId: new Types.ObjectId(studentId),
        courseModuleId: moduleId,
        visible: true
      },
      {
        status: newModuleStatus,
        progress: allCompleted ? 100 : Math.round((studentModuleExercises.filter(se => (se.status === 'completed' || se.status === 'reviewed') && se.courseExerciseId).length / moduleExercises.length) * 100)
      },
      { new: true }
    ).exec();
    
  }

  // Update exercise statuses based on sequential progression rules
  async updateSequentialExerciseStatuses(courseId: string, studentId: string, changedExerciseId: string, newStatus: string): Promise<void> {
    const changedExercise = await this.studentExerciseModel.findById(changedExerciseId).exec();
    if (!changedExercise) return;

    const studentModule = await this.studentModuleModel.findById(changedExercise.studentModuleId).exec();
    if (!studentModule) return;

    // Get all exercises in the same module
    const moduleExercises = await this.studentExerciseModel.find({
      studentModuleId: changedExercise.studentModuleId,
      visible: true
    }).exec();

    if (newStatus === 'completed' || newStatus === 'reviewed') {
      // When completing or reviewing an exercise, set all previous exercises to ready (if they're pending)
      await this.setPreviousExercisesToReady(moduleExercises, changedExercise);
      
      // Set next exercise to ready (if it's pending and module is active)
      await this.setNextExerciseToReady(moduleExercises, changedExercise, studentModule);
    } else if (newStatus === 'pending') {
      // When setting an exercise to pending, set all following exercises to pending (if they're ready)
      // Only do this for sequential modules (not 'all' type modules)
      if (studentModule.type !== 'all') {
        await this.setFollowingExercisesToPending(moduleExercises, changedExercise);
      }
    }
  }

  // Set all previous exercises to ready when completing an exercise
  private async setPreviousExercisesToReady(moduleExercises: any[], completedExercise: any): Promise<void> {
    const previousExercises = this.getPreviousExercises(moduleExercises, completedExercise);
    
    for (const exercise of previousExercises) {
      if (exercise.status === 'pending') {
        await this.studentExerciseModel.findByIdAndUpdate(
          exercise._id,
          { status: 'ready' }
        ).exec();
      }
    }
  }

  // Set next exercise to ready when completing an exercise
  private async setNextExerciseToReady(moduleExercises: any[], completedExercise: any, studentModule: any): Promise<void> {
    if (!completedExercise.nextExerciseId) return;

    const nextExercise = moduleExercises.find(ex => ex._id.toString() === completedExercise.nextExerciseId.toString());
    if (!nextExercise) return;

    // Only set to ready if module is active and exercise is pending
    if (studentModule.status === 'active' && nextExercise.status === 'pending') {
      await this.studentExerciseModel.findByIdAndUpdate(
        nextExercise._id,
        { status: 'ready' }
      ).exec();
    }
  }

  // Set all following exercises to pending when setting an exercise to pending
  private async setFollowingExercisesToPending(moduleExercises: any[], pendingExercise: any): Promise<void> {
    const followingExercises = this.getFollowingExercises(moduleExercises, pendingExercise);
    
    for (const exercise of followingExercises) {
      if (exercise.status === 'ready') {
        await this.studentExerciseModel.findByIdAndUpdate(
          exercise._id,
          { status: 'pending' }
        ).exec();
      }
    }
  }

  // Get all previous exercises in the linked list
  private getPreviousExercises(moduleExercises: any[], targetExercise: any): any[] {
    const previousExercises: any[] = [];
    let current = targetExercise;
    
    while (current.previousExerciseId) {
      const previous = moduleExercises.find(ex => ex._id.toString() === current.previousExerciseId.toString());
      if (!previous) break;
      
      previousExercises.unshift(previous); // Add to beginning to maintain order
      current = previous;
    }
    
    return previousExercises;
  }

  // Get all following exercises in the linked list
  private getFollowingExercises(moduleExercises: any[], targetExercise: any): any[] {
    const followingExercises: any[] = [];
    let current = targetExercise;
    
    while (current.nextExerciseId) {
      const next = moduleExercises.find(ex => ex._id.toString() === current.nextExerciseId.toString());
      if (!next) break;
      
      followingExercises.push(next);
      current = next;
    }
    
    return followingExercises;
  }

  // Get enrollment progress details
  async getEnrollmentProgress(courseId: string, studentId: string) {
    
    const enrollment = await this.courseEnrollmentModel.findOne({
      courseId: new Types.ObjectId(courseId),
      studentId: new Types.ObjectId(studentId),
      visible: true
    }).exec();


    if (!enrollment) {
      return null;
    }

    return {
      progress: enrollment.progress,
      totalExercises: enrollment.totalExercises,
      completedExercises: enrollment.completedExercises,
      totalModules: enrollment.totalModules,
      completedModules: enrollment.completedModules,
      averageScore: enrollment.averageScore,
      totalPoints: enrollment.totalPoints,
      earnedPoints: enrollment.earnedPoints,
      exerciseScores: enrollment.exerciseScores,
      completedExerciseIds: enrollment.completedExerciseIds,
      completedModuleIds: enrollment.completedModuleIds
    };
  }

  // Initialize enrollment statistics when student is enrolled
  async initializeEnrollmentStats(courseId: string, studentId: string): Promise<void> {

    // Get all course exercises and modules
    const courseModules = await this.courseModuleModel.find({
      courseId: new Types.ObjectId(courseId),
      visible: true
    }).exec();

    const courseModuleIds = courseModules.map(m => m._id);
    const courseExercises = await this.courseExerciseModel.find({
      courseModuleId: { $in: courseModuleIds },
      visible: true
    }).exec();

    // Determine deterministic order to size arrays consistently
    const orderedModules = this.orderCourseModules(courseModules);
    const orderedCourseExercises: any[] = [];
    for (const mod of orderedModules) {
      const orderedInModule = this.orderExercisesByModule(courseExercises, mod._id);
      orderedCourseExercises.push(...orderedInModule);
    }
    if (orderedCourseExercises.length < courseExercises.length) {
      const included = new Set(orderedCourseExercises.map(ex => ex._id.toString()));
      for (const ex of courseExercises) {
        if (!included.has(ex._id.toString())) orderedCourseExercises.push(ex);
      }
    }

    // Initialize exercise scores array with zeros using ordered length
    const exerciseScores = new Array(orderedCourseExercises.length).fill(0);

    // Calculate total points
    const totalPoints = orderedCourseExercises.reduce((sum, exercise) => 
      sum + (exercise.maxScore || 10), 0
    );

    // Update enrollment with initial stats
    await this.courseEnrollmentModel.findOneAndUpdate(
      {
        courseId: new Types.ObjectId(courseId),
        studentId: new Types.ObjectId(studentId),
        visible: true
      },
      {
        totalExercises: orderedCourseExercises.length,
        completedExercises: 0,
        totalModules: orderedModules.length,
        completedModules: 0,
        averageScore: 0,
        totalPoints,
        earnedPoints: 0,
        exerciseScores,
        completedExerciseIds: [],
        completedModuleIds: []
      }
    ).exec();

  }
}
