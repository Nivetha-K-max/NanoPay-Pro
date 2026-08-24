import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database.js';
import { register, login, getProfile } from '../../controllers/authController.js';

// Typed mock helpers
const mockPrismaUser = prisma.user as Record<string, ReturnType<typeof vi.fn>>;

function mockReq(body = {}, user = {}) {
  return { body, user } as any;
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const HASHED_PW = bcrypt.hashSync('Test@1234', 4);

const MOCK_USER = {
  id: 'user_1',
  email: 'jane@test.com',
  password: HASHED_PW,
  firstName: 'Jane',
  lastName: 'Doe',
  role: 'CUSTOMER',
  cardLast4: '4242',
};

describe('AuthController — register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates user and returns 201 with token', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);
    mockPrismaUser.create.mockResolvedValue(MOCK_USER);

    const req = mockReq({
      email: 'jane@test.com',
      password: 'Test@1234',
      firstName: 'Jane',
      lastName: 'Doe',
    });
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body.token).toBeDefined();
    expect(body.user.email).toBe('jane@test.com');
    expect(body.user.password).toBeUndefined(); // never expose password
  });

  it('returns 400 when email already exists', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(MOCK_USER);

    const req = mockReq({ email: 'jane@test.com', password: 'Test@1234' });
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'User already exists' });
  });

  it('returns 500 on unexpected DB error', async () => {
    mockPrismaUser.findUnique.mockRejectedValue(new Error('DB down'));

    const req = mockReq({ email: 'jane@test.com', password: 'Test@1234' });
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('AuthController — login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with token on valid credentials', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(MOCK_USER);

    const req = mockReq({ email: 'jane@test.com', password: 'Test@1234' });
    const res = mockRes();

    await login(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.token).toBeDefined();
    expect(body.user.email).toBe('jane@test.com');
  });

  it('returns 401 when user not found', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);

    const req = mockReq({ email: 'nobody@test.com', password: 'Test@1234' });
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
  });

  it('returns 401 on wrong password', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(MOCK_USER);

    const req = mockReq({ email: 'jane@test.com', password: 'WrongPass' });
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
  });

  it('JWT contains correct userId and role', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(MOCK_USER);

    const req = mockReq({ email: 'jane@test.com', password: 'Test@1234' });
    const res = mockRes();

    await login(req, res);

    const { token } = res.json.mock.calls[0][0];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    expect(decoded.userId).toBe('user_1');
    expect(decoded.role).toBe('CUSTOMER');
  });
});

describe('AuthController — getProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns user profile for authenticated user', async () => {
    const profile = { id: 'user_1', email: 'jane@test.com', firstName: 'Jane', lastName: 'Doe', role: 'CUSTOMER', cardLast4: '4242' };
    mockPrismaUser.findUnique.mockResolvedValue(profile);

    const req = mockReq({}, { userId: 'user_1' });
    const res = mockRes();

    await getProfile(req, res);

    expect(res.json).toHaveBeenCalledWith(profile);
  });

  it('returns 404 when user not found', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);

    const req = mockReq({}, { userId: 'ghost' });
    const res = mockRes();

    await getProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
