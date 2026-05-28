import { createClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

export interface User {
  id: number;
  phoneNumber: string;
  password: string;
  name?: string;
  package: string;
  packageExpiresAt?: string;
  createdAt: string;
  partnerPhone?: string | null;
}

export interface Transaction {
  id: number;
  userId: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  createdAt: string;
  deletedAt?: string | null;
}

export interface Payment {
  id: number;
  userId: number;
  package: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

class DatabaseService {
  private client: SupabaseClient | null = null;

  async connect(): Promise<void> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL / SUPABASE_KEY belum diset di environment (.env)');
    }
    
    // Node.js < 22 tidak menyediakan WebSocket native.
    // Supabase Realtime membutuhkan konstruktor WebSocket.
    if (!(globalThis as any).WebSocket) {
      (globalThis as any).WebSocket = WebSocket as any;
    }

    this.client = createClient(supabaseUrl, supabaseKey, {
      realtime: {
        // Pastikan realtime-js memakai transport ws di Node 20
        transport: WebSocket as any,
      },
    });
    console.log('Connected to Supabase Cloud Database');
  }

  disconnect(): void {
    // No-op for Supabase REST client
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    if (!this.client) throw new Error('Database not connected');
    
    // 1. Jika nomor ini terdaftar sebagai pasangan orang lain, gunakan akun Utama
    const { data: primaryUser } = await this.client
      .from('users')
      .select('*')
      .eq('partnerPhone', phoneNumber)
      .maybeSingle();
    
    if (primaryUser) {
      return primaryUser as User;
    }

    // 2. Jika tidak, cari berdasarkan nomor telepon sendiri
    const { data: user } = await this.client
      .from('users')
      .select('*')
      .eq('phoneNumber', phoneNumber)
      .maybeSingle();

    return user as User | null;
  }

  async getAllUsers(): Promise<User[]> {
    if (!this.client) throw new Error('Database not connected');
    const { data: users, error } = await this.client
      .from('users')
      .select('*')
      .order('id', { ascending: false });

    if (error || !users) return [];
    
    // Cari tahu siapa saja yang menjadi partner dari akun premium/berbayar
    const partnerToPackageMap = new Map<string, string>();
    users.forEach(u => {
      if (u.partnerPhone) {
        partnerToPackageMap.set(u.partnerPhone, u.package);
      }
    });
    
    // Timpa tampilan package untuk user yang menjadi partner
    return users.map(u => {
      if (partnerToPackageMap.has(u.phoneNumber)) {
        const primaryPackage = partnerToPackageMap.get(u.phoneNumber)!;
        return {
          ...u,
          package: primaryPackage === 'free' ? 'free' : primaryPackage + ' (Partner)',
        };
      }
      return u;
    }) as User[];
  }

  async adminUpdateUserPackage(userId: number, pkg: string): Promise<void> {
    if (!this.client) throw new Error('Database not connected');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const expiresAtStr = expiresAt.toISOString();

    await this.client
      .from('users')
      .update({ package: pkg, packageExpiresAt: expiresAtStr })
      .eq('id', userId);
  }

  async updatePartnerPhone(userId: number, partnerPhone: string | null): Promise<void> {
    if (!this.client) throw new Error('Database not connected');
    await this.client
      .from('users')
      .update({ partnerPhone })
      .eq('id', userId);
  }

  async createUser(phoneNumber: string, password: string): Promise<User> {
    if (!this.client) throw new Error('Database not connected');
    const { data, error } = await this.client
      .from('users')
      .insert([{ phoneNumber, password, package: 'free' }])
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create user');
    }
    
    return data as User;
  }

  async getUserById(id: number): Promise<User | null> {
    if (!this.client) throw new Error('Database not connected');
    const { data } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    return data as User | null;
  }

  async updatePassword(userId: number, newPassword: string): Promise<void> {
    if (!this.client) throw new Error('Database not connected');
    await this.client
      .from('users')
      .update({ password: newPassword })
      .eq('id', userId);
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    if (!this.client) throw new Error('Database not connected');
    const { data, error } = await this.client
      .from('transactions')
      .insert([{
        userId: transaction.userId,
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description || null
      }])
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create transaction');
    }
    
    return data as Transaction;
  }

  async getTransactions(userId: number): Promise<Transaction[]> {
    if (!this.client) throw new Error('Database not connected');
    const { data, error } = await this.client
      .from('transactions')
      .select('*')
      .eq('userId', userId)
      .is('deletedAt', null)
      .order('createdAt', { ascending: false });

    if (error || !data) return [];
    return data as Transaction[];
  }

  async getDeletedTransactions(userId: number): Promise<Transaction[]> {
    if (!this.client) throw new Error('Database not connected');
    const { data, error } = await this.client
      .from('transactions')
      .select('*')
      .eq('userId', userId)
      .not('deletedAt', 'is', null)
      .order('deletedAt', { ascending: false });

    if (error || !data) return [];
    return data as Transaction[];
  }

  async deleteTransaction(id: number): Promise<void> {
    if (!this.client) throw new Error('Database not connected');
    await this.client
      .from('transactions')
      .delete()
      .eq('id', id);
  }
  
  async softDeleteTransaction(id: number, userId: number): Promise<void> {
    if (!this.client) throw new Error('Database not connected');
    await this.client
      .from('transactions')
      .update({ deletedAt: new Date().toISOString() })
      .eq('id', id)
      .eq('userId', userId);
  }

  async restoreTransaction(id: number, userId: number): Promise<void> {
    if (!this.client) throw new Error('Database not connected');
    await this.client
      .from('transactions')
      .update({ deletedAt: null })
      .eq('id', id)
      .eq('userId', userId);
  }

  async updateTransaction(id: number, userId: number, amount: number, category: string, description: string): Promise<void> {
    if (!this.client) throw new Error('Database not connected');
    await this.client
      .from('transactions')
      .update({ amount, category, description })
      .eq('id', id)
      .eq('userId', userId);
  }
  
  async getBalance(userId: number): Promise<number> {
    if (!this.client) throw new Error('Database not connected');
    const { data, error } = await this.client
      .from('transactions')
      .select('type, amount')
      .eq('userId', userId)
      .is('deletedAt', null);

    if (error || !data) return 0;
    
    return data.reduce((acc, curr) => {
      if (curr.type === 'income') return acc + Number(curr.amount);
      if (curr.type === 'expense') return acc - Number(curr.amount);
      return acc;
    }, 0);
  }

  async createPayment(userId: number, pkg: string, amount: number): Promise<Payment> {
    if (!this.client) throw new Error('Database not connected');
    const { data, error } = await this.client
      .from('payments')
      .insert([{ userId, package: pkg, amount, status: 'pending' }])
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create payment');
    }
    
    return data as Payment;
  }

  async getPendingPayments(): Promise<(Payment & { userPhone: string, userName: string | null })[]> {
    if (!this.client) throw new Error('Database not connected');
    const { data, error } = await this.client
      .from('payments')
      .select('*, users(phoneNumber, name)')
      .eq('status', 'pending')
      .order('createdAt', { ascending: false });

    if (error || !data) return [];
    
    return data.map((p: any) => ({
      id: p.id,
      userId: p.userId,
      package: p.package,
      amount: p.amount,
      status: p.status,
      createdAt: p.createdAt,
      userPhone: p.users?.phoneNumber || '',
      userName: p.users?.name || null
    }));
  }

  async approvePayment(paymentId: number): Promise<void> {
    if (!this.client) throw new Error('Database not connected');
    
    // Get the payment
    const { data: payment, error: getErr } = await this.client
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();
      
    if (getErr || !payment) throw new Error('Payment not found');
    if (payment.status !== 'pending') throw new Error('Payment is not pending');
    
    // Update status
    const { error: payErr } = await this.client
      .from('payments')
      .update({ status: 'approved' })
      .eq('id', paymentId);
      
    if (payErr) throw new Error('Failed to approve payment');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const expiresAtStr = expiresAt.toISOString();
    
    // Update user package
    const { error: userErr } = await this.client
      .from('users')
      .update({ package: payment.package, packageExpiresAt: expiresAtStr })
      .eq('id', payment.userId);
      
    if (userErr) throw new Error('Failed to update user package');
  }
}

export const db = new DatabaseService();
