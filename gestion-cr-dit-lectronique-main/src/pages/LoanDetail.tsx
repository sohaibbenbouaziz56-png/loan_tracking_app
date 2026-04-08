import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoans, getAmountPaid, getRemaining, getLoanStatus, getNextPaymentDate } from '@/contexts/LoanContext';
import { useProducts } from '@/contexts/ProductContext';
import { formatDZD, LTR, formatDate } from '@/lib/formatters';
import { ArrowLeft, CreditCard, Trash2 } from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';

export default function LoanDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { loans, recordPayment, deleteLoan } = useLoans();
  const { refreshProducts } = useProducts();
  const navigate = useNavigate();
  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loan = loans.find(l => l.id === id);
  if (!loan) return <div className="p-8 text-center text-muted-foreground">{t('no_data')}</div>;

  const status = getLoanStatus(loan);
  const statusCls = status === 'active' ? 'status-active' : status === 'overdue' ? 'status-overdue' : 'status-paid';

  const handleDelete = async () => {
    if (confirm(t('confirm_delete'))) {
      try {
        await deleteLoan(loan.id);
        await refreshProducts();
        navigate('/loans');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete loan');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/loans" className="p-2 rounded-lg hover:bg-secondary"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold">{t('loan_details')}</h1>
        <span className={`status-badge ${statusCls}`}>{t(status)}</span>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Borrower info */}
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-semibold mb-3">{t('borrower_info')}</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">{t('borrower')}:</span> <span className="font-medium">{loan.borrowerName}</span></div>
            <div><span className="text-muted-foreground">{t('phone')}:</span> <LTR>{loan.phone}</LTR></div>
            {loan.nationalId && <div><span className="text-muted-foreground">{t('national_id')}:</span> <LTR>{loan.nationalId}</LTR></div>}
            {loan.address && <div><span className="text-muted-foreground">{t('address')}:</span> {loan.address}</div>}
          </div>
        </div>

        {/* Loan info */}
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-semibold mb-3">{t('loan_info')}</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">{t('product')}:</span> {loan.productName}</div>
            <div><span className="text-muted-foreground">{t('purchase_date')}:</span> {formatDate(loan.createdAt)}</div>
            <div><span className="text-muted-foreground">{t('advance')}:</span> <LTR>{formatDZD(loan.advanceAmount)}</LTR></div>
            <div><span className="text-muted-foreground">{t('total_amount')}:</span> <LTR>{formatDZD(loan.totalAmount)}</LTR></div>
            <div><span className="text-muted-foreground">{t('amount_paid')}:</span> <LTR>{formatDZD(getAmountPaid(loan))}</LTR></div>
            <div className="text-lg font-bold"><span className="text-muted-foreground">{t('remaining')}:</span> <LTR>{formatDZD(getRemaining(loan))}</LTR></div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-sm">{t('progress')}:</span>
              <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${Math.min(100, (getAmountPaid(loan) / loan.totalAmount) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium">{Math.round((getAmountPaid(loan) / loan.totalAmount) * 100)}%</span>
            </div>
            {status !== 'paid' && (
              <div><span className="text-muted-foreground">{t('next_payment')}:</span> {formatDate(getNextPaymentDate(loan))}</div>
            )}
            {loan.notes && <div><span className="text-muted-foreground">{t('notes')}:</span> {loan.notes}</div>}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {status !== 'paid' && (
          <button
            onClick={() => setShowPayment(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
          >
            <CreditCard className="w-4 h-4" /> {t('record_payment')}
          </button>
        )}
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90"
        >
          <Trash2 className="w-4 h-4" /> {t('delete')}
        </button>
      </div>

      {/* Payment history */}
      <div className="bg-card rounded-xl border p-5">
        <h3 className="font-semibold mb-4">{t('payment_history')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-start p-2">{t('payment_date')}</th>
                <th className="text-start p-2">{t('payment_amount')}</th>
                <th className="text-start p-2">{t('payment_type')}</th>
                <th className="text-start p-2">{t('notes')}</th>
              </tr>
            </thead>
            <tbody>
              {(loan.payments || []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(p => (
                <tr key={p.id} className="border-b">
                  <td className="p-2">{formatDate(p.date)}</td>
                  <td className="p-2"><LTR>{formatDZD(p.amount)}</LTR></td>
                  <td className="p-2">
                    <span className={`status-badge ${p.type === 'advance' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                      {p.type === 'advance' ? t('payment_type_advance') : t('payment_type_monthly')}
                    </span>
                  </td>
                  <td className="p-2 text-muted-foreground">{p.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          loanId={loan.id}
          onClose={() => setShowPayment(false)}
          onSave={(amount, note) => { recordPayment(loan.id, amount, note); setShowPayment(false); }}
        />
      )}
    </div>
  );
}
  