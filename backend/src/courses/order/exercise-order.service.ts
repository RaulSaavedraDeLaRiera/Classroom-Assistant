import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CourseExercise, CourseExerciseDocument } from '../schemas/course-exercise.schema';

@Injectable()
export class ExerciseOrderService {
  constructor(
    @InjectModel(CourseExercise.name) private courseExerciseModel: Model<CourseExerciseDocument>
  ) {}

  /**
   * Adds an exercise to the end of the module queue
   * @param moduleId - The module ID
   * @param exerciseId - The exercise ID to add
   */
  async addExerciseToModule(moduleId: string, exerciseId: string): Promise<void> {
    // Get all exercises for this module EXCEPT the one being added
    const moduleExercises = await this.courseExerciseModel
      .find({ 
        courseModuleId: new Types.ObjectId(moduleId), 
        visible: true,
        _id: { $ne: new Types.ObjectId(exerciseId) }
      })
      .exec();

    if (moduleExercises.length === 0) {
      // First exercise in module - set as head and tail
      await this.courseExerciseModel.findByIdAndUpdate(exerciseId, {
        previousExerciseId: null,
        nextExerciseId: null
      }).exec();
      return;
    }

    // Find the tail exercise (the one with no nextExerciseId)
    let tailExercise = moduleExercises.find(e => !e.nextExerciseId);
    
    // If no tail found, use the last created exercise as fallback
    if (!tailExercise) {
      tailExercise = moduleExercises.sort((a, b) => 
        new Date((a as any).createdAt).getTime() - new Date((b as any).createdAt).getTime()
      )[moduleExercises.length - 1];
    }

    if (tailExercise) {
      // Check if tailExercise is the same as the new exercise (should not happen)
      if (tailExercise._id.toString() === exerciseId) {
        return;
      }
      
      // Update the tail exercise to point to the new exercise
      await this.courseExerciseModel.findByIdAndUpdate(tailExercise._id, {
        nextExerciseId: new Types.ObjectId(exerciseId)
      }).exec();

      // Set the new exercise as the new tail
      await this.courseExerciseModel.findByIdAndUpdate(exerciseId, {
        previousExerciseId: new Types.ObjectId(tailExercise._id.toString()),
        nextExerciseId: null
      }).exec();
    }
  }

  /**
   * Adds an exercise to the module at a specific index (respecting module order)
   * @param moduleId - The module ID
   * @param exerciseId - The exercise ID to add
   * @param index - The position where the exercise should be placed
   */
  async addExerciseToModuleByIndex(moduleId: string, exerciseId: string, index: number): Promise<void> {
    // Get all exercises for this module
    const moduleExercises = await this.courseExerciseModel
      .find({ courseModuleId: new Types.ObjectId(moduleId), visible: true })
      .exec();

    if (moduleExercises.length === 0) {
      // First exercise in module - set as head and tail
      await this.courseExerciseModel.findByIdAndUpdate(exerciseId, {
        previousExerciseId: null,
        nextExerciseId: null
      }).exec();
      return;
    }

    if (index === 0) {
      // Insert at the beginning
      const currentHead = moduleExercises.find(e => !e.previousExerciseId);
      if (currentHead) {
        // Update current head to point to new exercise
        await this.courseExerciseModel.findByIdAndUpdate(currentHead._id, {
          previousExerciseId: new Types.ObjectId(exerciseId)
        }).exec();
        
        // Set new exercise as new head
        await this.courseExerciseModel.findByIdAndUpdate(exerciseId, {
          previousExerciseId: null,
          nextExerciseId: currentHead._id
        }).exec();
      }
    } else if (index >= moduleExercises.length) {
      // Insert at the end
      const currentTail = moduleExercises.find(e => !e.nextExerciseId);
      
      if (currentTail) {
        // Check if currentTail is the same as the new exercise (should not happen)
        if (currentTail._id.toString() === exerciseId) {
          return;
        }
        
        // Update current tail to point to new exercise
        await this.courseExerciseModel.findByIdAndUpdate(currentTail._id, {
          nextExerciseId: new Types.ObjectId(exerciseId)
        }).exec();
        
        // Set new exercise as new tail
        await this.courseExerciseModel.findByIdAndUpdate(exerciseId, {
          previousExerciseId: currentTail._id,
          nextExerciseId: null
        }).exec();
      }
    } else {
      // Insert at specific position
      const targetExercise = moduleExercises[index];
      if (targetExercise) {
        const previousExercise = moduleExercises[index - 1];
        
        // Update previous exercise to point to new exercise
        if (previousExercise) {
          await this.courseExerciseModel.findByIdAndUpdate(previousExercise._id, {
            nextExerciseId: new Types.ObjectId(exerciseId)
          }).exec();
        }
        
        // Update target exercise to point to new exercise
        await this.courseExerciseModel.findByIdAndUpdate(targetExercise._id, {
          previousExerciseId: new Types.ObjectId(exerciseId)
        }).exec();
        
        // Set new exercise between previous and target
        await this.courseExerciseModel.findByIdAndUpdate(exerciseId, {
          previousExerciseId: previousExercise ? previousExercise._id : null,
          nextExerciseId: targetExercise._id
        }).exec();
      }
    }
  }

  /**
   * Removes an exercise from the module queue and reconnects the chain
   * @param exerciseId - The exercise ID to remove
   */
  async removeExerciseFromModule(exerciseId: string): Promise<void> {
    const exercise = await this.courseExerciseModel.findById(exerciseId).exec();
    if (!exercise) return;

    const previousExerciseId = exercise.previousExerciseId;
    const nextExerciseId = exercise.nextExerciseId;

    // Update previous exercise to point to next exercise
    if (previousExerciseId) {
      await this.courseExerciseModel.findByIdAndUpdate(previousExerciseId, {
        nextExerciseId: nextExerciseId
      }).exec();
    }

    // Update next exercise to point to previous exercise
    if (nextExerciseId) {
      await this.courseExerciseModel.findByIdAndUpdate(nextExerciseId, {
        previousExerciseId: previousExerciseId
      }).exec();
    }

    // Clear the removed exercise's references
    await this.courseExerciseModel.findByIdAndUpdate(exerciseId, {
      previousExerciseId: null,
      nextExerciseId: null
    }).exec();
  }

  /**
   * Reorders an exercise by updating its previous and next references
   * @param exerciseId - The exercise ID to reorder
   * @param previousExerciseId - The new previous exercise ID (null for first position)
   * @param nextExerciseId - The new next exercise ID (null for last position)
   */
  async reorderExercise(exerciseId: string, previousExerciseId: string | null, nextExerciseId: string | null): Promise<void> {
    // Get the exercise to reorder
    const exercise = await this.courseExerciseModel.findById(exerciseId).exec();
    if (!exercise) {
      console.error(`Exercise ${exerciseId} not found`);
      return;
    }

    // Store current references for cleanup
    const currentPrevId = exercise.previousExerciseId;
    const currentNextId = exercise.nextExerciseId;

    // Update the exercise with new references
    await this.courseExerciseModel.findByIdAndUpdate(exerciseId, {
      previousExerciseId: previousExerciseId ? new Types.ObjectId(previousExerciseId) : null,
      nextExerciseId: nextExerciseId ? new Types.ObjectId(nextExerciseId) : null
    }).exec();

    // Update the new previous exercise to point to this exercise
    if (previousExerciseId) {
      await this.courseExerciseModel.findByIdAndUpdate(previousExerciseId, {
        nextExerciseId: new Types.ObjectId(exerciseId)
      }).exec();
    } else {
      // This exercise is now the root (first), so we need to update the old root
      // Find any exercise that currently points to this exercise as previous
      const oldRootExercise = await this.courseExerciseModel.findOne({
        previousExerciseId: new Types.ObjectId(exerciseId)
      }).exec();
      
      if (oldRootExercise) {
        await this.courseExerciseModel.findByIdAndUpdate(oldRootExercise._id, {
          previousExerciseId: null
        }).exec();
      }
    }

    // Update the new next exercise to point to this exercise
    if (nextExerciseId) {
      await this.courseExerciseModel.findByIdAndUpdate(nextExerciseId, {
        previousExerciseId: new Types.ObjectId(exerciseId)
      }).exec();
    } else {
      // This exercise is now the last, so we need to update the old last exercise
      // Find any exercise that currently points to this exercise as next
      const oldLastExercise = await this.courseExerciseModel.findOne({
        nextExerciseId: new Types.ObjectId(exerciseId)
      }).exec();
      
      if (oldLastExercise) {
        await this.courseExerciseModel.findByIdAndUpdate(oldLastExercise._id, {
          nextExerciseId: null
        }).exec();
      }
    }

    // Clean up old references - connect the exercises that were previously connected to this one
    if (currentPrevId) {
      await this.courseExerciseModel.findByIdAndUpdate(currentPrevId, {
        nextExerciseId: currentNextId
      }).exec();
    }

    if (currentNextId) {
      await this.courseExerciseModel.findByIdAndUpdate(currentNextId, {
        previousExerciseId: currentPrevId
      }).exec();
    }
  }

  /**
   * Gets all exercises for a module in their correct order
   * @param moduleId - The module ID
   * @returns Array of ordered exercises
   */
  async getOrderedExercises(moduleId: string): Promise<CourseExercise[]> {
    const exercises = await this.courseExerciseModel
      .find({ courseModuleId: new Types.ObjectId(moduleId), visible: true })
      .exec();

    if (exercises.length === 0) return [];

    // Find the head (first exercise - no previousExerciseId)
    let head = exercises.find(e => !e.previousExerciseId);
    if (!head) {
      // Fallback: use first created exercise if no linked list exists
      head = exercises.sort((a, b) => 
        new Date((a as any).createdAt).getTime() - new Date((b as any).createdAt).getTime()
      )[0];
    }

    const orderedExercises: CourseExercise[] = [];
    let current = head;
    let visitedCount = 0;
    const maxIterations = exercises.length; // Prevent infinite loops

    // Traverse the linked list to build ordered array
    while (current && visitedCount < maxIterations) {
      orderedExercises.push(current);
      visitedCount++;
      
      // Find next exercise
      if (current.nextExerciseId) {
        current = exercises.find(e => (e as any)._id.equals(current.nextExerciseId));
      } else {
        current = null; // End of chain
      }
    }

    // If we didn't visit all exercises, there might be a broken chain
    // Return exercises in creation order as fallback
    if (orderedExercises.length < exercises.length) {
      return exercises.sort((a, b) => 
        new Date((a as any).createdAt).getTime() - new Date((b as any).createdAt).getTime()
      );
    }

    return orderedExercises;
  }

  /**
   * Reorders an exercise by inserting it at a specific index within its module
   */
  async reorderExerciseByIndex(moduleId: string, exerciseId: string, targetIndex: number): Promise<void> {
    const ordered = await this.getOrderedExercises(moduleId);
    if (ordered.length === 0) return;

    const ids = ordered.map(e => (e as any)._id.toString());
    const fromIndex = ids.indexOf(exerciseId);
    if (fromIndex === -1) return;

    if (targetIndex === fromIndex) return; // No-op

    const list = ids.slice();
    list.splice(fromIndex, 1);
    const clampedIndex = Math.max(0, Math.min(targetIndex, list.length));
    list.splice(clampedIndex, 0, exerciseId);

    // Rewrite the entire chain to avoid edge-case inconsistencies (especially with 2 items)
    await this.setExerciseOrder(moduleId, list);
  }

  /**
   * Sets the entire exercise order for a module based on the provided ordered IDs
   */
  private async setExerciseOrder(moduleId: string, orderedIds: string[]): Promise<void> {
    // Validate all IDs belong to the module
    const exercises = await this.courseExerciseModel
      .find({ courseModuleId: new Types.ObjectId(moduleId), visible: true })
      .exec();
    const exerciseIdSet = new Set(exercises.map(e => e._id.toString()));
    const filtered = orderedIds.filter(id => exerciseIdSet.has(id));
    if (filtered.length === 0) return;

    // Apply previous/next pointers deterministically
    for (let i = 0; i < filtered.length; i++) {
      const prevId = i > 0 ? filtered[i - 1] : null;
      const nextId = i < filtered.length - 1 ? filtered[i + 1] : null;
      await this.courseExerciseModel.findByIdAndUpdate(filtered[i], {
        previousExerciseId: prevId ? new Types.ObjectId(prevId) : null,
        nextExerciseId: nextId ? new Types.ObjectId(nextId) : null,
      }).exec();
    }
  }

  /**
   * Cleans up duplicate exercises in a module and repairs the linked list
   * @param moduleId - The module ID to clean up
   */
  async cleanupDuplicateExercises(moduleId: string): Promise<void> {
    // Get all exercises for this module
    const exercises = await this.courseExerciseModel
      .find({ courseModuleId: new Types.ObjectId(moduleId), visible: true })
      .exec();
    
    if (exercises.length === 0) return;
    
    // Group exercises by ID to find duplicates
    const exerciseGroups = new Map<string, any[]>();
    exercises.forEach(exercise => {
      const id = exercise._id.toString();
      if (!exerciseGroups.has(id)) {
        exerciseGroups.set(id, []);
      }
      exerciseGroups.get(id)!.push(exercise);
    });
    
    // Find and remove duplicates
    for (const [id, exerciseList] of exerciseGroups) {
      if (exerciseList.length > 1) {
        // Keep the first one, remove the rest
        const [keepExercise, ...duplicates] = exerciseList;
        
        for (const duplicate of duplicates) {
          // Get the duplicate's neighbors
          const prevId = duplicate.previousExerciseId;
          const nextId = duplicate.nextExerciseId;
          
          // Update neighbors to skip the duplicate
          if (prevId) {
            await this.courseExerciseModel.findByIdAndUpdate(prevId, {
              nextExerciseId: nextId
            }).exec();
          }
          
          if (nextId) {
            await this.courseExerciseModel.findByIdAndUpdate(nextId, {
              previousExerciseId: prevId
            }).exec();
          }
          
          // Remove the duplicate from the database
          await this.courseExerciseModel.findByIdAndDelete(duplicate._id).exec();
        }
      }
    }
  }
}
