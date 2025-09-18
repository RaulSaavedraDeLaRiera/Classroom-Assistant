const bcrypt = require('bcrypt');

async function generateAdminPassword() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('ADMIN PASSWORD GENERATED:');
  console.log('Email: admin@classroom.com');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('');
  console.log('COPY THIS:');
  console.log(`{
  "email": "admin@classroom.com",
  "password": "${hash}",
  "role": "admin",
  "name": "System Administrator"
}`);
}

generateAdminPassword().catch(console.error);
