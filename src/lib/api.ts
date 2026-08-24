const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private getToken(): string | null {
    const auth = localStorage.getItem('nanopay-auth');
    if (auth) {
      const parsed = JSON.parse(auth);
      return parsed.state?.token || null;
    }
    return null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string; role?: string }) {
    return this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile() {
    return this.request<any>('/auth/profile');
  }

  // Transactions
  async getTransactions() {
    return this.request<any[]>('/transactions');
  }

  // Analytics (dashboard)
  async getSpendingSeries(days: number) {
    return this.request<Array<{ date: string; amount: number }>>(
      `/transactions/analytics/spending?days=${encodeURIComponent(String(days))}`,
    );
  }

  async getCategoryBreakdown(days: number) {
    return this.request<Array<{ name: string; value: number }>>(
      `/transactions/analytics/category?days=${encodeURIComponent(String(days))}`,
    );
  }


  async createTransaction(data: { type: string; amount: number; counterpartyEmail: string; category?: string }) {
    return this.request<any>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTransactionById(id: string) {
    return this.request<any>(`/transactions/${id}`);
  }

  // Contacts
  async getContacts() {
    return this.request<any[]>('/contacts');
  }

  async createContact(data: { name: string; email: string }) {
    return this.request<any>('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Users
  async searchUser(email: string) {
    return this.request<any>(`/users/search?email=${encodeURIComponent(email)}`);
  }
}

export const api = new ApiClient();
