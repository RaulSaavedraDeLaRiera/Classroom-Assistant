const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createDemoUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/classroom_assistant_example');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Generate ObjectIds for consistency
    const teacherId = new mongoose.Types.ObjectId();
    const adminId = new mongoose.Types.ObjectId();

    // Hash passwords
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    // Demo users data
    const demoUsers = [
      {
        _id: teacherId,
        name: "John Teacher",
        email: "john@teacher.com",
        password: teacherPassword,
        role: "teacher",
        active: true,
        visible: true,
        tags: ["english", "intermediate"],
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: adminId,
        name: "System Administrator",
        email: "admin@classroom.com",
        password: adminPassword,
        role: "admin",
        active: true,
        visible: true,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: "John Doe",
        email: "john.doe@student.com",
        password: await bcrypt.hash('student123', 10),
        role: "student",
        active: true,
        visible: true,
        tags: ["english", "beginner"],
        teacherIds: [teacherId],
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Jane Smith",
        email: "jane.smith@student.com",
        password: await bcrypt.hash('student123', 10),
        role: "student",
        active: true,
        visible: true,
        tags: ["english", "intermediate"],
        teacherIds: [teacherId],
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Mike Johnson",
        email: "mike.johnson@student.com",
        password: await bcrypt.hash('student123', 10),
        role: "student",
        active: true,
        visible: true,
        tags: ["english", "beginner"],
        teacherIds: [teacherId],
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Sarah Williams",
        email: "sarah.williams@student.com",
        password: await bcrypt.hash('student123', 10),
        role: "student",
        active: true,
        visible: true,
        tags: ["english", "intermediate"],
        teacherIds: [teacherId],
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: "David Brown",
        email: "david.brown@student.com",
        password: await bcrypt.hash('student123', 10),
        role: "student",
        active: true,
        visible: true,
        tags: ["english", "advanced"],
        teacherIds: [teacherId],
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Emma Davis",
        email: "emma.davis@student.com",
        password: await bcrypt.hash('student123', 10),
        role: "student",
        active: true,
        visible: true,
        tags: ["english", "intermediate"],
        teacherIds: [teacherId],
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      }
    ];

    // Clear existing users (optional - comment out if you want to keep existing data)
    console.log('Clearing existing users...');
    await usersCollection.deleteMany({});

    // Insert demo users
    const result = await usersCollection.insertMany(demoUsers);
    
    console.log(`\nCreated ${result.insertedCount} demonstration users:`);
    console.log('\nTEACHER:');
    console.log('   Email: john@teacher.com');
    console.log('   Password: teacher123');
    console.log(`   ID: ${teacherId}`);
    
    console.log('\nADMIN:');
    console.log('   Email: admin@classroom.com');
    console.log('   Password: admin123');
    console.log(`   ID: ${adminId}`);
    
    console.log('\nSTUDENTS:');
    demoUsers.filter(u => u.role === 'student').forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.name} (${student.email}) - Password: student123`);
    });

    console.log('\nNext steps:');
    console.log('   1. Run: node create-demo-course.js');
    console.log('   2. Run: node create-demo-enrollments.js');
    console.log('   3. Or run everything together: node setup-demo-environment.js');

    // Save IDs for other scripts
    const fs = require('fs');
    const path = require('path');
    const idsFile = path.join(__dirname, 'demo-ids.json');
    fs.writeFileSync(idsFile, JSON.stringify({
      teacherId: teacherId.toString(),
      adminId: adminId.toString(),
      studentIds: demoUsers.filter(u => u.role === 'student').map(u => u._id.toString())
    }, null, 2));

    console.log(`\nIDs saved to: ${idsFile}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
createDemoUsers();