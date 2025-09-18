import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CourseModule, CourseModuleDocument } from '../schemas/course-module.schema';
import { Course, CourseDocument } from '../schemas/course.schema';

@Injectable()
export class ModuleOrderService {
  constructor(
    @InjectModel(CourseModule.name) private courseModuleModel: Model<CourseModuleDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>
  ) {}

  /**
   * Adds a module to the end of the course queue
   * @param courseId - The course ID
   * @param moduleId - The module ID to add
   */
  async addModuleToCourse(courseId: string, moduleId: string): Promise<void> {
    // Get all modules for this course EXCEPT the one being added
    const courseModules = await this.courseModuleModel
      .find({
        courseId: new Types.ObjectId(courseId),
        visible: true,
        _id: { $ne: new Types.ObjectId(moduleId) }
      })
      .exec();

    if (courseModules.length === 0) {
      // First module in course - set as head and tail
      await this.courseModuleModel.findByIdAndUpdate(moduleId, {
        previousModuleId: null,
        nextModuleId: null
      }).exec();
      return;
    }

    // Find the tail module (the one with no nextModuleId)
    let tailModule = courseModules.find(m => !m.nextModuleId);

    // If no tail found, use the last created module as fallback
    if (!tailModule) {
      tailModule = courseModules.sort((a, b) =>
        new Date((a as any).createdAt).getTime() - new Date((b as any).createdAt).getTime()
      )[courseModules.length - 1];
    }

    if (tailModule) {
      // Update the tail module to point to the new module
      await this.courseModuleModel.findByIdAndUpdate(tailModule._id, {
        nextModuleId: new Types.ObjectId(moduleId)
      }).exec();

      // Set the new module as the new tail
      await this.courseModuleModel.findByIdAndUpdate(moduleId, {
        previousModuleId: new Types.ObjectId(tailModule._id.toString()),
        nextModuleId: null
      }).exec();
    }
  }

  /**
   * Adds a module to the course at a specific index (respecting selection order)
   * @param courseId - The course ID
   * @param moduleId - The module ID to add
   * @param index - The position where the module should be placed
   */
  async addModuleToCourseByIndex(courseId: string, moduleId: string, index: number): Promise<void> {
    // Get all modules for this course EXCEPT the one being added
    const courseModules = await this.courseModuleModel
      .find({
        courseId: new Types.ObjectId(courseId),
        visible: true,
        _id: { $ne: new Types.ObjectId(moduleId) }
      })
      .exec();

    if (courseModules.length === 0) {
      // First module in course - set as head and tail
      await this.courseModuleModel.findByIdAndUpdate(moduleId, {
        previousModuleId: null,
        nextModuleId: null
      }).exec();
      return;
    }

    if (index === 0) {
      // Insert at the beginning
      const currentHead = courseModules.find(m => !m.previousModuleId);
      if (currentHead) {
        // Update current head to point to new module
        await this.courseModuleModel.findByIdAndUpdate(currentHead._id, {
          previousModuleId: new Types.ObjectId(moduleId)
        }).exec();
        
        // Set new module as new head
        await this.courseModuleModel.findByIdAndUpdate(moduleId, {
          previousModuleId: null,
          nextModuleId: currentHead._id
        }).exec();
      }
    } else if (index >= courseModules.length) {
      // Insert at the end
      const currentTail = courseModules.find(m => !m.nextModuleId);
      if (currentTail) {
        // Update current tail to point to new module
        await this.courseModuleModel.findByIdAndUpdate(currentTail._id, {
          nextModuleId: new Types.ObjectId(moduleId)
        }).exec();
        
        // Set new module as new tail
        await this.courseModuleModel.findByIdAndUpdate(moduleId, {
          previousModuleId: currentTail._id,
          nextModuleId: null
        }).exec();
      }
    } else {
      // Insert at specific position
      const targetModule = courseModules[index];
      if (targetModule) {
        const previousModule = courseModules[index - 1];
        
        // Update previous module to point to new module
        if (previousModule) {
          await this.courseModuleModel.findByIdAndUpdate(previousModule._id, {
            nextModuleId: new Types.ObjectId(moduleId)
          }).exec();
        }
        
        // Update target module to point to new module
        await this.courseModuleModel.findByIdAndUpdate(targetModule._id, {
          previousModuleId: new Types.ObjectId(moduleId)
        }).exec();
        
        // Set new module between previous and target
        await this.courseModuleModel.findByIdAndUpdate(moduleId, {
          previousModuleId: previousModule ? previousModule._id : null,
          nextModuleId: targetModule._id
        }).exec();
      }
    }
  }

  /**
   * Removes a module from the course queue and reconnects the chain
   * @param moduleId - The module ID to remove
   */
  async removeModuleFromCourse(moduleId: string): Promise<void> {
    const module = await this.courseModuleModel.findById(moduleId).exec();
    if (!module) return;

    const previousModuleId = module.previousModuleId;
    const nextModuleId = module.nextModuleId;

    // Update previous module to point to next module
    if (previousModuleId) {
      await this.courseModuleModel.findByIdAndUpdate(previousModuleId, {
        nextModuleId: nextModuleId
      }).exec();
    }

    // Update next module to point to previous module
    if (nextModuleId) {
      await this.courseModuleModel.findByIdAndUpdate(nextModuleId, {
        previousModuleId: previousModuleId
      }).exec();
    }

    // Clear the removed module's references
    await this.courseModuleModel.findByIdAndUpdate(moduleId, {
      previousModuleId: null,
      nextModuleId: null
    }).exec();
  }

  /**
   * Reorders a module by updating its previous and next references
   * @param moduleId - The module ID to reorder
   * @param previousModuleId - The new previous module ID (null for first position)
   * @param nextModuleId - The new next module ID (null for last position)
   */
  async reorderModule(moduleId: string, previousModuleId: string | null, nextModuleId: string | null): Promise<void> {
    // Get the module to reorder
    const module = await this.courseModuleModel.findById(moduleId).exec();
    if (!module) {
      console.error(`Module ${moduleId} not found`);
      return;
    }

    // Store current references for cleanup
    const currentPrevId = module.previousModuleId;
    const currentNextId = module.nextModuleId;

    // Update the module with new references
    await this.courseModuleModel.findByIdAndUpdate(moduleId, {
      previousModuleId: previousModuleId ? new Types.ObjectId(previousModuleId) : null,
      nextModuleId: nextModuleId ? new Types.ObjectId(nextModuleId) : null
    }).exec();

    // Update the new previous module to point to this module
    if (previousModuleId) {
      await this.courseModuleModel.findByIdAndUpdate(previousModuleId, {
        nextModuleId: new Types.ObjectId(moduleId)
      }).exec();
    } else {
      // This module is now the root (first), so we need to update the old root
      // Find any module that currently points to this module as previous
      const oldRootModule = await this.courseModuleModel.findOne({
        previousModuleId: new Types.ObjectId(moduleId)
      }).exec();
      
      if (oldRootModule) {
        await this.courseModuleModel.findByIdAndUpdate(oldRootModule._id, {
          previousModuleId: null
        }).exec();
      }
    }

    // Update the new next module to point to this module
    if (nextModuleId) {
      await this.courseModuleModel.findByIdAndUpdate(nextModuleId, {
        previousModuleId: new Types.ObjectId(moduleId)
      }).exec();
    } else {
      // This module is now the last, so we need to update the old last module
      // Find any module that currently points to this module as next
      const oldLastModule = await this.courseModuleModel.findOne({
        nextModuleId: new Types.ObjectId(moduleId)
      }).exec();
      
      if (oldLastModule) {
        await this.courseModuleModel.findByIdAndUpdate(oldLastModule._id, {
          nextModuleId: null
        }).exec();
      }
    }

    // Clean up old references - connect the modules that were previously connected to this one
    if (currentPrevId) {
      await this.courseModuleModel.findByIdAndUpdate(currentPrevId, {
        nextModuleId: currentNextId
      }).exec();
    }

    if (currentNextId) {
      await this.courseModuleModel.findByIdAndUpdate(currentNextId, {
        previousModuleId: currentPrevId
      }).exec();
    }
  }

  /**
   * Gets all modules for a course in their correct order
   * @param courseId - The course ID
   * @returns Array of ordered modules
   */
  async getOrderedModules(courseId: string): Promise<CourseModule[]> {
    const modules = await this.courseModuleModel
      .find({ courseId: new Types.ObjectId(courseId), visible: true })
      .exec();

    if (modules.length === 0) return [];

    // Find the head (first module - no previousModuleId)
    let head = modules.find(m => !m.previousModuleId);
    if (!head) {
      // Fallback: use first created module if no linked list exists
      head = modules.sort((a, b) => 
        new Date((a as any).createdAt).getTime() - new Date((b as any).createdAt).getTime()
      )[0];
    }

    const orderedModules: CourseModule[] = [];
    let current = head;
    let visitedCount = 0;
    const maxIterations = modules.length; // Prevent infinite loops

    // Traverse the linked list to build ordered array
    while (current && visitedCount < maxIterations) {
      orderedModules.push(current);
      visitedCount++;
      
      // Find next module
      if (current.nextModuleId) {
        current = modules.find(m => (m as any)._id.equals(current.nextModuleId));
      } else {
        current = null; // End of chain
      }
    }

    // If we didn't visit all modules, there might be a broken chain
    // Return modules in creation order as fallback
    if (orderedModules.length < modules.length) {
      return modules.sort((a, b) => 
        new Date((a as any).createdAt).getTime() - new Date((b as any).createdAt).getTime()
      );
    }

    return orderedModules;
  }

  /**
   * Reorders a module by inserting it at a specific index within its course
   */
  async reorderModuleByIndex(courseId: string, moduleId: string, targetIndex: number): Promise<void> {
    const ordered = await this.getOrderedModules(courseId);
    if (ordered.length === 0) return;

    const ids = ordered.map(m => (m as any)._id.toString());
    const fromIndex = ids.indexOf(moduleId);
    if (fromIndex === -1) return;

    if (targetIndex === fromIndex) return; // No-op

    const list = ids.slice();
    list.splice(fromIndex, 1);
    const clampedIndex = Math.max(0, Math.min(targetIndex, list.length));
    list.splice(clampedIndex, 0, moduleId);

    const idx = list.indexOf(moduleId);
    const previousModuleId = idx > 0 ? list[idx - 1] : null;
    const nextModuleId = idx < list.length - 1 ? list[idx + 1] : null;

    // Rewrite the entire chain to avoid edge-case inconsistencies (especially with 2 items)
    await this.setModuleOrder(courseId, list);
  }

  /**
   * Sets the entire module order for a course based on the provided ordered IDs
   */
  private async setModuleOrder(courseId: string, orderedIds: string[]): Promise<void> {
    // Validate all IDs belong to the course
    const modules = await this.courseModuleModel
      .find({ courseId: new Types.ObjectId(courseId), visible: true })
      .exec();
    const moduleIdSet = new Set(modules.map(m => m._id.toString()));
    const filtered = orderedIds.filter(id => moduleIdSet.has(id));
    if (filtered.length === 0) return;

    // Apply previous/next pointers deterministically
    for (let i = 0; i < filtered.length; i++) {
      const prevId = i > 0 ? filtered[i - 1] : null;
      const nextId = i < filtered.length - 1 ? filtered[i + 1] : null;
      await this.courseModuleModel.findByIdAndUpdate(filtered[i], {
        previousModuleId: prevId ? new Types.ObjectId(prevId) : null,
        nextModuleId: nextId ? new Types.ObjectId(nextId) : null,
      }).exec();
    }
  }

  /**
   * Cleans up duplicate modules in a course and repairs the linked list
   * @param courseId - The course ID to clean up
   */
  async cleanupDuplicateModules(courseId: string): Promise<void> {
    // Get all modules for this course
    const modules = await this.courseModuleModel
      .find({ courseId: new Types.ObjectId(courseId), visible: true })
      .exec();
    
    if (modules.length === 0) return;
    
    // Group modules by ID to find duplicates
    const moduleGroups = new Map<string, any[]>();
    modules.forEach(module => {
      const id = module._id.toString();
      if (!moduleGroups.has(id)) {
        moduleGroups.set(id, []);
      }
      moduleGroups.get(id)!.push(module);
    });
    
    // Find and remove duplicates
    for (const [id, moduleList] of moduleGroups) {
      if (moduleList.length > 1) {
        // Keep the first one, remove the rest
        const [keepModule, ...duplicates] = moduleList;
        
        for (const duplicate of duplicates) {
          // Get the duplicate's neighbors
          const prevId = duplicate.previousModuleId;
          const nextId = duplicate.nextModuleId;
          
          // Update neighbors to skip the duplicate
          if (prevId) {
            await this.courseModuleModel.findByIdAndUpdate(prevId, {
              nextModuleId: nextId
            }).exec();
          }
          
          if (nextId) {
            await this.courseModuleModel.findByIdAndUpdate(nextId, {
              previousModuleId: prevId
            }).exec();
          }
          
          // Remove the duplicate from the database
          await this.courseModuleModel.findByIdAndDelete(duplicate._id).exec();
        }
      }
    }
  }
}
