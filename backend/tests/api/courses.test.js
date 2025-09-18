const request = require('supertest');
const { BASE_URL } = require('../config/test-config');

// Mock the app for testing
const { createTestApp } = require('../test-app');

describe('Courses API Tests', () => {
  let app;
  let server;
  let courseId;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    server = testApp.server;
  }, 30000);

  afterAll(async () => {
    await server.close();
  });

  test('GET /courses - List all courses', async () => {
    const response = await request(app).get('/courses');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  describe('POST /courses', () => {
    test('should create a new course with all fields', async () => {
      const newCourse = {
        title: 'English A2-B1 Course',
        description: 'Intermediate English course for A2-B1 level',
        teacherId: '507f1f77bcf86cd799439011',
        templateCourseId: '507f1f77bcf86cd799439012',
        tags: ['english', 'intermediate'],
        estimatedDuration: 120,
        status: 'active',
        maxStudents: 25,
        publishedAt: new Date()
      };

      const response = await request(app)
        .post('/courses')
        .send(newCourse);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(newCourse.title);
      expect(response.body.maxStudents).toBe(25);
      expect(response.body.publishedAt).toBeDefined();
      
      // Save courseId for later tests
      courseId = response.body._id;
    });

    test('should create course with default maxStudents', async () => {
      const newCourse = {
        title: 'Basic Course',
        description: 'Basic course description',
        teacherId: '507f1f77bcf86cd799439011',
        templateCourseId: '507f1f77bcf86cd799439012'
      };

      const response = await request(app)
        .post('/courses')
        .send(newCourse);

      expect(response.status).toBe(201);
      expect(response.body.maxStudents).toBe(50);
    });
  });

  describe('POST /courses/modules', () => {
    test('should create a new course module with all fields', async () => {
      const newModule = {
        title: 'Grammar Module',
        description: 'Grammar exercises module',
        courseId: '507f1f77bcf86cd799439011',
        templateModuleId: '507f1f77bcf86cd799439012',
        order: 1,
        tags: ['grammar'],
        estimatedDuration: 60,
        status: 'active',
        type: 'all',
        prerequisites: []
      };

      const response = await request(app)
        .post('/courses/modules')
        .send(newModule);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(newModule.title);
      expect(response.body.type).toBe('all');
      expect(response.body.prerequisites).toEqual([]);
    });

    test('should create course module with prerequisites', async () => {
      const newModule = {
        title: 'Advanced Module',
        description: 'Advanced exercises module',
        courseId: '507f1f77bcf86cd799439011',
        order: 2,
        type: 'progress',
        prerequisites: ['507f1f77bcf86cd799439012']
      };

      const response = await request(app)
        .post('/courses/modules')
        .send(newModule);

      expect(response.status).toBe(201);
      expect(response.body.type).toBe('progress');
      expect(response.body.prerequisites).toHaveLength(1);
    });
  });

  describe('POST /courses/exercises', () => {
    test('should create a new course exercise with all fields', async () => {
      const newExercise = {
        title: 'Grammar Quiz',
        content: 'Complete the grammar exercise',
        type: 'quiz',
        courseModuleId: '507f1f77bcf86cd799439011',
        templateExerciseId: '507f1f77bcf86cd799439012',
        order: 1,
        tags: ['quiz', 'grammar'],
        estimatedTime: 20,
        status: 'active',
        difficulty: 'intermediate'
      };

      const response = await request(app)
        .post('/courses/exercises')
        .send(newExercise);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(newExercise.title);
      expect(response.body.difficulty).toBe('intermediate');
    });

    test('should create course exercise with default difficulty', async () => {
      const newExercise = {
        title: 'Basic Exercise',
        content: 'Simple exercise content',
        type: 'reading',
        courseModuleId: '507f1f77bcf86cd799439011',
        templateExerciseId: '507f1f77bcf86cd799439012',
        order: 1
      };

      const response = await request(app)
        .post('/courses/exercises')
        .send(newExercise);

      expect(response.status).toBe(201);
      expect(response.body.difficulty).toBe('intermediate');
    });
  });

  test('GET /courses/:id - Get course by ID', async () => {
    const response = await request(app).get(`/courses/${courseId}`);
    expect(response.status).toBe(200);
    expect(response.body._id).toBe(courseId);
    expect(response.body.title).toBe('English A2-B1 Course');
  });

  test('PUT /courses/:id - Update complete course', async () => {
    const updateData = {
      title: 'English A2-B1 Advanced Course',
      description: 'Updated intermediate English course',
      tags: ['english', 'intermediate', 'a2-b1', 'advanced'],
      estimatedDuration: 80
    };

    const response = await request(app).put(`/courses/${courseId}`).send(updateData);
    expect(response.status).toBe(200);
    expect(response.body.title).toBe(updateData.title);
    expect(response.body.description).toBe(updateData.description);
  });

  test('PATCH /courses/:id - Partial update course', async () => {
    const partialUpdate = {
      title: 'English A2-B1 Final Course',
      status: 'archived'
    };

    const response = await request(app).patch(`/courses/${courseId}`).send(partialUpdate);
    expect(response.status).toBe(200);
    expect(response.body.title).toBe(partialUpdate.title);
    expect(response.body.status).toBe(partialUpdate.status);
  });

  test('DELETE /courses/:id - Soft delete course', async () => {
    const response = await request(app).delete(`/courses/${courseId}`);
    expect(response.status).toBe(200);
    expect(response.body.visible).toBe(false);
  });

  test('GET /courses with filters - Test query parameters', async () => {
    const response = await request(app).get('/courses?status=archived&visible=false');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

// Export for test runner
module.exports = {
  runAllTests: async () => {
    // This will be called by the test runner
    console.log('Courses tests completed');
  }
};
