import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDZD, LTR } from '@/lib/formatters';
import { X } from 'lucide-react';

interface Props {
  loanId: string;
  onClose: () => void;
  onSave: (amount: number, note: string) => void;
}

export default function PaymentModal({ loanId, onClose, onSave }: Props) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(amount);
    if (isNaN(num) || num <= 0) return;
    onSave(num, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30" onClick={onClose}>
      <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{t('record_payment')}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">{t('payment_amount')}</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
              min={1}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">{t('payment_note')}</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <p className="text-xs text-muted-foreground">{t('payment_type')}: {t('payment_type_monthly')}</p>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80">
              {t('cancel')}
            </button>
            <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
              {t('confirm_payment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
