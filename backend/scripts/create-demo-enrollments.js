const mongoose = require('mongoose');
require('dotenv').config();
const { exercise1, exercise2, exercise3, exercise4, exercise5, exercise6, exercise7, exercise8 } = require('./manual-exercises-data');

async function createDemoEnrollments() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/classroom_assistant_example');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Load IDs from previous scripts
    const fs = require('fs');
    const path = require('path');
    const idsFile = path.join(__dirname, 'demo-ids.json');
    
    if (!fs.existsSync(idsFile)) {
      throw new Error('demo-ids.json not found. Run create-demo-users.js and create-demo-course.js first');
    }
    
    const ids = JSON.parse(fs.readFileSync(idsFile, 'utf8'));
    
    
    // Generate enrollment IDs
    const enrollmentIds = ids.studentIds.map(() => new mongoose.Types.ObjectId());
    
    // Get course exercises to calculate totals
    console.log('Fetching course exercises...');
    let courseExercises = await db.collection('course_exercises').find({
      courseId: new mongoose.Types.ObjectId(ids.courseId)
    }).toArray();
    console.log(`Found ${courseExercises.length} course exercises`);

    // Get course modules to copy their properties
    console.log('Fetching course modules...');
    const courseModules = await db.collection('course_modules').find({
      courseId: new mongoose.Types.ObjectId(ids.courseId)
    }).toArray();
    console.log(`Found ${courseModules.length} course modules`);
   
    // Preprocess: Order exercises per module (based on previous/next links)
    function orderExercisesByModule(exercises, moduleId) {
      try {
        if (!exercises || !Array.isArray(exercises)) {
          return [];
        }
        
        const inModule = exercises.filter(ex => {
          if (!ex || !ex.courseModuleId) {
            return false;
          }
          return ex.courseModuleId.toString() === moduleId.toString();
        });
        
        if (inModule.length === 0) return [];
        
        // Sort by order or by previous/next relationships
        const sortedExercises = [];
        const exerciseMap = new Map(inModule.map(e => [e._id.toString(), e]));
        
        // Find starting exercise (no previous or previous not in this module)
        let current = inModule.find(e => {
          if (!e.previousExerciseId) return true;
          return !exerciseMap.has(e.previousExerciseId.toString());
        }) || inModule[0];
        
        const visited = new Set();
        while (current && !visited.has(current._id.toString())) {
          sortedExercises.push(current);
          visited.add(current._id.toString());
          current = current.nextExerciseId ? exerciseMap.get(current.nextExerciseId.toString()) : null;
        }
        
        // Add any remaining exercises that weren't linked
        inModule.forEach(ex => {
          if (!visited.has(ex._id.toString())) {
            sortedExercises.push(ex);
          }
        });
        
        return sortedExercises;
      } catch (error) {
        console.error('Error in orderExercisesByModule:', error.message);
        return [];
      }
    }

    // Determine module order (for index 0 and 1)
    const modulesOrdered = [...courseModules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Precompute ordered exercises per module for index lookups
    const moduleIdToOrderedExercises = new Map(
      courseModules.map(cm => [cm._id.toString(), orderExercisesByModule(courseExercises, cm._id)])
    );
    
    // Course enrollments
    const courseEnrollments = ids.studentIds.map((studentId, index) => {
      const completedModulesCount = Math.floor(Math.random() * 3); // 0-2 completed modules
      const completedExercisesCount = Math.floor(Math.random() * courseExercises.length);
      const progress = Math.floor(Math.random() * 80) + 10; // Random progress between 10-90%
      
      // Generate exercise scores for completed exercises
      const exerciseScores = [];
      const completedExerciseIds = [];
      const completedModuleIds = [];
      
      // Generate scores for completed exercises
      for (let i = 0; i < completedExercisesCount; i++) {
        const score = Math.floor(Math.random() * 80) + 20; // Score between 20-100
        exerciseScores.push(score);
        completedExerciseIds.push(courseExercises[i]._id);
      }
      
      // Generate completed module IDs
      for (let i = 0; i < completedModulesCount; i++) {
        completedModuleIds.push(new mongoose.Types.ObjectId(ids.moduleIds[i]));
      }
      
      const averageScore = exerciseScores.length > 0 ? 
        Math.round(exerciseScores.reduce((sum, score) => sum + score, 0) / exerciseScores.length) : 0;
      
      const totalPoints = courseExercises.length * 10; // Each exercise is worth 10 points
      const earnedPoints = Math.round((averageScore / 100) * totalPoints);
      
      return {
      _id: enrollmentIds[index],
      courseId: new mongoose.Types.ObjectId(ids.courseId),
      studentId: new mongoose.Types.ObjectId(studentId),
      teacherId: new mongoose.Types.ObjectId(ids.teacherId),
      status: "active",
      enrolledAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000), // Different enrollment dates
        previousEnrollmentId: null,
        progress: progress,
        totalExercises: courseExercises.length,
        completedExercises: completedExercisesCount,
        totalModules: ids.moduleIds.length,
        completedModules: completedModulesCount,
        averageScore: averageScore,
        totalPoints: totalPoints,
        earnedPoints: earnedPoints,
        exerciseScores: exerciseScores,
        completedExerciseIds: completedExerciseIds,
        completedModuleIds: completedModuleIds,
        visible: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
      };
    });

    // Student modules (progress for each module)
    console.log('Creating student modules...');
    const studentModules = [];
    
    ids.studentIds.forEach((studentId, studentIndex) => {
      courseModules.forEach((module, moduleIndex) => {
        if (!module || !module._id) {
          return;
        }
        
        let status = 'not_started';
        let progress = 0;
        let startedAt = null;
        let completedAt = null;
        
        // Deterministic states for first two modules, same for all students
        if (moduleIndex < 2) {
          if (moduleIndex === 0) {
            status = 'in_progress';
            progress = 35;
            startedAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
            completedAt = null;
          } else if (moduleIndex === 1) {
            status = 'not_started';
            progress = 0;
            startedAt = null;
            completedAt = null;
          }
        } else {
          // Rest of modules are not_started
          status = 'not_started';
          progress = 0;
        }
        
        studentModules.push({
          _id: new mongoose.Types.ObjectId(),
          title: module.title,
          description: module.description,
          courseId: new mongoose.Types.ObjectId(ids.courseId),
          courseModuleId: module._id,
          studentId: new mongoose.Types.ObjectId(studentId),
          moduleId: module._id,
          order: moduleIndex,
          visible: module.visible,
          tags: module.tags,
          status: status,
          progress: progress,
          studentExerciseIds: [], // Will be populated after student exercises are created
          type: module.type,
          nextModuleId: module.nextModuleId,
          previousModuleId: module.previousModuleId,
          startedAt: startedAt,
          completedAt: completedAt,
          createdAt: new Date(),
          updatedAt: new Date(),
          __v: 0
        });
      });
    });

    // Student exercises (progress for each exercise)
    console.log('Creating student exercises...');
    const studentExercises = [];
    
    // Tuned content by title to insert directly into student_exercises
    const tunedByTitle = new Map([
      ['Present Simple - Daily Routines', exercise1],
      ['Adverbs of Frequency', exercise2],
      ['Questions in Present Simple', exercise3],
      ['Present Simple - Affirmative/Negative', exercise4],
      ['English Grammar Exercise: Mixed Tenses and Conditionals', exercise5],
      ['Writing - Describe Your Hometown', exercise6],
      ['Reading - Short Text', exercise7],
      ['Vocabulary - Family Members (Matching)', exercise8]
    ]);

    function buildManualStudentExerciseContent(exercise) {
      if (!exercise || !exercise.title) return exercise.content;
      const tuned = tunedByTitle.get(exercise.title);
      return tuned || exercise.content;
    }

    // Helper: return content
    function generateExerciseContent(exercise) {
      return buildManualStudentExerciseContent(exercise);
    }

    // Removed any per-student content generation; student exercises use course_exercises content as-is
    console.log(`Processing ${ids.studentIds.length} students and ${courseExercises.length} exercises`);
    
    ids.studentIds.forEach((studentId, studentIndex) => {
      courseExercises.forEach((exercise) => {
        if (!exercise || !exercise._id) {
          return;
        }
        const studentModule = studentModules.find(sm => 
          sm.studentId.toString() === studentId && 
          sm.courseModuleId && exercise.courseModuleId &&
          sm.courseModuleId.toString() === exercise.courseModuleId.toString()
        );
        
        let status = 'pending';
        let score = 0;
        let completedAt = null;
        let startedAt = null;
        
        if (studentModule) {
          // Only first 2 modules have varied progress
          if (studentModule.order < 2) {
            // Determine the ordered index of this exercise within its module
            const orderedModuleExercises = studentModule.courseModuleId ? 
              moduleIdToOrderedExercises.get(studentModule.courseModuleId.toString()) || [] : [];
            const currentExerciseIndex = orderedModuleExercises.findIndex(ex => ex._id.toString() === exercise._id.toString());
            
            // SAME LOGIC FOR ALL STUDENTS - First 2 modules, first 4 exercises
            if (studentModule.order < 2 && currentExerciseIndex < 4) {
              if (currentExerciseIndex === 0) {
                // First exercise (Present Simple - Daily Routines): reviewed for ALL students
                status = 'reviewed';
                score = 8;
                completedAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
                startedAt = new Date(completedAt.getTime() - exercise.estimatedTime * 60 * 1000);
              } else if (currentExerciseIndex === 1) {
                // Second exercise (Adverbs of Frequency / Writing): reviewed for ALL students
                status = 'reviewed';
                score = 8;
                completedAt = new Date(Date.now() - 1.5 * 60 * 60 * 1000);
                startedAt = new Date(completedAt.getTime() - exercise.estimatedTime * 60 * 1000);
              } else if (currentExerciseIndex === 2) {
                // Third exercise (Questions / Reading Short Text): completed for ALL students
                status = 'completed';
                score = 9;
                completedAt = new Date(Date.now() - 1 * 60 * 60 * 1000);
                startedAt = new Date(completedAt.getTime() - exercise.estimatedTime * 60 * 1000);
              } else if (currentExerciseIndex === 3) {
                // Fourth exercise (Present Simple - Affirmative/Negative / Vocabulary - Family Members): in_progress for ALL students
                status = 'in_progress';
                score = 5; // Partially completed
                startedAt = new Date(Date.now() - 30 * 60 * 1000);
              }
            } else if (studentModule.order < 2 && currentExerciseIndex >= 4) {
              // Extra exercises in first 2 modules: ready for ALL students
              status = 'ready';
            } else {
              // Other exercises in first 2 modules: ready for ALL students
              status = 'ready';
            }
          } else {
            // Rest of modules: exercises are ready or pending based on module type
            if (studentModule.type === 'all') {
              status = 'ready';
            } else {
              status = 'pending';
            }
          }
        }
        
        // Get module index for content generation
        const moduleIndex = studentModule ? studentModule.order : 0;
        const orderedForModule = studentModule && studentModule.courseModuleId ? 
          (moduleIdToOrderedExercises.get(studentModule.courseModuleId.toString()) || []) : [];
        const currentExerciseIndex = orderedForModule.findIndex(ex => ex._id.toString() === exercise._id.toString());
        
        studentExercises.push({
          _id: new mongoose.Types.ObjectId(),
          title: exercise.title,
          content: generateExerciseContent(exercise),
          type: exercise.type,
          studentModuleId: studentModule ? studentModule._id : null,
          teacherExerciseId: null, // Will be set later
          courseId: new mongoose.Types.ObjectId(ids.courseId),
          courseExerciseId: exercise._id,
          studentId: new mongoose.Types.ObjectId(studentId),
          teacherId: new mongoose.Types.ObjectId(ids.teacherId),
          previousExerciseId: exercise.previousExerciseId,
          nextExerciseId: exercise.nextExerciseId,
          visible: exercise.visible,
          tags: exercise.tags,
          status: status,
          maxScore: exercise.maxScore || 10,
          estimatedTime: exercise.estimatedTime,
          difficulty: exercise.difficulty,
          score: (status === 'reviewed') ? score : null, // Only reviewed exercises have scores
          attempts: (status === 'completed' || status === 'reviewed') ? Math.floor(Math.random() * 3) + 1 : 0,
          bestScore: (status === 'reviewed') ? score : 0, // Only reviewed exercises have bestScore
          scores: (status === 'reviewed') ? [score] : [], // Only reviewed exercises have scores array
          timeSpent: (status === 'completed' || status === 'reviewed') ? exercise.estimatedTime + Math.floor(Math.random() * 10) : 0,
          startedAt: startedAt,
          completedAt: completedAt,
          feedback: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          __v: 0
        });
      });
    });

    // Add extra exercises for modules 1 and 2 (only in studentExercises, not in course_exercises)
    const extraExercisesM1 = [
      {
        title: 'Vocabulary - Daily Activities',
        content: `# Vocabulary - Daily Activities

## Instructions
Match the daily activities with their correct descriptions.

---

## Exercise 1: Activity Matching (10 points)

1. Wake up { }

2. Have breakfast { }

3. Go to work { }

4. Have lunch { }

5. Come home { }

6. Watch TV { }

7. Go to bed { }

**Descriptions:**
(a) To stop sleeping and get up
(b) To eat the first meal of the day
(c) To travel to your workplace
(d) To eat the midday meal
(e) To return to your house
(f) To watch television programs
(g) To go to sleep for the night`,
        type: 'vocabulary',
        tags: ['vocabulary', 'daily-activities', 'beginner'],
        estimatedTime: 10,
        maxScore: 10,
        difficulty: 'beginner'
      },
      {
        title: 'Listening - Daily Conversations',
        content: `# Listening - Daily Conversations

## Instructions
Listen to the conversations and answer the questions.

---

## Exercise 1: Conversation Comprehension (10 points)

**Conversation 1:**
Person A: "Good morning! How are you today?"
Person B: "I'm fine, thank you. How about you?"

1. What time of day is this conversation? { }

2. How is Person B feeling? { }

**Conversation 2:**
Person A: "What did you do yesterday?"
Person B: "I went to the movies with my friends."

3. What did Person B do yesterday? { }

4. Who did Person B go with? { }`,
        type: 'listening',
        tags: ['listening', 'conversations', 'beginner'],
        estimatedTime: 15,
        maxScore: 10,
        difficulty: 'beginner'
      }
    ];

    const extraExercisesM2 = [
      {
        title: 'Grammar - Past Simple Regular Verbs',
        content: `# Grammar - Past Simple Regular Verbs

## Instructions
Complete the sentences using the past simple form of the regular verbs in parentheses.

---

## Exercise 1: Past Simple Regular Verbs (10 points)

1. Yesterday, I { } (walk) to the store.

2. She { } (cook) dinner for her family last night.

3. They { } (visit) their grandparents last weekend.

4. We { } (watch) a movie yesterday evening.

5. He { } (clean) his room this morning.

6. The students { } (study) for the exam last week.

7. I { } (play) tennis with my friends yesterday.

8. She { } (wash) the dishes after dinner.`,
        type: 'grammar',
        tags: ['grammar', 'past-simple', 'regular-verbs', 'beginner'],
        estimatedTime: 15,
        maxScore: 10,
        difficulty: 'beginner'
      },
      {
        title: 'Reading - My Weekend',
        content: `# Reading Comprehension - My Weekend

## Instructions
Read the following text and answer the questions in complete sentences.

---

## Text: "My Weekend"

Last weekend was very relaxing. On Saturday morning, I went to the park with my dog. We walked for an hour and enjoyed the fresh air. In the afternoon, I visited my friend Maria at her house. We had coffee and talked about our plans for the summer. On Sunday, I stayed home and read a book. In the evening, I cooked a special dinner for my family. We all enjoyed the meal together.

---

## Questions (10 points)

1. What did the person do on Saturday morning? { }

2. How long did they walk in the park? { }

3. Who did they visit on Saturday afternoon? { }

4. What did they drink at their friend's house? { }

5. What did they do on Sunday? { }

6. What did they cook on Sunday evening? { }`,
        type: 'reading',
        tags: ['reading', 'weekend', 'beginner'],
        estimatedTime: 18,
        maxScore: 10,
        difficulty: 'beginner'
      },
      {
        title: 'Speaking - Describe Your Favorite Place',
        content: `# Speaking - Describe Your Favorite Place

## Instructions
Describe your favorite place using the following questions as a guide. Record your answer or write it down.

---

## Exercise 1: Speaking Practice (10 points)

**Questions to answer:**

1. What is your favorite place? { }

2. Where is it located? { }

3. Why do you like this place? { }

4. What can you do there? { }

5. When do you usually go there? { }

6. Who do you go with? { }

**Tips:**
- Use descriptive adjectives
- Explain your feelings about the place
- Give specific examples of activities`,
        type: 'speaking',
        tags: ['speaking', 'description', 'beginner'],
        estimatedTime: 20,
        maxScore: 10,
        difficulty: 'beginner'
      }
    ];

    // Add extra exercises for each student
    ids.studentIds.forEach(studentId => {
      // Module 1 extra exercises
      const module1 = studentModules.find(sm => 
        sm.studentId.toString() === studentId && sm.order === 0
      );
      
      if (module1) {
        // Obtener ejercicios del módulo 1 del estudiante y ordenarlos por lista enlazada
        const module1ExercisesAll = studentExercises.filter(se => 
          se.studentModuleId && se.studentModuleId.toString() === module1._id.toString()
        );
        const map1 = new Map(module1ExercisesAll.map(e => [e._id.toString(), e]));
        let head1 = module1ExercisesAll.find(e => !e.previousExerciseId || !map1.has(e.previousExerciseId.toString())) || module1ExercisesAll[0] || null;
        const ordered1 = [];
        const visited1 = new Set();
        while (head1 && !visited1.has(head1._id.toString())) {
          ordered1.push(head1);
          visited1.add(head1._id.toString());
          head1 = head1.nextExerciseId ? map1.get(head1.nextExerciseId.toString()) : null;
        }
        // Añadir no enlazados al final
        for (const e of module1ExercisesAll) {
          if (!visited1.has(e._id.toString())) ordered1.push(e);
        }
        const lastExercise = ordered1.length > 0 ? ordered1[ordered1.length - 1] : null;
        const lastExerciseStatus = lastExercise ? lastExercise.status : 'pending';
        
        // Track tail to append extras at the end, updating links
        let tailId = lastExercise ? lastExercise._id : null;
        
        extraExercisesM1.forEach((extraExercise, index) => {
          let status = 'ready';
          
          // Determine status based on module type and previous exercise status
          if (module1.type === 'all') {
            status = 'ready'; // All exercises are available in 'all' type modules
          } else if (module1.type === 'progress') {
            // In progress modules, extra exercises depend on previous exercise status
            if (lastExerciseStatus === 'completed' || lastExerciseStatus === 'reviewed') {
              status = 'ready';
            } else {
              status = 'pending';
            }
          }
          
          const newExtraId = new mongoose.Types.ObjectId();

          // If there is a tail, set its nextExerciseId to this new one (update in-memory)
          if (tailId) {
            const tail = studentExercises.find(se => se._id.toString() === tailId.toString());
            if (tail) {
              tail.nextExerciseId = newExtraId;
            }
          }

          studentExercises.push({
            _id: newExtraId,
            title: extraExercise.title,
            content: extraExercise.content,
            type: extraExercise.type,
            studentModuleId: module1._id,
            teacherExerciseId: null,
            courseId: new mongoose.Types.ObjectId(ids.courseId),
            courseExerciseId: null, // No courseExerciseId for extra exercises
            studentId: new mongoose.Types.ObjectId(studentId),
            teacherId: new mongoose.Types.ObjectId(ids.teacherId),
            previousExerciseId: tailId, // append to tail
            nextExerciseId: null, // Will be set by the system
            visible: true,
            tags: extraExercise.tags,
            status: status,
            maxScore: extraExercise.maxScore,
            estimatedTime: extraExercise.estimatedTime,
            difficulty: extraExercise.difficulty,
            score: null,
            attempts: 0,
            bestScore: 0,
            scores: [],
            timeSpent: 0,
            startedAt: null,
            completedAt: null,
            feedback: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            __v: 0
          });

          // Advance tail
          tailId = newExtraId;
        });
      }

      // Module 2 extra exercises
      const module2 = studentModules.find(sm => 
        sm.studentId.toString() === studentId && sm.order === 1
      );
      
      if (module2) {
        // Obtener ejercicios del módulo 2 del estudiante y ordenarlos por lista enlazada
        const module2ExercisesAll = studentExercises.filter(se => 
          se.studentModuleId && se.studentModuleId.toString() === module2._id.toString()
        );
        const map2 = new Map(module2ExercisesAll.map(e => [e._id.toString(), e]));
        let head2 = module2ExercisesAll.find(e => !e.previousExerciseId || !map2.has(e.previousExerciseId.toString())) || module2ExercisesAll[0] || null;
        const ordered2 = [];
        const visited2 = new Set();
        while (head2 && !visited2.has(head2._id.toString())) {
          ordered2.push(head2);
          visited2.add(head2._id.toString());
          head2 = head2.nextExerciseId ? map2.get(head2.nextExerciseId.toString()) : null;
        }
        // Añadir no enlazados al final
        for (const e of module2ExercisesAll) {
          if (!visited2.has(e._id.toString())) ordered2.push(e);
        }
        const lastExercise = ordered2.length > 0 ? ordered2[ordered2.length - 1] : null;
        const lastExerciseStatus = lastExercise ? lastExercise.status : 'pending';
        
        // Track tail to append extras at the end, updating links
        let tailId = lastExercise ? lastExercise._id : null;
        
        extraExercisesM2.forEach((extraExercise, index) => {
          let status = 'ready';
          
          // Determine status based on module type and previous exercise status
          if (module2.type === 'all') {
            status = 'ready'; // All exercises are available in 'all' type modules
          } else if (module2.type === 'progress') {
            // In progress modules, extra exercises depend on previous exercise status
            if (lastExerciseStatus === 'completed' || lastExerciseStatus === 'reviewed') {
              status = 'ready';
            } else {
              status = 'pending';
            }
          }
          
          const newExtraId = new mongoose.Types.ObjectId();

          // If there is a tail, set its nextExerciseId to this new one (update in-memory)
          if (tailId) {
            const tail = studentExercises.find(se => se._id.toString() === tailId.toString());
            if (tail) {
              tail.nextExerciseId = newExtraId;
            }
          }

          studentExercises.push({
            _id: newExtraId,
            title: extraExercise.title,
            content: extraExercise.content,
            type: extraExercise.type,
            studentModuleId: module2._id,
            teacherExerciseId: null,
            courseId: new mongoose.Types.ObjectId(ids.courseId),
            courseExerciseId: null, // No courseExerciseId for extra exercises
            studentId: new mongoose.Types.ObjectId(studentId),
            teacherId: new mongoose.Types.ObjectId(ids.teacherId),
            previousExerciseId: tailId, // append to tail
            nextExerciseId: null, // Will be set by the system
            visible: true,
            tags: extraExercise.tags,
            status: status,
            maxScore: extraExercise.maxScore,
            estimatedTime: extraExercise.estimatedTime,
            difficulty: extraExercise.difficulty,
            score: null,
            attempts: 0,
            bestScore: 0,
            scores: [],
            timeSpent: 0,
            startedAt: null,
            completedAt: null,
            feedback: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            __v: 0
          });

          // Advance tail
          tailId = newExtraId;
        });
      }
    });

    // Set previousModuleId and nextModuleId for each student's modules
    ids.studentIds.forEach(studentId => {
      const studentModulesForStudent = studentModules
        .filter(sm => sm.studentId.toString() === studentId)
        .sort((a, b) => a.order - b.order);
      
      studentModulesForStudent.forEach((module, index) => {
        module.previousModuleId = index > 0 ? studentModulesForStudent[index - 1]._id : null;
        module.nextModuleId = index < studentModulesForStudent.length - 1 ? studentModulesForStudent[index + 1]._id : null;
      });
    });

    // Populate studentExerciseIds in student modules
    studentExercises.forEach(studentExercise => {
      if (studentExercise.courseExerciseId) {
        // Regular exercises: Find the course exercise to get its courseModuleId
        const courseExercise = studentExercise.courseExerciseId ? 
          courseExercises.find(ce => ce._id.toString() === studentExercise.courseExerciseId.toString()) : null;
        
        if (courseExercise) {
          const studentModule = studentModules.find(sm => 
            sm.studentId.toString() === studentExercise.studentId.toString() &&
            sm.courseModuleId && courseExercise.courseModuleId &&
            sm.courseModuleId.toString() === courseExercise.courseModuleId.toString()
          );
          
          if (studentModule) {
            studentModule.studentExerciseIds.push(studentExercise._id);
          }
        }
      } else {
        // Extra exercises: Use studentModuleId directly
        const studentModule = studentModules.find(sm => 
          sm._id.toString() === studentExercise.studentModuleId.toString()
        );
        
        if (studentModule) {
          studentModule.studentExerciseIds.push(studentExercise._id);
        }
      }
    });

    // Teacher modules and exercises (for teacher view)
    const teacherModules = courseModules.map(module => ({
      _id: new mongoose.Types.ObjectId(),
      title: module.title,
      description: module.description,
      teacherId: new mongoose.Types.ObjectId(ids.teacherId),
      templateModuleId: module.templateModuleId,
      courseId: new mongoose.Types.ObjectId(ids.courseId),
      moduleId: module._id,
      visible: module.visible,
      tags: module.tags,
      estimatedTime: module.estimatedTime,
      status: module.status,
      type: module.type,
      prerequisites: module.prerequisites,
      isReusable: true,
      usageCount: 0,
      content: {
        exercises: [] // Will be populated after teacher exercises are created
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    }));

    const teacherExercises = courseExercises.map(exercise => ({
      _id: new mongoose.Types.ObjectId(),
      title: exercise.title,
      content: exercise.content,
      type: exercise.type,
      teacherModuleId: null, // Will be set based on module relationship
      templateExerciseId: exercise.templateExerciseId,
      teacherId: new mongoose.Types.ObjectId(ids.teacherId),
      courseId: new mongoose.Types.ObjectId(ids.courseId),
      exerciseId: exercise._id,
      visible: exercise.visible,
      tags: exercise.tags,
      estimatedTime: exercise.estimatedTime,
      difficulty: exercise.difficulty,
      status: "active",
      isReusable: true,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    }));

    // Set teacherModuleId for each teacher exercise and populate teacher module exercises
    teacherExercises.forEach(teacherExercise => {
      // Find which module contains this exercise
      const module = courseModules.find(cm => 
        cm.content.exercises.some(exId => exId.toString() === teacherExercise.exerciseId.toString())
      );
      
      if (module) {
        // Find the corresponding teacher module
        const teacherModule = teacherModules.find(tm => 
          tm.moduleId.toString() === module._id.toString()
        );
        
        if (teacherModule) {
          teacherExercise.teacherModuleId = teacherModule._id;
          // Add this teacher exercise to the teacher module's content.exercises
          teacherModule.content.exercises.push(teacherExercise._id);
        }
      }
    });

    // Set teacherExerciseId for each student exercise
    studentExercises.forEach(studentExercise => {
      const teacherExercise = studentExercise.courseExerciseId ? 
        teacherExercises.find(te => te.exerciseId.toString() === studentExercise.courseExerciseId.toString()) : null;
      
      if (teacherExercise) {
        studentExercise.teacherExerciseId = teacherExercise._id;
      }
    });

    // Insert all data
    try {
      console.log('Inserting course enrollments...');
      await db.collection('course_enrollments').insertMany(courseEnrollments);
      console.log(`Inserted ${courseEnrollments.length} course enrollments`);
      
      console.log('Inserting student modules...');
      await db.collection('student_modules').insertMany(studentModules);
      console.log(`Inserted ${studentModules.length} student modules`);
      
      console.log('Inserting student exercises...');
      await db.collection('student_exercises').insertMany(studentExercises);
      console.log(`Inserted ${studentExercises.length} student exercises`);
      
      console.log('Inserting teacher modules...');
      await db.collection('teacher_modules').insertMany(teacherModules);
      console.log(`Inserted ${teacherModules.length} teacher modules`);
      
      console.log('Inserting teacher exercises...');
      await db.collection('teacher_exercises').insertMany(teacherExercises);
      console.log(`Inserted ${teacherExercises.length} teacher exercises`);
    } catch (error) {
      console.error('Error inserting data:', error.message);
      throw error;
    }

    // Create some demo notifications
    const notifications = [];
    /*
    courseEnrollments.forEach((enrollment, index) => {
      if (index < 3) { // Create notifications for first 3 students
        notifications.push({
          teacherId: new mongoose.Types.ObjectId(ids.teacherId),
          studentId: enrollment.studentId,
          courseId: enrollment.courseId,
          enrollmentId: enrollment._id,
          type: 'exercise_completed',
          title: 'Exercise Completed',
          message: `Student completed an exercise in "English for Beginners to Advanced" course`,
          priority: 1,
          isRead: false,
          metadata: {
            studentName: `Student ${index + 1}`,
            courseTitle: 'English for Beginners to Advanced',
            exerciseTitle: 'Programming Vocabulary Quiz'
          },
          createdAt: new Date(Date.now() - (index + 1) * 10 * 60 * 1000),
          updatedAt: new Date()
        });
      }
    }); */

    if (notifications.length > 0) {
      console.log('Inserting example notifications...');
      await db.collection('notifications').insertMany(notifications);
    }

    console.log('\nEnrollments and progress created successfully:');
    console.log(`Enrollments: ${courseEnrollments.length}`);
    console.log(`Student modules: ${studentModules.length}`);
    console.log(`Student exercises: ${studentExercises.length}`);
    console.log(`Teacher modules: ${teacherModules.length}`);
    console.log(`Teacher exercises: ${teacherExercises.length}`);
    console.log(`Notifications: ${notifications.length}`);

    // Update IDs file
    const updatedIds = {
      ...ids,
      enrollmentIds: enrollmentIds.map(id => id.toString())
    };
    
    fs.writeFileSync(idsFile, JSON.stringify(updatedIds, null, 2));
    console.log(`\nIDs updated in: ${idsFile}`);

    console.log('\nDemo environment setup complete!');
    console.log('\nENVIRONMENT SUMMARY:');
    console.log('Teacher: john@teacher.com (teacher123)');
    console.log('Administrator: admin@classroom.com (admin123)');
    console.log('Students: john.doe@student.com, jane.smith@student.com, mike.johnson@student.com, sarah.williams@student.com, david.brown@student.com, emma.davis@student.com (student123)');
    console.log('Course: English for Beginners to Advanced');
    console.log('Progress: Varied between students (10-90%)');
    console.log('Notifications: Configured for demonstration');

    console.log('\nReady!');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
createDemoEnrollments();