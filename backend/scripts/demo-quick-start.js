const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

async function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error:`, error.message);
        reject(error);
        return;
      }
      if (stderr) console.log(stderr);
      if (stdout) console.log(stdout);
      resolve();
    });
  });
}

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

async function demoQuickStart() {
  try {
    console.log('CLASSROOM ASSISTANT - QUICK DEMO SETUP');
    console.log('='.repeat(50));
    console.log('This script will configure everything automatically:');
    console.log('1. Switch to example database');
    console.log('2. Create complete environment');
    console.log('3. Provide you with credentials');
    console.log('='.repeat(50));

    // Step 1: Switch to example database
    console.log('\nStep 1: Configuring database...');
    await runCommand('node switch-database.js example');
    
    // Step 2: Clean any existing demo data
    console.log('\nStep 2: Cleaning existing demo data...');
    try {
      await runCommand('node clean-demo-data.js');
    } catch (error) {
      console.log('No existing data to clean (this is normal for first run)');
    }
    
    // Step 3: Run scripts in order with proper error handling
    console.log('\nStep 3: Creating demonstration environment...');
    const scripts = [
      'create-demo-users.js',
      'create-demo-templates.js', 
      'create-demo-course.js',
      'create-manual-exercises.js',
      'create-demo-enrollments.js',
      'create-demo-chats.js',
      'create-demo-exercise-notifications.js'
    ];

    for (const script of scripts) {
      try {
        await runScript(script);
        console.log(`\n${script} completed successfully`);
        
        // Wait 2 seconds between scripts
        console.log('Waiting 2 seconds before next script...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`\nError in ${script}:`, error.message);
        console.log(`\nTrying to continue with next script...`);
        
        // Check if demo-ids.json exists
        const idsFile = path.join(__dirname, 'demo-ids.json');
        if (!fs.existsSync(idsFile)) {
          console.log('\nERROR: demo-ids.json not found. Cannot continue.');
          console.log('Please run the scripts manually:');
          console.log('   1. node create-demo-users.js');
          console.log('   2. node create-demo-templates.js');
          console.log('   3. node create-demo-course.js');
          console.log('   4. node create-manual-exercises.js');
          console.log('   5. node create-demo-enrollments.js');
          throw error;
        }
      }
    }

    // Check if demo-ids.json was created
    const idsFile = path.join(__dirname, 'demo-ids.json');
    if (!fs.existsSync(idsFile)) {
      throw new Error('demo-ids.json was not created. Setup failed.');
    }

    console.log('\nSETUP COMPLETED!');
    console.log('='.repeat(50));
    console.log('\nACCESS CREDENTIALS:');
    console.log('\nTEACHER:');
    console.log('   Email: john@teacher.com');
    console.log('   Password: teacher123');
    console.log('\nADMIN:');
    console.log('   Email: admin@classroom.com');
    console.log('   Password: admin123');
    console.log('\nSTUDENTS (password: student123):');
    console.log('   • john.doe@student.com');
    console.log('   • jane.smith@student.com');
    console.log('   • mike.johnson@student.com');
    console.log('   • sarah.williams@student.com');
    console.log('   • david.brown@student.com');
    console.log('   • emma.davis@student.com');

    console.log('\nNEXT STEPS:');
    console.log('   1. Start backend: npm run start:dev');
    console.log('   2. Start frontend: npm run dev');
    console.log('   3. Access with the credentials above!');

    console.log('\nUSEFUL COMMANDS:');
    console.log('   • See current DB: node switch-database.js status');
    console.log('   • Switch to production: node switch-database.js production');
    console.log('   • Clean demo data: node clean-demo-data.js');

    console.log('\nReady!');

  } catch (error) {
    console.error('\nError during setup:', error.message);
    console.log('\nManual solution:');
    console.log('   1. node switch-database.js example');
    console.log('   2. node clean-demo-data.js');
    console.log('   3. node create-demo-users.js');
    console.log('   4. node create-demo-templates.js');
    console.log('   5. node create-demo-course.js');
    console.log('   6. node create-manual-exercises.js');
    console.log('   7. node create-demo-enrollments.js');
  }
}

// Run the script
demoQuickStart();
