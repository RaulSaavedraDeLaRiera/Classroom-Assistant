const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

async function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    console.log(`\nRunning: ${scriptName}`);
    console.log('='.repeat(50));
    
    exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running ${scriptName}:`, error.message);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`Warnings in ${scriptName}:`, stderr);
      }
      
      console.log(stdout);
      console.log(`\n${scriptName} completed successfully`);
      resolve();
    });
  });
}

async function setupDemoEnvironment() {
  try {
    console.log('CLASSROOM ASSISTANT - DEMO ENVIRONMENT SETUP');
    console.log('='.repeat(60));
    console.log('This script will create a complete environment with:');
    console.log('Teacher: john@teacher.com');
    console.log('Administrator: admin@classroom.com');
    console.log('Students: John Doe, Jane Smith, Mike Johnson, Sarah Williams, David Brown, Emma Davis');
    console.log('Course: English for Beginners to Advanced');
    console.log('Templates: Correctly connected');
    console.log('Notifications: Configured');
    console.log('='.repeat(60));

    // Check if .env file exists
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
      console.log('\n.env file not found');
      console.log('Creating .env file with default configuration...');
      
      const defaultEnv = `MONGO_URI=mongodb://localhost:27017/classroom_assistant_example
JWT_SECRET=a-magic-secret-key
NODE_ENV=development`;
      
      fs.writeFileSync(envPath, defaultEnv);
      console.log('.env file created. Adjust MONGO_URI if necessary.');
    }

    // Run scripts in order
    const scripts = [
      'create-demo-users.js',
      'create-demo-templates.js', 
      'create-demo-course.js',
      // Insert manual exercises for M1/M2 before generating enrollments
      'create-manual-exercises.js',
      'create-demo-enrollments.js',
      'create-demo-chats.js',
      'create-demo-exercise-notifications.js'
    ];

    for (const script of scripts) {
      await runScript(script);
      console.log('\nWaiting 2 seconds before next script...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Keep demo-ids.json file for reference (don't delete it)
    const idsFile = path.join(__dirname, 'demo-ids.json');
    if (fs.existsSync(idsFile)) {
      console.log('\nDemo IDs file preserved for reference');
    }

    console.log('\nDEMO ENVIRONMENT SETUP COMPLETED!');
    console.log('='.repeat(60));
    console.log('\nACCESS CREDENTIALS:');
    console.log('\nTEACHER:');
    console.log('   Email: john@teacher.com');
    console.log('   Password: teacher123');
    console.log('\nADMINISTRATOR:');
    console.log('   Email: admin@classroom.com');
    console.log('   Password: admin123');
    console.log('\nSTUDENTS (all use password: student123):');
    console.log('   • john.doe@student.com');
    console.log('   • jane.smith@student.com');
    console.log('   • mike.johnson@student.com');
    console.log('   • sarah.williams@student.com');
    console.log('   • david.brown@student.com');
    console.log('   • emma.davis@student.com');

    console.log('\nCREATED COURSE:');
    console.log('   • Title: English for Beginners to Advanced');
    console.log('   • Modules: 5 (Present Simple, Vocabulary, Past Simple, Future, Advanced Grammar)');
    console.log('   • Exercises: 12 (grammar, vocabulary, writing, comprehension)');
    console.log('   • Progress: Varied between students (10-90%)');
    console.log('   • Notifications: Configured for demonstration');

    console.log('\nENVIRONMENT FEATURES:');
    console.log('   • Templates correctly connected');
    console.log('   • Realistic student progress');
    console.log('   • Example notifications');
    console.log('   • Consistent data between collections');
    console.log('   • Typical English student names');
    console.log('   • Realistic educational content');

    console.log('\nNEXT STEPS:');
    console.log('   1. Start your backend: npm run start:dev');
    console.log('   2. Start your frontend: npm run dev');
    console.log('   3. Access the application');
    console.log('   4. Test with the credentials above!');

    console.log('\TIPS:');
    console.log('   • Demonstrate the teacher dashboard');
    console.log('   • Show student progress tracking');
    console.log('   • Explain the template system');
    console.log('   • Highlight real-time notifications');
    console.log('   • Show course and exercise management');

    console.log('\nSuccess!');

  } catch (error) {
    console.error('\nERROR DURING SETUP:', error.message);
    console.log('\nSOLUTION:');
    console.log('   1. Verify that MongoDB is running');
    console.log('   2. Adjust MONGO_URI in .env file if necessary');
    console.log('   3. Run scripts individually if there are problems');
    console.log('\nIndividual scripts:');
    console.log('   node create-demo-users.js');
    console.log('   node create-demo-templates.js');
    console.log('   node create-demo-course.js');
    console.log('   node create-demo-enrollments.js');
  }
}

// Run the setup
setupDemoEnvironment();
