const fs = require('fs');
const path = require('path');

function switchDatabase(targetDb) {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('.env file not found');
    return;
  }

  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Replace MONGO_URI line
  const mongoUriRegex = /MONGO_URI=.*/;
  const newMongoUri = `MONGO_URI=mongodb://localhost:27017/${targetDb}`;
  
  if (mongoUriRegex.test(envContent)) {
    envContent = envContent.replace(mongoUriRegex, newMongoUri);
  } else {
    // Add MONGO_URI if it doesn't exist
    envContent += `\nMONGO_URI=mongodb://localhost:27017/${targetDb}`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`Database changed to: ${targetDb}`);
  console.log(`.env file updated`);
}

function showCurrentDatabase() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('.env file not found');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const mongoUriMatch = envContent.match(/MONGO_URI=.*/);
  
  if (mongoUriMatch) {
    console.log(`Current database: ${mongoUriMatch[0]}`);
  } else {
    console.log('MONGO_URI not found in .env');
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'example':
    switchDatabase('classroom_assistant_example');
    console.log('\nApplication will now use the example database');
    console.log('Run: node setup-demo-environment.js (if you haven\'t done it yet)');
    break;
    
  case 'production':
    switchDatabase('classroom_assistant');
    console.log('\nApplication will now use the production database');
    break;
    
  case 'status':
    showCurrentDatabase();
    break;
    
  default:
    console.log('Database switching script');
    console.log('\nUsage:');
    console.log('  node switch-database.js example    # Switch to example DB');
    console.log('  node switch-database.js production # Switch to production DB');
    console.log('  node switch-database.js status     # See current DB');
    console.log('\nExamples:');
    console.log('  node switch-database.js example');
    console.log('  node switch-database.js production');
}