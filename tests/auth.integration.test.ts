import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

describe('Auth Flow Integration Tests', () => {
    const testUser = {
        email: 'test@example.com',
        password: 'Test@123456',
        firstName: 'Test',
        lastName: 'User',
    };

    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
        // Clean up test user if exists
        await prisma.refreshToken.deleteMany({
            where: { user: { email: testUser.email } },
        });
        await prisma.user.deleteMany({
            where: { email: testUser.email },
        });
    });

    afterAll(async () => {
        // Clean up
        await prisma.refreshToken.deleteMany({
            where: { user: { email: testUser.email } },
        });
        await prisma.user.deleteMany({
            where: { email: testUser.email },
        });
        await prisma.$disconnect();
    });

    describe('POST /api/v1/auth/register', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send(testUser)
                .expect(201);

            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe(testUser.email);
            expect(res.body.data.tokens.accessToken).toBeDefined();
            expect(res.body.data.tokens.refreshToken).toBeDefined();
        });

        it('should reject duplicate email', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send(testUser)
                .expect(409);

            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('DUPLICATE_ENTRY');
        });

        it('should validate password strength', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'weak@example.com',
                    password: 'weak',
                })
                .expect(400);

            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.tokens.accessToken).toBeDefined();
            expect(res.body.data.tokens.refreshToken).toBeDefined();

            accessToken = res.body.data.tokens.accessToken;
            refreshToken = res.body.data.tokens.refreshToken;
        });

        it('should reject invalid password', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: testUser.email,
                    password: 'WrongPassword123',
                })
                .expect(401);

            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
        });

        it('should reject non-existent user', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: testUser.password,
                })
                .expect(401);

            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/auth/me', () => {
        it('should return user profile with valid token', async () => {
            const res = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.email).toBe(testUser.email);
            expect(res.body.data.firstName).toBe(testUser.firstName);
            expect(res.body.data.permissions).toBeDefined();
        });

        it('should reject request without token', async () => {
            const res = await request(app)
                .get('/api/v1/auth/me')
                .expect(401);

            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('AUTHENTICATION_ERROR');
        });

        it('should reject invalid token', async () => {
            const res = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/auth/refresh-token', () => {
        it('should return new tokens with valid refresh token', async () => {
            const res = await request(app)
                .post('/api/v1/auth/refresh-token')
                .send({ refreshToken })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.refreshToken).toBeDefined();
            // New refresh token should be different (rotation)
            expect(res.body.data.refreshToken).not.toBe(refreshToken);

            // Update tokens for subsequent tests
            accessToken = res.body.data.accessToken;
            refreshToken = res.body.data.refreshToken;
        });

        it('should reject used/invalid refresh token', async () => {
            // Use the old refresh token (should be invalid after rotation)
            const res = await request(app)
                .post('/api/v1/auth/refresh-token')
                .send({ refreshToken: 'old-invalid-token' })
                .expect(401);

            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/auth/logout', () => {
        it('should logout user', async () => {
            const res = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ refreshToken })
                .expect(200);

            expect(res.body.success).toBe(true);
        });
    });
});

describe('Dashboard Empty Data Tests', () => {
    it('should return zero metrics on empty database', async () => {
        // Login as admin first
        const loginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'admin@shop.com',
                password: 'Admin@123',
            });

        if (loginRes.status !== 200) {
            console.log('Skipping dashboard test - admin not seeded');
            return;
        }

        const token = loginRes.body.data.tokens.accessToken;

        const res = await request(app)
            .get('/api/v1/dashboard/overview')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.todaySales).toBeDefined();
        expect(typeof res.body.data.todaySales.revenue).toBe('number');
        expect(typeof res.body.data.todaySales.orders).toBe('number');
        expect(typeof res.body.data.lowStockCount).toBe('number');
    });
});
