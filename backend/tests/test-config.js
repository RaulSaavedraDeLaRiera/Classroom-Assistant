// Test configuration
module.exports = {
  // Test database configuration
  database: {
    url: 'mongodb://localhost:27017/classroom_assistant_tests',
    name: 'classroom_assistant_tests'
  },
  
  // Test app configuration
  app: {
    port: 3001, // Different port to avoid conflicts
    logger: false // Disable logging for cleaner output
  },
  
  // Test data configuration
  testData: {
    emailDomain: '@test.example.com', // Use different domain for test emails
    prefix: 'test_' // Prefix for test data
  }
};
