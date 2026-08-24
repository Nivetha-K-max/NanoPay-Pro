import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../../config/database.js';
import {
  getTransactions,
  createTransaction,
  getTransactionById,
} from '../../controllers/transactionController.js';

const mockPrismaTx = prisma.transaction as Record<string, ReturnType<typeof vi.fn>>;
const mockPrismaUser = prisma.user as Record<string, ReturnType<typeof vi.fn>>;

function mockReq(opts: { body?: any; params?: any; query?: any; user?: any } = {}) {
  return {
    body: opts.body ?? {},
    params: opts.params ?? {},
    query: opts.query ?? {},
    user: opts.user ?? { userId: 'user_1' },
  } as any;
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const MOCK_TX = {
  id: 'tx_1',
  reference: 'NP-ABC-123',
  type: 'SEND',
  amount: 100,
  fee: 0.5,
  currency: 'USD',
  status: 'SUCCESS',
  senderId: 'user_1',
  receiverId: 'user_2',
  counterparty: 'Bob Merchant',
  counterpartyEmail: 'bob@test.com',
  createdAt: new Date().toISOString(),
};

describe('TransactionController — getTransactions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns list of transactions for authenticated user', async () => {
    mockPrismaTx.findMany.mockResolvedValue([MOCK_TX]);

    const req = mockReq();
    const res = mockRes();

    await getTransactions(req, res);

    expect(res.json).toHaveBeenCalledWith([MOCK_TX]);
    const query = mockPrismaTx.findMany.mock.calls[0][0];
    expect(query.where.OR).toContainEqual({ senderId: 'user_1' });
    expect(query.where.OR).toContainEqual({ receiverId: 'user_1' });
  });

  it('returns 500 on DB error', async () => {
    mockPrismaTx.findMany.mockRejectedValue(new Error('DB error'));

    const req = mockReq();
    const res = mockRes();

    await getTransactions(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('TransactionController — createTransaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates SEND transaction and returns 201', async () => {
    mockPrismaUser.findUnique
      .mockResolvedValueOnce({ id: 'user_1', firstName: 'Jane', lastName: 'Doe' })
      .mockResolvedValueOnce({ id: 'user_2', firstName: 'Bob', lastName: 'Merchant' });
    mockPrismaTx.create.mockResolvedValue({ ...MOCK_TX, status: 'PENDING' });
    mockPrismaTx.update.mockResolvedValue({ ...MOCK_TX, status: 'SUCCESS' });

    const req = mockReq({
      body: { type: 'SEND', amount: 100, counterpartyEmail: 'bob@test.com', category: 'Dining' },
    });
    const res = mockRes();

    await createTransaction(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe('PENDING');
    expect(body.type).toBe('SEND');
  });

  it('calculates fee for SEND type (0.5%)', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);
    mockPrismaTx.create.mockResolvedValue(MOCK_TX);
    mockPrismaTx.update.mockResolvedValue(MOCK_TX);

    const req = mockReq({
      body: { type: 'SEND', amount: 200, counterpartyEmail: 'bob@test.com' },
    });
    const res = mockRes();

    await createTransaction(req, res);

    const savedData = mockPrismaTx.create.mock.calls[0][0].data;
    expect(savedData.fee).toBe(1); // 200 * 0.005
  });

  it('sets zero fee for RECEIVE type', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);
    mockPrismaTx.create.mockResolvedValue({ ...MOCK_TX, type: 'RECEIVE', fee: 0 });
    mockPrismaTx.update.mockResolvedValue(MOCK_TX);

    const req = mockReq({
      body: { type: 'RECEIVE', amount: 100, counterpartyEmail: 'bob@test.com' },
    });
    const res = mockRes();

    await createTransaction(req, res);

    const savedData = mockPrismaTx.create.mock.calls[0][0].data;
    expect(savedData.fee).toBe(0);
  });
});

describe('TransactionController — getTransactionById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns transaction for sender', async () => {
    mockPrismaTx.findUnique.mockResolvedValue(MOCK_TX);

    const req = mockReq({ params: { id: 'tx_1' }, user: { userId: 'user_1' } });
    const res = mockRes();

    await getTransactionById(req, res);

    expect(res.json).toHaveBeenCalledWith(MOCK_TX);
  });

  it('returns transaction for receiver', async () => {
    mockPrismaTx.findUnique.mockResolvedValue(MOCK_TX);

    const req = mockReq({ params: { id: 'tx_1' }, user: { userId: 'user_2' } });
    const res = mockRes();

    await getTransactionById(req, res);

    expect(res.json).toHaveBeenCalledWith(MOCK_TX);
  });

  it('returns 404 when transaction not found', async () => {
    mockPrismaTx.findUnique.mockResolvedValue(null);

    const req = mockReq({ params: { id: 'ghost' } });
    const res = mockRes();

    await getTransactionById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when user is not sender or receiver', async () => {
    mockPrismaTx.findUnique.mockResolvedValue(MOCK_TX); // senderId=user_1, receiverId=user_2

    const req = mockReq({ params: { id: 'tx_1' }, user: { userId: 'user_99' } });
    const res = mockRes();

    await getTransactionById(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
