const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// DEPRECATION NOTICE:
// This script creates synthetic notifications with fake IDs.
// Prefer using 'create-demo-chats.js' (real chat/message-linked notifications)
// and 'create-demo-exercise-notifications.js' (real exercise-linked notifications).
// Keep this only for ad-hoc debugging.

async function createTestNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/classroom_assistant');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const notificationsCollection = db.collection('notifications');

    // Load IDs from demo-ids.json
    const idsFile = path.join(__dirname, 'demo-ids.json');
    if (!fs.existsSync(idsFile)) {
      throw new Error('demo-ids.json not found. Run create-demo-users.js and create-demo-course.js first');
    }
    const ids = JSON.parse(fs.readFileSync(idsFile, 'utf8'));

    // Use the exact IDs you provided
    const teacherId = new mongoose.Types.ObjectId('68ab2633611526305f4c1f88');
    const studentId = new mongoose.Types.ObjectId('68b1be108d2f6873fa038fc7');
    const courseId = new mongoose.Types.ObjectId(ids.courseId);
    const enrollmentId = new mongoose.Types.ObjectId('68bf1807135d170923058566');

    // Create test notifications
    const testNotifications = [
      {
        teacherId: teacherId,
        studentId: studentId,
        courseId: courseId,
        enrollmentId: enrollmentId,
        type: 'exercise_completed',
        title: 'Exercise Completed',
        message: 'Student completed exercise: Basic Algebra Problems',
        priority: 1,
        isRead: false,
        metadata: {
          exerciseId: new mongoose.Types.ObjectId(),
          exerciseTitle: 'Basic Algebra Problems',
          studentName: 'Student',
          courseTitle: 'Course'
        },
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
        updatedAt: new Date()
      },
      {
        teacherId: teacherId,
        studentId: studentId,
        courseId: courseId,
        enrollmentId: enrollmentId,
        type: 'exercise_completed',
        title: 'Exercise Completed',
        message: 'Student completed exercise: Quadratic Equations',
        priority: 1,
        isRead: false,
        metadata: {
          exerciseId: new mongoose.Types.ObjectId(),
          exerciseTitle: 'Quadratic Equations',
          studentName: 'Student',
          courseTitle: 'Course'
        },
        createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
        updatedAt: new Date()
      },
      {
        teacherId: teacherId,
        studentId: studentId,
        courseId: courseId,
        enrollmentId: enrollmentId,
        type: 'exercise_completed',
        title: 'Exercise Completed',
        message: 'Student completed exercise: Calculus Derivatives',
        priority: 1,
        isRead: false,
        metadata: {
          exerciseId: new mongoose.Types.ObjectId(),
          exerciseTitle: 'Calculus Derivatives',
          studentName: 'Student',
          courseTitle: 'Course'
        },
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
        updatedAt: new Date()
      },
      {
        teacherId: teacherId,
        studentId: studentId,
        courseId: courseId,
        enrollmentId: enrollmentId,
        type: 'message_received',
        title: 'New Message',
        message: 'Student: Hi teacher, I have a question about exercise 3...',
        priority: 2,
        isRead: false,
        metadata: {
          chatId: new mongoose.Types.ObjectId(),
          messageId: new mongoose.Types.ObjectId(),
          studentName: 'Student',
          courseTitle: 'Course'
        },
        createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago
        updatedAt: new Date()
      }
    ];

    // Insert notifications
    const result = await notificationsCollection.insertMany(testNotifications);
    
    console.log(`Created ${result.insertedCount} test notifications:`);
    testNotifications.forEach((notification, index) => {
      const timeAgo = Math.round((Date.now() - notification.createdAt.getTime()) / (1000 * 60));
      console.log(`   ${index + 1}. ${notification.type} - ${timeAgo}min ago`);
    });

    console.log('Test notifications generated successfully!');
    console.log('Check the notifications panel in your course view.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createTestNotifications();
