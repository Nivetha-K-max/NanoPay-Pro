// Mock data + helpers for the NanoPay demo. Swap this module for real API calls later.

export type Role = "customer" | "merchant" | "admin";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  cardLast4: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
}

export type TxType = "send" | "receive" | "deposit" | "withdraw" | "fee";
export type TxStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "REVERSED";

export interface Transaction {
  id: string;
  reference: string;
  type: TxType;
  counterparty: string;
  counterpartyEmail: string;
  amount: number; // positive number, sign derived from type
  fee: number;
  currency: string;
  status: TxStatus;
  createdAt: string; // ISO
  fraudScore: number; // 0-100
  category: string;
}

const FIRST = ["Alex", "Maya", "Jordan", "Sam", "Riley", "Avery", "Noah", "Zoe", "Liam", "Emma", "Kai", "Ivy"];
const LAST = ["Chen", "Patel", "Garcia", "Kim", "Walker", "Nguyen", "Silva", "Khan", "Brooks", "Rivera", "Park", "Hayes"];
const CATEGORIES = ["Groceries", "Transport", "Subscriptions", "Dining", "Shopping", "Bills", "Travel"];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function avatarColor(seed: string) {
  const palettes = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-fuchsia-500 to-purple-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-cyan-500 to-sky-600",
  ];
  return palettes[hash(seed) % palettes.length];
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const MOCK_CONTACTS: Contact[] = Array.from({ length: 8 }).map((_, i) => {
  const name = `${FIRST[i % FIRST.length]} ${LAST[i % LAST.length]}`;
  return {
    id: `c_${i}`,
    name,
    email: name.toLowerCase().replace(" ", ".") + "@nanopay.io",
    initials: initials(name),
    color: avatarColor(name),
  };
});

function makeTx(i: number): Transaction {
  const types: TxType[] = ["send", "receive", "deposit", "withdraw", "send", "receive"];
  const statuses: TxStatus[] = ["SUCCESS", "SUCCESS", "SUCCESS", "PENDING", "PROCESSING", "FAILED", "SUCCESS", "SUCCESS"];
  const type = types[(i * 7) % types.length];
  const status = statuses[(i * 3) % statuses.length];
  const name = `${FIRST[(i * 5) % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`;
  const amount = Math.round((Math.random() * 480 + 8) * 100) / 100;
  const createdAt = new Date(Date.now() - i * 1000 * 60 * 47 - Math.random() * 1000 * 60 * 60).toISOString();
  return {
    id: `tx_${i}`,
    reference: `NP-${(100000 + i * 73).toString(36).toUpperCase()}-${(i * 13).toString(36).toUpperCase()}`,
    type,
    counterparty: type === "deposit" ? "Bank Transfer" : type === "withdraw" ? "Withdrawal to Bank" : name,
    counterpartyEmail: name.toLowerCase().replace(" ", ".") + "@example.com",
    amount,
    fee: type === "send" || type === "withdraw" ? Math.round(amount * 0.005 * 100) / 100 : 0,
    currency: "USD",
    status,
    createdAt,
    fraudScore: Math.min(100, Math.max(0, Math.round((hash(`tx_${i}`) % 100) * 0.9))),
    category: CATEGORIES[i % CATEGORIES.length],
  };
}

export const MOCK_TRANSACTIONS: Transaction[] = Array.from({ length: 42 }).map((_, i) => makeTx(i));

export function spendingSeries(days: number) {
  const out: { date: string; amount: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const base = 40 + Math.sin(i / 2.7) * 20 + Math.cos(i / 4.1) * 14;
    out.push({
      date: d.toISOString().slice(0, 10),
      amount: Math.max(8, Math.round((base + Math.random() * 50) * 100) / 100),
    });
  }
  return out;
}

export function categoryBreakdown() {
  return CATEGORIES.map((c, i) => ({
    name: c,
    value: Math.round(80 + Math.random() * 320 + i * 12),
  }));
}

export function formatMoney(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}
