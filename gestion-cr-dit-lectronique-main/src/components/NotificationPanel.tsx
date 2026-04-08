import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoans, getLastPaymentDate, getRemaining } from '@/contexts/LoanContext';
import { daysBetween, formatDate } from '@/lib/formatters';
import { X, Clock, AlertTriangle } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function NotificationPanel({ onClose }: Props) {
  const { t } = useLanguage();
  const { loans } = useLoans();
  const now = new Date();

  const dueToday: { loan: typeof loans[0]; daysSince: number }[] = [];
  const overdue: { loan: typeof loans[0]; daysSince: number }[] = [];

  loans.forEach(loan => {
    if (getRemaining(loan) === 0) return;
    const lastPay = getLastPaymentDate(loan);
    const daysSince = daysBetween(lastPay, now);
    if (daysSince >= 28 && daysSince <= 31) {
      dueToday.push({ loan, daysSince });
    } else if (daysSince > 31) {
      overdue.push({ loan, daysSince });
    }
  });

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/20" />
      <div
        className="absolute top-0 right-0 w-full max-w-md h-full bg-card shadow-xl animate-slide-in overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">{t('notifications')}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {dueToday.length === 0 && overdue.length === 0 && (
          <p className="p-8 text-center text-muted-foreground">{t('no_notifications')}</p>
        )}

        {dueToday.length > 0 && (
          <div className="p-4">
            <h3 className="flex items-center gap-2 font-semibold text-warning mb-3">
              <Clock className="w-4 h-4" />
              {t('due_today')}
            </h3>
            <div className="space-y-3">
              {dueToday.map(({ loan }) => (
                <div key={loan.id} className="bg-warning/10 rounded-lg p-3 border border-warning/20">
                  <p className="font-medium">{loan.borrowerName}</p>
                  <p className="text-sm text-muted-foreground">{loan.phone}</p>
                  <p className="text-sm text-muted-foreground">{loan.productName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('last_payment_on')} {formatDate(getLastPaymentDate(loan))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {overdue.length > 0 && (
          <div className="p-4">
            <h3 className="flex items-center gap-2 font-semibold text-destructive mb-3">
              <AlertTriangle className="w-4 h-4" />
              {t('overdue_label')}
            </h3>
            <div className="space-y-3">
              {overdue.map(({ loan, daysSince }) => (
                <div key={loan.id} className="bg-destructive/10 rounded-lg p-3 border border-destructive/20">
                  <p className="font-medium">{loan.borrowerName}</p>
                  <p className="text-sm text-muted-foreground">{loan.phone}</p>
                  <p className="text-sm text-muted-foreground">{loan.productName}</p>
                  <p className="text-xs text-destructive mt-1">
                    {daysSince - 30} {t('days_overdue')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('last_payment_on')} {formatDate(getLastPaymentDate(loan))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
