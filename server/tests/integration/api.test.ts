import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import express from 'express';
import cors from 'cors';
import authRoutes from '../../routes/auth.js';
import transactionRoutes from '../../routes/transactions.js';
import contactRoutes from '../../routes/contacts.js';
import prisma from '../../config/database.js';

const mockPrismaUser = prisma.user as Record<string, ReturnType<typeof vi.fn>>;
const mockPrismaTx = prisma.transaction as Record<string, ReturnType<typeof vi.fn>>;
const mockPrismaContact = prisma.contact as Record<string, ReturnType<typeof vi.fn>>;

function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/contacts', contactRoutes);
  return app;
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

let app: express.Express;

async function getToken(): Promise<string> {
  mockPrismaUser.findUnique.mockResolvedValue(MOCK_USER);
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'jane@test.com', password: 'Test@1234' });
  return res.body.token;
}

beforeAll(() => { app = buildApp(); });
beforeEach(() => vi.clearAllMocks());

// ── Auth Routes ────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('returns 201 with token and user on success', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);
    mockPrismaUser.create.mockResolvedValue(MOCK_USER);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'jane@test.com', password: 'Test@1234', firstName: 'Jane', lastName: 'Doe' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('jane@test.com');
    expect(res.body.user.password).toBeUndefined();
  });

  it('returns 400 on invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'Test@1234', firstName: 'Jane', lastName: 'Doe' });

    expect(res.status).toBe(400);
  });

  it('returns 400 on short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'jane@test.com', password: '123', firstName: 'Jane', lastName: 'Doe' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when email already taken', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(MOCK_USER);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'jane@test.com', password: 'Test@1234', firstName: 'Jane', lastName: 'Doe' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('User already exists');
  });
});

describe('POST /api/auth/login', () => {
  it('returns 200 with token on valid credentials', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(MOCK_USER);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jane@test.com', password: 'Test@1234' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('jane@test.com');
  });

  it('returns 401 on wrong password', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(MOCK_USER);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jane@test.com', password: 'WrongPass' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 401 for unknown email', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@test.com', password: 'Test@1234' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 400 on missing email field', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'Test@1234' });

    expect(res.status).toBe(400);
  });
});

// ── Transaction Routes ─────────────────────────────────────────────────────

describe('GET /api/transactions', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(401);
  });

  it('returns 200 with transaction list when authenticated', async () => {
    const token = await getToken();
    mockPrismaTx.findMany.mockResolvedValue([
      { id: 'tx_1', type: 'SEND', amount: 100, status: 'SUCCESS' },
    ]);

    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].id).toBe('tx_1');
  });
});

describe('POST /api/transactions', () => {
  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send({ type: 'SEND', amount: 100, counterpartyEmail: 'bob@test.com' });

    expect(res.status).toBe(401);
  });

  it('creates transaction and returns 201 when authenticated', async () => {
    const token = await getToken();
    mockPrismaUser.findUnique.mockResolvedValue(null);
    mockPrismaTx.create.mockResolvedValue({ id: 'tx_new', type: 'SEND', amount: 100, status: 'PENDING' });
    mockPrismaTx.update.mockResolvedValue({});

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'SEND', amount: 100, counterpartyEmail: 'bob@test.com' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('tx_new');
  });
});

// ── Contact Routes ─────────────────────────────────────────────────────────

describe('GET /api/contacts', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/contacts');
    expect(res.status).toBe(401);
  });

  it('returns contacts list when authenticated', async () => {
    const token = await getToken();
    mockPrismaContact.findMany.mockResolvedValue([
      { id: 'c_1', name: 'Bob Merchant', email: 'bob@test.com' },
    ]);

    const res = await request(app)
      .get('/api/contacts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe('Bob Merchant');
  });
});
