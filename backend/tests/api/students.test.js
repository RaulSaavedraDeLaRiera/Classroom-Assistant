const request = require('supertest');
const { createTestApp } = require('../test-app');

describe('Students API Tests', () => {
  let app;
  let server;
  let studentModuleId;
  let studentExerciseId;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    server = testApp.server;
  }, 30000);

  afterAll(async () => {
    await server.close();
  });

  describe('Student Modules', () => {
    test('GET /students/modules - List all student modules', async () => {
      const response = await request(app).get('/students/modules');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('POST /students/modules - Create new student module with all fields', async () => {
      const moduleData = {
        title: 'Personalized Grammar Module',
        description: 'Custom grammar exercises for student',
        studentId: '507f1f77bcf86cd799439013',
        courseId: '507f1f77bcf86cd799439014',
        courseModuleId: '507f1f77bcf86cd799439015',
        order: 1,
        tags: ['grammar', 'personalized'],
        status: 'active',
        progress: 0.3,
        type: 'all',
        startedAt: new Date(),
        lastActivityAt: new Date(),
        visible: true
      };

      const response = await request(app).post('/students/modules').send(moduleData);
      expect(response.status).toBe(201);
      expect(response.body.title).toBe(moduleData.title);
      expect(response.body.type).toBe('all');
      expect(response.body.startedAt).toBeDefined();
      expect(response.body.lastActivityAt).toBeDefined();
      studentModuleId = response.body._id;
    });

    test('POST /students/modules - Create student module with progress type', async () => {
      const moduleData = {
        title: 'Progress Module',
        description: 'Module with progress type',
        studentId: '507f1f77bcf86cd799439013',
        courseId: '507f1f77bcf86cd799439014',
        courseModuleId: '507f1f77bcf86cd799439015',
        order: 2,
        type: 'progress'
      };

      const response = await request(app).post('/students/modules').send(moduleData);
      expect(response.status).toBe(201);
      expect(response.body.type).toBe('progress');
    });

    test('GET /students/modules/:id - Get student module by ID', async () => {
      const response = await request(app).get(`/students/modules/${studentModuleId}`);
      expect(response.status).toBe(200);
      expect(response.body._id).toBe(studentModuleId);
      expect(response.body.title).toBe('Personalized Grammar Module');
    });

    test('PUT /students/modules/:id - Update complete student module', async () => {
      const updateData = {
        title: 'Updated Grammar Module',
        description: 'Enhanced grammar exercises',
        studentId: '507f1f77bcf86cd799439013',
        courseId: '507f1f77bcf86cd799439014',
        courseModuleId: '507f1f77bcf86cd799439015',
        order: 1,
        status: 'completed',
        progress: 1.0,
        type: 'all',
        visible: true
      };

      const response = await request(app).put(`/students/modules/${studentModuleId}`).send(updateData);
      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.progress).toBe(updateData.progress);
    });

    test('PATCH /students/modules/:id - Partial update student module', async () => {
      const partialUpdate = {
        status: 'completed',
        progress: 1.0
      };

      const response = await request(app).patch(`/students/modules/${studentModuleId}`).send(partialUpdate);
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(partialUpdate.status);
      expect(response.body.progress).toBe(partialUpdate.progress);
    });

    test('DELETE /students/modules/:id - Soft delete student module', async () => {
      const response = await request(app).delete(`/students/modules/${studentModuleId}`);
      expect(response.status).toBe(200);
      expect(response.body.visible).toBe(false);
    });
  });

  describe('Student Exercises', () => {
    test('GET /students/exercises - List all student exercises', async () => {
      const response = await request(app).get('/students/exercises');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('POST /students/exercises - Create new student exercise with all fields', async () => {
      const exerciseData = {
        title: 'Personal Grammar Quiz',
        content: 'Complete the sentences with correct grammar',
        type: 'quiz',
        studentId: '507f1f77bcf86cd799439013',
        studentModuleId: '507f1f77bcf86cd799439016',
        courseExerciseId: '507f1f77bcf86cd799439017',
        order: 1,
        tags: ['quiz', 'grammar'],
        status: 'pending',
        score: 0,
        feedback: '',
        timeSpent: 0,
        attempts: 0,
        bestScore: 0,
        scores: [],
        startedAt: new Date(),
        lastActivityAt: new Date(),
        visible: true
      };

      const response = await request(app).post('/students/exercises').send(exerciseData);
      expect(response.status).toBe(201);
      expect(response.body.title).toBe(exerciseData.title);
      expect(response.body.status).toBe('pending');
      expect(response.body.attempts).toBe(0);
      expect(response.body.bestScore).toBe(0);
      expect(response.body.scores).toEqual([]);
      expect(response.body.startedAt).toBeDefined();
      expect(response.body.lastActivityAt).toBeDefined();
      studentExerciseId = response.body._id;
    });

    test('POST /students/exercises - Create student exercise with default values', async () => {
      const exerciseData = {
        title: 'Basic Exercise',
        content: 'Simple exercise content',
        type: 'reading',
        studentId: '507f1f77bcf86cd799439013',
        studentModuleId: '507f1f77bcf86cd799439016',
        order: 1
      };

      const response = await request(app).post('/students/exercises').send(exerciseData);
      expect(response.status).toBe(201);
      expect(response.body.status).toBe('pending');
      expect(response.body.attempts).toBe(0);
      expect(response.body.bestScore).toBe(0);
    });

    test('GET /students/exercises/:id - Get student exercise by ID', async () => {
      const response = await request(app).get(`/students/exercises/${studentExerciseId}`);
      expect(response.status).toBe(200);
      expect(response.body._id).toBe(studentExerciseId);
      expect(response.body.title).toBe('Personal Grammar Quiz');
    });

    test('PUT /students/exercises/:id - Update complete student exercise', async () => {
      const updateData = {
        title: 'Updated Grammar Quiz',
        content: 'Enhanced grammar quiz content',
        type: 'quiz',
        studentId: '507f1f77bcf86cd799439013',
        studentModuleId: '507f1f77bcf86cd799439016',
        courseExerciseId: '507f1f77bcf86cd799439017',
        order: 1,
        status: 'completed',
        score: 85,
        feedback: 'Great work on grammar!',
        attempts: 2,
        bestScore: 85,
        scores: [
          { score: 75, timestamp: new Date() },
          { score: 85, timestamp: new Date() }
        ],
        completedAt: new Date(),
        visible: true
      };

      const response = await request(app).put(`/students/exercises/${studentExerciseId}`).send(updateData);
      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.status).toBe('completed');
      expect(response.body.attempts).toBe(2);
      expect(response.body.bestScore).toBe(85);
      expect(response.body.scores).toHaveLength(2);
      expect(response.body.completedAt).toBeDefined();
    });

    test('PATCH /students/exercises/:id - Partial update student exercise', async () => {
      const partialUpdate = {
        score: 90,
        feedback: 'Excellent grammar skills!',
        attempts: 3,
        bestScore: 90
      };

      const response = await request(app).patch(`/students/exercises/${studentExerciseId}`).send(partialUpdate);
      expect(response.status).toBe(200);
      expect(response.body.score).toBe(partialUpdate.score);
      expect(response.body.feedback).toBe(partialUpdate.feedback);
      expect(response.body.attempts).toBe(3);
      expect(response.body.bestScore).toBe(90);
    });

    test('DELETE /students/exercises/:id - Soft delete student exercise', async () => {
      const response = await request(app).delete(`/students/exercises/${studentExerciseId}`);
      expect(response.status).toBe(200);
      expect(response.body.visible).toBe(false);
    });

    test('should validate status enum values', async () => {
      const exerciseData = {
        title: 'Invalid Status Exercise',
        content: 'Exercise with invalid status',
        type: 'quiz',
        studentId: '507f1f77bcf86cd799439013',
        studentModuleId: '507f1f77bcf86cd799439016',
        order: 1,
        status: 'invalid-status'
      };

      const response = await request(app).post('/students/exercises').send(exerciseData);
      expect(response.status).toBe(400);
    });
  });

  // Query Parameters Tests
  test('GET /students/modules with filters - Test query parameters', async () => {
    const response = await request(app).get('/students/modules?studentId=507f1f77bcf86cd799439013&status=completed');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('GET /students/exercises with filters - Test query parameters', async () => {
    const response = await request(app).get('/students/exercises?studentId=507f1f77bcf86cd799439013&status=completed');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

module.exports = { runAllTests: async () => { console.log('Students tests completed'); } };
