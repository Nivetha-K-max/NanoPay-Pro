import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../../middleware/auth.js';

function mockReq(authHeader?: string) {
  return {
    headers: { authorization: authHeader },
  } as any;
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('authMiddleware', () => {
  const next = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('calls next() and sets req.user for valid token', () => {
    const token = jwt.sign(
      { userId: 'user_1', email: 'jane@test.com', role: 'CUSTOMER' },
      process.env.JWT_SECRET!
    );

    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user.userId).toBe('user_1');
    expect(req.user.role).toBe('CUSTOMER');
  });

  it('returns 401 when no token provided', () => {
    const req = mockReq(undefined);
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for malformed token', () => {
    const req = mockReq('Bearer not.a.valid.jwt');
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for token signed with wrong secret', () => {
    const token = jwt.sign({ userId: 'user_1' }, 'wrong-secret');

    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for expired token', () => {
    const token = jwt.sign(
      { userId: 'user_1' },
      process.env.JWT_SECRET!,
      { expiresIn: -1 } // already expired
    );

    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
