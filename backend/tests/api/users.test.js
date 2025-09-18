const request = require('supertest');
const { createTestApp } = require('../test-app');

describe('Users API', () => {
  let app;
  let server;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    server = testApp.server;
    console.log('Test app started successfully');
  }, 30000);

  afterAll(async () => {
    await server.close();
  });

  // Helper function to generate unique email
  const generateUniqueEmail = (prefix) => {
    return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 5)}@example.com`;
  };

  describe('GET /users', () => {
    test('should return empty array when no users exist', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    test('should filter users by role', async () => {
      const response = await request(app)
        .get('/users?role=teacher')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should filter users by active status', async () => {
      const response = await request(app)
        .get('/users?active=true')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /users', () => {
    test('should create a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: generateUniqueEmail('john'),
        password: 'password123',
        role: 'student',
        active: true
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe(userData.name);
      expect(response.body.email).toBe(userData.email);
      expect(response.body.role).toBe(userData.role);
      expect(response.body.active).toBe(userData.active);
    });

    test('should create a teacher user', async () => {
      const userData = {
        name: 'Jane Smith',
        email: generateUniqueEmail('jane'),
        password: 'password123',
        role: 'teacher',
        active: true
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(201);

      expect(response.body.role).toBe('teacher');
    });
  });

  describe('GET /users/:id', () => {
    let userId;

    beforeAll(async () => {
      const userData = {
        name: 'Test User',
        email: generateUniqueEmail('test'),
        password: 'password123',
        role: 'student',
        active: true
      };

      const response = await request(app)
        .post('/users')
        .send(userData);

      userId = response.body._id;
    });

    test('should return user by id', async () => {
      const response = await request(app)
        .get(`/users/${userId}`)
        .expect(200);

      expect(response.body._id).toBe(userId);
      expect(response.body.name).toBe('Test User');
    });

    test('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app)
        .get(`/users/${fakeId}`)
        .expect(404);
    });
  });

  describe('PUT /users/:id', () => {
    let userId;

    beforeAll(async () => {
      const userData = {
        name: 'Update User',
        email: generateUniqueEmail('update'),
        password: 'password123',
        role: 'student',
        active: true
      };

      const response = await request(app)
        .post('/users')
        .send(userData);

      userId = response.body._id;
    });

    test('should update user completely', async () => {
      const updateData = {
        name: 'Updated Name',
        email: generateUniqueEmail('updated'),
        role: 'teacher',
        active: false
      };

      const response = await request(app)
        .put(`/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.email).toBe(updateData.email);
      expect(response.body.role).toBe(updateData.role);
      expect(response.body.active).toBe(updateData.active);
    });
  });

  describe('PATCH /users/:id', () => {
    let userId;

    beforeAll(async () => {
      const userData = {
        name: 'Patch User',
        email: generateUniqueEmail('patch'),
        password: 'password123',
        role: 'student',
        active: true
      };

      const response = await request(app)
        .post('/users')
        .send(userData);

      userId = response.body._id;
    });

    test('should partially update user', async () => {
      const patchData = {
        name: 'Patched Name',
        active: false
      };

      const response = await request(app)
        .patch(`/users/${userId}`)
        .send(patchData)
        .expect(200);

      expect(response.body.name).toBe(patchData.name);
      expect(response.body.active).toBe(patchData.active);
    });
  });

  describe('PATCH /users/:id/role', () => {
    let userId;

    beforeAll(async () => {
      const userData = {
        name: 'Role User',
        email: generateUniqueEmail('role'),
        password: 'password123',
        role: 'student',
        active: true
      };

      const response = await request(app)
        .post('/users')
        .send(userData);

      userId = response.body._id;
    });

    test('should update only user role', async () => {
      const roleData = { role: 'admin' };

      const response = await request(app)
        .patch(`/users/${userId}/role`)
        .send(roleData)
        .expect(200);

      expect(response.body.role).toBe('admin');
      expect(response.body.name).toBe('Role User'); // unchanged
    });
  });

  describe('DELETE /users/:id', () => {
    let userId;

    beforeAll(async () => {
      const userData = {
        name: 'Delete User',
        email: generateUniqueEmail('delete'),
        password: 'password123',
        role: 'student',
        active: true
      };

      const response = await request(app)
        .post('/users')
        .send(userData);

      userId = response.body._id;
    });

    test('should soft delete user (set visible to false)', async () => {
      const response = await request(app)
        .delete(`/users/${userId}`)
        .expect(200);

      expect(response.body.visible).toBe(false);
    });

    test('should not return deleted user in list', async () => {
      const listResponse = await request(app)
        .get('/users')
        .expect(200);

      const deletedUser = listResponse.body.find(user => user._id === userId);
      expect(deletedUser).toBeUndefined();
    });
  });
});
