import prisma from '../config/database.js';

export const getTransactions = async (req: any, res: any) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { senderId: req.user.userId },
          { receiverId: req.user.userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createTransaction = async (req: any, res: any) => {
  const { type, amount, counterpartyEmail, category } = req.body;

  try {
    const sender = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    const receiver = await prisma.user.findUnique({
      where: { email: counterpartyEmail }
    });

    const fee = ['SEND', 'WITHDRAW'].includes(type) ? amount * 0.005 : 0;
    const reference = `NP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const transaction = await prisma.transaction.create({
      data: {
        reference,
        type,
        amount,
        fee,
        currency: 'USD',
        status: 'PENDING',
        category: category || 'General',
        fraudScore: Math.floor(Math.random() * 30),
        senderId: type === 'SEND' ? req.user.userId : null,
        receiverId: receiver?.id || null,
        counterparty: receiver ? `${receiver.firstName} ${receiver.lastName}` : counterpartyEmail,
        counterpartyEmail,
      },
    });

    // Simulate processing
    setTimeout(async () => {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'SUCCESS' }
      });
    }, 2000);

    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getTransactionById = async (req: any, res: any) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.senderId !== req.user.userId && transaction.receiverId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const toDateKeyUTC = (d: Date) => d.toISOString().slice(0, 10);

// GET /api/transactions/analytics/spending?days=30
// Returns series: [{ date: 'YYYY-MM-DD', amount: number }]
export const getSpendingSeries = async (req: any, res: any) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days || 30)));

    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    from.setUTCHours(0, 0, 0, 0);

    const rows = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: from },
        OR: [{ senderId: req.user.userId }, { receiverId: req.user.userId }],
        // treat SEND/WITHDRAW as spending outflows
        type: { in: ['SEND', 'WITHDRAW'] },
      },
      select: {
        createdAt: true,
        amount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const byDay = new Map<string, number>();
    for (const r of rows) {
      const key = toDateKeyUTC(new Date(r.createdAt));
      const prev = byDay.get(key) || 0;
      byDay.set(key, prev + Number(r.amount));
    }

    const series: { date: string; amount: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setUTCHours(0, 0, 0, 0);
      const key = toDateKeyUTC(d);
      series.push({ date: key, amount: Math.round((byDay.get(key) || 0) * 100) / 100 });
    }

    res.json(series);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/transactions/analytics/category?days=30
// Returns: [{ name: string, value: number }]
export const getCategoryBreakdown = async (req: any, res: any) => {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days || 30)));

    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    from.setUTCHours(0, 0, 0, 0);

    const rows = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: from },
        OR: [{ senderId: req.user.userId }, { receiverId: req.user.userId }],
        type: { in: ['SEND', 'WITHDRAW'] },
      },
      select: {
        category: true,
        amount: true,
      },
    });

    const byCat = new Map<string, number>();
    for (const r of rows) {
      const name = r.category || 'General';
      const prev = byCat.get(name) || 0;
      byCat.set(name, prev + Number(r.amount));
    }

    const items = Array.from(byCat.entries())
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);

    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

