const mongoose = require('mongoose');
require('dotenv').config();

async function cleanDemoData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/classroom_assistant_example');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Collections to clean
    const collections = [
      'users',
      'courses',
      'course_modules',
      'course_exercises',
      'course_enrollments',
      'student_modules',
      'student_exercises',
      'teacher_modules',
      'teacher_exercises',
      'template_courses',
      'template_modules',
      'template_exercises',
      'notifications',
      'chats',
      'chat_messages'
    ];

    console.log('Cleaning demonstration data...');
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          await collection.deleteMany({});
          console.log(`${collectionName}: ${count} documents deleted`);
        } else {
          console.log(`${collectionName}: No data to delete`);
        }
      } catch (error) {
        console.log(`${collectionName}: Error cleaning - ${error.message}`);
      }
    }

    // Clean up demo-ids.json if exists
    const fs = require('fs');
    const path = require('path');
    const idsFile = path.join(__dirname, 'demo-ids.json');
    
    if (fs.existsSync(idsFile)) {
      fs.unlinkSync(idsFile);
      console.log('demo-ids.json file deleted');
    }

    console.log('\nCleanup completed!');
    console.log('Now you can run: node setup-demo-environment.js');

  } catch (error) {
    console.error('Error during cleanup:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
cleanDemoData();
