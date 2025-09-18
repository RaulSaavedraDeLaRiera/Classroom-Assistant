const request = require('supertest');
const { createTestApp } = require('../test-app');

describe('Auth API Tests', () => {
  let app;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
  });

  describe('POST /auth/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        name: 'Test Teacher',
        email: 'teacher@test.com',
        password: 'password123',
        role: 'teacher'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201); // Changed from 200 to 201 (Created)

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.role).toBe(userData.role);
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('should register a student user', async () => {
      const userData = {
        name: 'Test Student',
        email: 'student@test.com',
        password: 'password123',
        role: 'student'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201); // Changed from 200 to 201 (Created)

      expect(response.body.access_token).toBeDefined();
      expect(response.body.user.role).toBe('student');
    });

    test('should hash password and not return it', async () => {
      const userData = {
        name: 'Password Test User',
        email: 'password@test.com',
        password: 'secretpassword',
        role: 'student'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201); // Changed from 200 to 201 (Created)

      expect(response.body.user.password).toBeUndefined();
    });

    test('should validate required fields', async () => {
      const invalidData = {
        name: 'Invalid User'
        // missing email, password, role
      };

      await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400); // Now should return 400 with improved validation
    });

    test('should prevent duplicate email registration', async () => {
      const userData = {
        name: 'Duplicate User',
        email: 'duplicate@test.com',
        password: 'password123',
        role: 'student'
      };

      // First registration should succeed
      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email should fail with 409 (Conflict)
      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(409); // Changed from 500 to 409 (Conflict)
    });
  });

  describe('POST /auth/login', () => {
    let testUser;

    beforeAll(async () => {
      // Create a test user for login tests
      const userData = {
        name: 'Login Test User',
        email: 'login@test.com',
        password: 'loginpassword',
        role: 'teacher'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      testUser = response.body.user;
    });

    test('should login with valid credentials', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'loginpassword'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200); // Should return 200 (OK) for successful login

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginData.email);
    });

    test('should reject invalid email', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'password123'
      };

      await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);
    });

    test('should reject invalid password', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'wrongpassword'
      };

      await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);
    });

    test('should validate required fields', async () => {
      const invalidData = {
        email: 'test@test.com'
        // missing password
      };

      await request(app)
        .post('/auth/login')
        .send(invalidData)
        .expect(400); // Now should return 400 with improved validation
    });
  });

  describe('GET /auth/profile', () => {
    let authToken;
    let testUser;

    beforeAll(async () => {
      // Create and login a user to get token
      const userData = {
        name: 'Profile Test User',
        email: 'profile@test.com',
        password: 'profilepassword',
        role: 'admin'
      };

      const registerResponse = await request(app)
        .post('/auth/register')
        .send(userData);

      testUser = registerResponse.body.user;
      authToken = registerResponse.body.access_token;
    });

    test('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('role');
      expect(response.body.email).toBe('profile@test.com');
    });

    test('should reject request without token', async () => {
      await request(app)
        .get('/auth/profile')
        .expect(401);
    });

    test('should reject request with invalid token', async () => {
      await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    test('should reject request with malformed authorization header', async () => {
      await request(app)
        .get('/auth/profile')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });
  });

  describe('JWT Token Validation', () => {
    test('should generate valid JWT token structure', async () => {
      const userData = {
        name: 'JWT Test User',
        email: 'jwt@test.com',
        password: 'jwtpassword',
        role: 'student'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201); // Changed from 200 to 201 (Created)

      const token = response.body.access_token;
      
      // JWT tokens have 3 parts separated by dots
      expect(token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      
      // Token should be reasonably long
      expect(token.length).toBeGreaterThan(50);
    });
  });
});
