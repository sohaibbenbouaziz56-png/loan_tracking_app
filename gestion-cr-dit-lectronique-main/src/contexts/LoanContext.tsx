import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { addMonths } from '@/lib/formatters';
import * as api from '@/lib/api';

export interface Payment {
  id: string;
  loanId: string;
  date: string;
  amount: number;
  type: 'advance' | 'monthly';
  note?: string;
}

export interface Loan {
  id: string;
  borrowerName: string;
  phone: string;
  nationalId?: string;
  address?: string;
  productId: string;
  productName?: string;
  totalAmount: number;
  advanceAmount: number;
  payments: Payment[];
  notes?: string;
  createdAt: string;
}

export function getAmountPaid(loan: Loan): number {
  return (loan.payments || []).reduce((sum, p) => sum + p.amount, 0);
}

export function getRemaining(loan: Loan): number {
  return Math.max(0, loan.totalAmount - getAmountPaid(loan));
}

export function getLastPaymentDate(loan: Loan): Date {
  const payments = loan.payments || [];
  if (payments.length === 0) return new Date(loan.createdAt);
  return new Date(
    payments.reduce((latest, p) => {
      const latestDate = new Date(latest);
      const pDate = new Date(p.date);
      return pDate > latestDate ? p.date : latest;
    }, payments[0].date)
  );
}

export function getNextPaymentDate(loan: Loan): Date {
  return addMonths(getLastPaymentDate(loan), 1);
}

export function getLoanStatus(loan: Loan): 'paid' | 'overdue' | 'active' {
  if (getRemaining(loan) === 0) return 'paid';
  const now = new Date();
  const lastPay = getLastPaymentDate(loan);
  const diffMs = now.getTime() - lastPay.getTime();
  const daysSince = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (daysSince > 31) return 'overdue';
  return 'active';
}

interface LoanContextType {
  loans: Loan[];
  loading: boolean;
  error: string | null;
  addLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'payments' | 'productName'>) => Promise<void>;
  deleteLoan: (loanId: string) => Promise<void>;
  recordPayment: (loanId: string, amount: number, note: string) => Promise<void>;
  refreshLoans: () => Promise<void>;
}

const LoanContext = createContext<LoanContextType | undefined>(undefined);

export function LoanProvider({ children }: { children: ReactNode }) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshLoans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getLoans();
      setLoans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshLoans();
  }, []);

  const addLoan = async (loan: Omit<Loan, 'id' | 'createdAt' | 'payments' | 'productName'>) => {
    try {
      const newLoan = await api.createLoan(loan);
      setLoans(prev => [newLoan, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create loan');
      throw err;
    }
  };

  const deleteLoan = async (loanId: string) => {
    try {
      await api.deleteLoan(loanId);
      setLoans(prev => prev.filter(l => l.id !== loanId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete loan');
      throw err;
    }
  };

  const recordPayment = async (loanId: string, amount: number, note: string) => {
    try {
      const payment = await api.recordPayment(loanId, { amount, type: 'monthly', note });
      setLoans(prev => prev.map(loan => {
        if (loan.id !== loanId) return loan;
        return { ...loan, payments: [...loan.payments, payment] };
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
      throw err;
    }
  };

  return (
    <LoanContext.Provider value={{ loans, loading, error, addLoan, deleteLoan, recordPayment, refreshLoans }}>
      {children}
    </LoanContext.Provider>
  );
}

export function useLoans() {
  const ctx = useContext(LoanContext);
  if (!ctx) throw new Error('useLoans must be used within LoanProvider');
  return ctx;
}
