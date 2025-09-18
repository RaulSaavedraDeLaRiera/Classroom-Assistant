const fs = require('fs');
const path = require('path');

function setDefaultDatabase() {
  const envPath = path.join(__dirname, '..', '.env');
  
  // Default configuration for example database
  const defaultConfig = `MONGO_URI=mongodb://localhost:27017/classroom_assistant_example
JWT_SECRET=a-magic-secret-key
NODE_ENV=development`;

  // Create or update .env file
  if (fs.existsSync(envPath)) {
    console.log('Updating existing .env file...');
    
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update MONGO_URI if it exists, otherwise add it
    const mongoUriRegex = /MONGO_URI=.*/;
    if (mongoUriRegex.test(envContent)) {
      envContent = envContent.replace(mongoUriRegex, 'MONGO_URI=mongodb://localhost:27017/classroom_assistant_example');
    } else {
      envContent += '\nMONGO_URI=mongodb://localhost:27017/classroom_assistant_example';
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('Updated MONGO_URI to point to example database');
  } else {
    console.log('Creating new .env file...');
    fs.writeFileSync(envPath, defaultConfig);
    console.log('Created .env file with example database configuration');
  }
  
  console.log('\nApplication will now use the example database by default');
  console.log('Database: classroom_assistant_example');
  console.log('\nTo switch back to production database:');
  console.log('  node switch-database.js production');
}

// Run the script
setDefaultDatabase();
