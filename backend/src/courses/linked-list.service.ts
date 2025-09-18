import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';

export interface LinkedListItem {
  _id: Types.ObjectId;
  [key: string]: any;
}

@Injectable()
export class LinkedListService {
  /**
   * Adds an item to the end of a linked list
   * @param model - The Mongoose model to update
   * @param itemId - The ID of the item to add
   * @param previousField - The field name for previous reference
   * @param nextField - The field name for next reference
   * @param filter - Additional filter criteria
   */
  async addToEnd<T extends LinkedListItem>(
    model: Model<T>,
    itemId: string,
    previousField: string,
    nextField: string,
    filter: any
  ): Promise<void> {
    const existingItems = await model.find({
      ...filter,
      _id: { $ne: new Types.ObjectId(itemId) }
    }).exec();

    if (existingItems.length === 0) {
      // First item - set as head and tail
      await model.findByIdAndUpdate(itemId, {
        $set: {
          [previousField]: null,
          [nextField]: null
        }
      } as any).exec();
      return;
    }

    // Find the tail item (no nextId)
    let tailItem = existingItems.find(item => !item[nextField]);
    
    // Fallback to last created item if no tail found
    if (!tailItem) {
      tailItem = existingItems.sort((a, b) =>
        new Date((a as any).createdAt).getTime() - new Date((b as any).createdAt).getTime()
      )[existingItems.length - 1];
    }

    if (tailItem) {
      // Update tail to point to new item
      await model.findByIdAndUpdate(tailItem._id, {
        $set: {
          [nextField]: new Types.ObjectId(itemId)
        }
      } as any).exec();

      // Set new item as new tail
      await model.findByIdAndUpdate(itemId, {
        $set: {
          [previousField]: tailItem._id,
          [nextField]: null
        }
      } as any).exec();
    }
  }

  /**
   * Removes an item from the linked list and reconnects the chain
   * @param model - The Mongoose model to update
   * @param itemId - The ID of the item to remove
   * @param previousField - The field name for previous reference
   * @param nextField - The field name for next reference
   */
  async removeFromList<T extends LinkedListItem>(
    model: Model<T>,
    itemId: string,
    previousField: string,
    nextField: string
  ): Promise<void> {
    const item = await model.findById(itemId).exec();
    if (!item) return;

    const previousId = item[previousField];
    const nextId = item[nextField];

    // Update previous item to point to next item
    if (previousId) {
      await model.findByIdAndUpdate(previousId, {
        $set: {
          [nextField]: nextId
        }
      } as any).exec();
    }

    // Update next item to point to previous item
    if (nextId) {
      await model.findByIdAndUpdate(nextId, {
        $set: {
          [previousField]: previousId
        }
      } as any).exec();
    }

    // Clear the removed item's references
    await model.findByIdAndUpdate(itemId, {
      $set: {
        [previousField]: null,
        [nextField]: null
      }
    } as any).exec();
  }

  /**
   * Gets all items in their correct order by following the linked list
   * @param model - The Mongoose model to query
   * @param filter - Filter criteria for finding items
   * @param previousField - The field name for previous reference
   * @param nextField - The field name for next reference
   * @returns Array of ordered items
   */
  async getOrderedItems<T extends LinkedListItem>(
    model: Model<T>,
    filter: any,
    previousField: string,
    nextField: string
  ): Promise<T[]> {
    const items = await model.find(filter).exec();

    if (items.length === 0) return [];

    // Find the head (first item - no previousId)
    let head = items.find(item => !item[previousField]);
    if (!head) {
      // Fallback: use first created item if no linked list exists
      head = items.sort((a, b) => 
        new Date((a as any).createdAt).getTime() - new Date((b as any).createdAt).getTime()
      )[0];
    }

    const orderedItems: T[] = [];
    let current = head;
    let visitedCount = 0;
    const maxIterations = items.length; // Prevent infinite loops

    // Traverse the linked list to build ordered array
    while (current && visitedCount < maxIterations) {
      orderedItems.push(current);
      visitedCount++;
      
      // Find next item
      if (current[nextField]) {
        current = items.find(item => (item as any)._id.equals(current[nextField]));
      } else {
        current = null; // End of chain
      }
    }

    // If we didn't visit all items, there might be a broken chain
    // Return items in creation order as fallback
    if (orderedItems.length < items.length) {
      return items.sort((a, b) => 
        new Date((a as any).createdAt).getTime() - new Date((b as any).createdAt).getTime()
      );
    }

    return orderedItems;
  }

  /**
   * Reorders an item by updating its previous and next references
   * @param model - The Mongoose model to update
   * @param itemId - The ID of the item to reorder
   * @param previousId - The new previous item ID (null for first position)
   * @param nextId - The new next item ID (null for last position)
   * @param previousField - The field name for previous reference
   * @param nextField - The field name for next reference
   */
  async reorderItem<T extends LinkedListItem>(
    model: Model<T>,
    itemId: string,
    previousId: string | null,
    nextId: string | null,
    previousField: string,
    nextField: string
  ): Promise<void> {
    const item = await model.findById(itemId).exec();
    if (!item) return;

    // Store current references for cleanup
    const currentPrevId = item[previousField];
    const currentNextId = item[nextField];

    // Update the item with new references
    await model.findByIdAndUpdate(itemId, {
      $set: {
        [previousField]: previousId ? new Types.ObjectId(previousId) : null,
        [nextField]: nextId ? new Types.ObjectId(nextId) : null
      }
    } as any).exec();

    // Update the new previous item to point to this item
    if (previousId) {
      await model.findByIdAndUpdate(previousId, {
        $set: {
          [nextField]: new Types.ObjectId(itemId)
        }
      } as any).exec();
    }

    // Update the new next item to point to this item
    if (nextId) {
      await model.findByIdAndUpdate(nextId, {
        $set: {
          [previousField]: new Types.ObjectId(itemId)
        }
      } as any).exec();
    }

    // Clean up old references
    if (currentPrevId) {
      await model.findByIdAndUpdate(currentPrevId, {
        $set: {
          [nextField]: currentNextId
        }
      } as any).exec();
    }

    if (currentNextId) {
      await model.findByIdAndUpdate(currentNextId, {
        $set: {
          [previousField]: currentPrevId
        }
      } as any).exec();
    }
  }
}
