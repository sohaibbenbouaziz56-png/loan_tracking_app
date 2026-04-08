import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoans, getAmountPaid, getRemaining, getLoanStatus, getNextPaymentDate } from '@/contexts/LoanContext';
import { useProducts } from '@/contexts/ProductContext';
import { formatDZD, LTR, formatDate } from '@/lib/formatters';
import { Search, Eye, CreditCard, Trash2 } from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';

export default function LoansPage() {
  const { t } = useLanguage();
  const { loans, recordPayment, deleteLoan } = useLoans();
  const { refreshProducts } = useProducts();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'paid'>('all');
  const [paymentLoanId, setPaymentLoanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = loans.filter(loan => {
    const status = getLoanStatus(loan);
    if (filter !== 'all' && status !== filter) return false;
    if (search && !loan.borrowerName.toLowerCase().includes(search.toLowerCase()) && !loan.phone.includes(search)) return false;
    return true;
  });

  const statusBadge = (status: string) => {
    const cls = status === 'active' ? 'status-active' : status === 'overdue' ? 'status-overdue' : 'status-paid';
    return <span className={`status-badge ${cls}`}>{t(status as any)}</span>;
  };

  const handleDelete = async (loanId: string) => {
    if (confirm(t('confirm_delete'))) {
      try {
        await deleteLoan(loanId);
        await refreshProducts();
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete loan');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <h1 className="text-2xl font-bold">{t('loans')}</h1>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute top-2.5 left-3 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('search')}
              className="pl-9 pr-4 py-2 border rounded-lg bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {(['all', 'active', 'overdue', 'paid'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {f === 'all' ? t('all') : t(f)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-card rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/50">
              <th className="text-start p-3">{t('borrower')}</th>
              <th className="text-start p-3">{t('phone')}</th>
              <th className="text-start p-3">{t('product')}</th>
              <th className="text-start p-3">{t('total_amount')}</th>
              <th className="text-start p-3">{t('amount_paid')}</th>
              <th className="text-start p-3">{t('remaining')}</th>
              <th className="text-start p-3">{t('progress')}</th>
              <th className="text-start p-3">{t('next_payment')}</th>
              <th className="text-start p-3">{t('status')}</th>
              <th className="text-start p-3">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(loan => {
              const status = getLoanStatus(loan);
              return (
                <tr key={loan.id} className="border-b hover:bg-secondary/30">
                  <td className="p-3 font-medium">{loan.borrowerName}</td>
                  <td className="p-3"><LTR>{loan.phone}</LTR></td>
                  <td className="p-3">{loan.productName}</td>
                  <td className="p-3"><LTR>{formatDZD(loan.totalAmount)}</LTR></td>
                  <td className="p-3"><LTR>{formatDZD(getAmountPaid(loan))}</LTR></td>
	                  <td className="p-3"><LTR>{formatDZD(getRemaining(loan))}</LTR></td>
	                  <td className="p-3">
	                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
	                      <div 
	                        className="h-full bg-primary transition-all duration-500" 
	                        style={{ width: `${Math.min(100, (getAmountPaid(loan) / loan.totalAmount) * 100)}%` }}
	                      />
	                    </div>
	                    <span className="text-[10px] text-muted-foreground mt-1 block">
	                      {Math.round((getAmountPaid(loan) / loan.totalAmount) * 100)}%
	                    </span>
	                  </td>
	                  <td className="p-3">{status !== 'paid' ? formatDate(getNextPaymentDate(loan)) : '—'}</td>
                  <td className="p-3">{statusBadge(status)}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link to={`/loans/${loan.id}`} className="p-1.5 rounded hover:bg-secondary" title={t('view')}>
                        <Eye className="w-4 h-4 text-primary" />
                      </Link>
                      {status !== 'paid' && (
                        <button onClick={() => setPaymentLoanId(loan.id)} className="p-1.5 rounded hover:bg-secondary" title={t('record_payment')}>
                          <CreditCard className="w-4 h-4 text-success" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(loan.id)} className="p-1.5 rounded hover:bg-secondary" title={t('delete')}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">{t('no_data')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {paymentLoanId && (
        <PaymentModal
          loanId={paymentLoanId}
          onClose={() => setPaymentLoanId(null)}
          onSave={(amount, note) => { recordPayment(paymentLoanId, amount, note); setPaymentLoanId(null); }}
        />
      )}
    </div>
  );
}
