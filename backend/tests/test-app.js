//NOTE: Tests created with AI help

const { NestFactory } = require('@nestjs/core');
const mongoose = require('mongoose');
const testConfig = require('./test-config');

let app;
let httpServer;

async function createTestApp() {
  if (!app) {
    console.log('Starting test app creation...');
    
    // Set environment variable for test database before importing modules
    process.env.MONGODB_URI = testConfig.database.url;
    console.log(`Set MONGODB_URI to: ${process.env.MONGODB_URI}`);
    
    // Connect to test database and clean it
    console.log('Connecting to test database and cleaning...');
    await mongoose.connect(testConfig.database.url);
    
    // Clean all collections in test database
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
      console.log(`Cleaned collection: ${collection.collectionName}`);
    }
    console.log('Test database cleaned successfully');
    
    // Import modules after setting environment
    const { AppModule } = require('../src/app.module');
    
    // Create app with test configuration
    console.log('Creating NestJS app...');
    app = await NestFactory.create(AppModule, {
      logger: testConfig.app.logger
    });
    
    // Simple exception filter for tests
    app.useGlobalFilters(new (class {
      catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        
        // Handle NestJS exceptions (like NotFoundException)
        if (exception.status) {
          return response.status(exception.status).json({
            statusCode: exception.status,
            message: exception.message
          });
        }
        
        // Handle Mongoose validation errors
        if (exception.name === 'ValidationError') {
          return response.status(400).json({
            statusCode: 400,
            message: 'Validation Error'
          });
        }
        
        // Default to 500
        return response.status(500).json({
          statusCode: 500,
          message: 'Internal Server Error'
        });
      }
    })());
    
    await app.init();
    console.log('NestJS app initialized');
    
    // Get the HTTP server instance for supertest
    httpServer = app.getHttpServer();
    console.log('HTTP server ready');
  }
  
  return {
    app: httpServer,
    server: httpServer
  };
}

module.exports = { createTestApp };
