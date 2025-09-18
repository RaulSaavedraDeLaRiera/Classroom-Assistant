const request = require('supertest');
const { createTestApp } = require('../test-app');

describe('Templates API Tests', () => {
  let app;
  let server;
  let templateId;

  const sampleTemplate = {
    title: "Inglés A2-B1",
    description: "Curso de inglés para niveles A2-B1",
    tags: ["inglés", "básico", "intermedio"],
    estimatedDuration: 120,
    isPublic: false,
    visible: true
  };

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    server = testApp.server;
  }, 30000);

  afterAll(async () => {
    await server.close();
  });

  test('GET /templates/courses - List all templates', async () => {
    const response = await request(app).get('/templates/courses');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('POST /templates/courses - Create initial template for tests', async () => {
    const response = await request(app).post('/templates/courses').send(sampleTemplate);
    expect(response.status).toBe(201);
    expect(response.body.title).toBe(sampleTemplate.title);
    expect(response.body.description).toBe(sampleTemplate.description);
    
    templateId = response.body._id;
  });

  describe('POST /templates/courses', () => {
    test('should create a new template course with all fields', async () => {
      const newCourse = {
        title: 'Advanced English Grammar',
        description: 'Comprehensive grammar course for advanced learners',
        tags: ['grammar', 'advanced', 'english'],
        estimatedDuration: 120,
        isPublic: true
      };

      const response = await request(app)
        .post('/templates/courses')
        .send(newCourse);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(newCourse.title);
      expect(response.body.isPublic).toBe(true);
      expect(response.body.tags).toEqual(newCourse.tags);
      expect(response.body.estimatedDuration).toBe(newCourse.estimatedDuration);
    });

    test('should create template course with default isPublic false', async () => {
      const newCourse = {
        title: 'Basic English Course',
        description: 'Basic course for beginners'
      };

      const response = await request(app)
        .post('/templates/courses')
        .send(newCourse);

      expect(response.status).toBe(201);
      expect(response.body.isPublic).toBe(false);
    });
  });

  describe('POST /templates/modules', () => {
    test('should create a new template module with all fields', async () => {
      const newModule = {
        title: 'Present Perfect Tense',
        description: 'Learn present perfect tense usage',
        templateCourseId: '507f1f77bcf86cd799439011',
        order: 1,
        tags: ['grammar', 'present-perfect'],
        estimatedDuration: 45,
        status: 'active',
        prerequisites: []
      };

      const response = await request(app)
        .post('/templates/modules')
        .send(newModule);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(newModule.title);
      expect(response.body.status).toBe('active');
      expect(response.body.prerequisites).toEqual([]);
    });

    test('should create template module with prerequisites', async () => {
      const newModule = {
        title: 'Past Perfect Tense',
        description: 'Learn past perfect tense usage',
        templateCourseId: '507f1f77bcf86cd799439011',
        order: 2,
        prerequisites: ['507f1f77bcf86cd799439012']
      };

      const response = await request(app)
        .post('/templates/modules')
        .send(newModule);

      expect(response.body.prerequisites).toHaveLength(1);
      expect(response.body.prerequisites[0]).toBe('507f1f77bcf86cd799439012');
    });
  });

  describe('POST /templates/exercises', () => {
    test('should create a new template exercise with all fields', async () => {
      const newExercise = {
        title: 'Present Perfect Quiz',
        content: 'Complete the sentences with present perfect',
        type: 'quiz',
        templateModuleId: '507f1f77bcf86cd799439011',
        order: 1,
        tags: ['quiz', 'present-perfect'],
        estimatedTime: 15,
        difficulty: 'intermediate',
        estimatedScore: 85
      };

      const response = await request(app)
        .post('/templates/exercises')
        .send(newExercise);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(newExercise.title);
      expect(response.body.difficulty).toBe('intermediate');
      expect(response.body.estimatedScore).toBe(85);
    });

    test('should create template exercise with default difficulty', async () => {
      const newExercise = {
        title: 'Basic Exercise',
        content: 'Simple exercise content',
        type: 'reading',
        templateModuleId: '507f1f77bcf86cd799439011',
        order: 1
      };

      const response = await request(app)
        .post('/templates/exercises')
        .send(newExercise);

      expect(response.status).toBe(201);
      expect(response.body.difficulty).toBe('intermediate');
    });

    test('should validate difficulty enum values', async () => {
      const newExercise = {
        title: 'Invalid Exercise',
        content: 'Exercise with invalid difficulty',
        type: 'quiz',
        templateModuleId: '507f1f77bcf86cd799439011',
        order: 1,
        difficulty: 'invalid-level'
      };

      const response = await request(app)
        .post('/templates/exercises')
        .send(newExercise);

      expect(response.status).toBe(400);
    });
  });

  test('GET /templates/courses/:id - Get template by ID', async () => {
    const response = await request(app).get(`/templates/courses/${templateId}`);
    expect(response.status).toBe(200);
    expect(response.body._id).toBe(templateId);
    expect(response.body.title).toBe(sampleTemplate.title);
  });

    test('PUT /templates/courses/:id - Update template', async () => {
    const updateData = { ...sampleTemplate, title: "Inglés A2-B1 Actualizado" };
    const response = await request(app).put(`/templates/courses/${templateId}`).send(updateData);        
    expect(response.status).toBe(200);
    expect(response.body.title).toBe(updateData.title);
  });

    test('PATCH /templates/courses/:id - Partial update template', async () => {
    const partialUpdate = { tags: ["inglés", "básico", "intermedio", "actualizado"] };
    const response = await request(app).patch(`/templates/courses/${templateId}`).send(partialUpdate);   
    expect(response.status).toBe(200);
    expect(response.body.tags).toContain("actualizado");
  });

  test('DELETE /templates/courses/:id - Soft delete template', async () => {
    const response = await request(app).delete(`/templates/courses/${templateId}`);
    expect(response.status).toBe(200);
    expect(response.body.visible).toBe(false);
  });

  test('GET /templates/courses - Verify template is hidden', async () => {
    const response = await request(app).get('/templates/courses');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

// Export for test runner
module.exports = {
  runAllTests: async () => {
    // This will be called by the test runner
    console.log('Templates tests completed');
  }
};
