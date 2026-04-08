import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoans } from '@/contexts/LoanContext';
import { useProducts } from '@/contexts/ProductContext';
import { formatDZD, LTR } from '@/lib/formatters';

export default function AddLoan() {
  const { t } = useLanguage();
  const { addLoan } = useLoans();
  const { products, refreshProducts } = useProducts();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    borrowerName: '', phone: '', nationalId: '', address: '',
    productId: '', advance: '', totalAmount: '', notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = products.find(p => p.id === form.productId);
  const total = parseFloat(form.totalAmount) || 0;
  const advance = parseFloat(form.advance) || 0;

  // Auto-fill total amount when product is selected
  useEffect(() => {
    if (selectedProduct) {
      setForm(prev => ({
        ...prev,
        totalAmount: selectedProduct.baseInstallmentPrice.toString()
      }));
    }
  }, [form.productId, selectedProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      if (!form.borrowerName || !form.phone || !form.productId || total <= 0) {
        setError(t('please_fill_required_fields'));
        return;
      }

      await addLoan({
        borrowerName: form.borrowerName,
        phone: form.phone,
        nationalId: form.nationalId,
        address: form.address,
        productId: form.productId,
        totalAmount: total,
        advanceAmount: advance,
        notes: form.notes,
      });
      await refreshProducts();
      navigate('/loans');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create loan');
    }
  };

  const inputCls = "w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const selectCls = "w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">{t('add_loan')}</h1>
      
      {error && (
        <div className="p-4 mb-6 bg-destructive/10 border border-destructive text-destructive rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">{t('borrower_name')} *</label>
            <input value={form.borrowerName} onChange={e => setForm({ ...form, borrowerName: e.target.value })} className={inputCls} required />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{t('phone_number')} *</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder={t('phone_hint')} required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">{t('national_id')}</label>
            <input value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{t('address')}</label>
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputCls} />
          </div>
        </div>

        {/* Product selector - STRICT DROP DOWN */}
        <div>
          <label className="text-sm font-medium block mb-1">{t('product')} *</label>
          <div className="relative">
            <select 
              value={form.productId} 
              onChange={e => setForm({ ...form, productId: e.target.value })}
              className={selectCls}
              required
            >
              <option value="">-- {t('select_product')} --</option>
              {products.filter(p => p.availableQuantity > 0).map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.availableQuantity} en stock) - {formatDZD(p.baseInstallmentPrice)}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        {selectedProduct && (
          <div className="bg-secondary/30 rounded-xl p-4 text-sm space-y-3 border border-secondary">
            <div className="flex items-center justify-between border-b border-secondary pb-2">
              <span className="font-bold text-primary">{t('product_info')}</span>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                {t('available_qty')}: {selectedProduct.availableQuantity}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground text-xs">{t('buying_price')}</span>
                <p className="font-medium"><LTR>{formatDZD(selectedProduct.buyingPrice)}</LTR></p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">{t('original_price')}</span>
                <p className="font-medium"><LTR>{formatDZD(selectedProduct.originalProductPrice || selectedProduct.originalPrice)}</LTR></p>
              </div>
              <div className="col-span-2 bg-background/50 p-2 rounded-lg border border-secondary/50">
                <span className="text-muted-foreground text-xs">{t('installment_price')} (Prix Crédit Conseillé)</span>
                <p className="text-lg font-bold text-primary"><LTR>{formatDZD(selectedProduct.baseInstallmentPrice)}</LTR></p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">{t('total_to_pay')} * (DA)</label>
            <input 
              type="number" 
              step="0.01" 
              value={form.totalAmount} 
              onChange={e => setForm({ ...form, totalAmount: e.target.value })} 
              className={inputCls} 
              required 
              min={1} 
            />
            <p className="text-[10px] text-muted-foreground mt-1 italic">Vous pouvez ajuster le prix final si nécessaire.</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{t('advance')} (DA)</label>
            <input 
              type="number" 
              step="0.01" 
              value={form.advance} 
              onChange={e => setForm({ ...form, advance: e.target.value })} 
              className={inputCls} 
              min={0} 
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">{t('notes')}</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls} rows={2} />
        </div>

        {/* Live summary */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
          <h4 className="font-bold text-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            {t('loan_summary')}
          </h4>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('total_to_pay_label')}:</span>
            <span className="font-medium"><LTR>{formatDZD(total)}</LTR></span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('advance_label')}:</span>
            <span className="font-medium text-success"><LTR>{formatDZD(advance)}</LTR></span>
          </div>
          <div className="flex justify-between text-base font-bold border-t border-primary/10 pt-2 mt-2">
            <span>{t('remaining_after_advance')}:</span>
            <span className="text-primary"><LTR>{formatDZD(Math.max(0, total - advance))}</LTR></span>
          </div>
        </div>

        <button type="submit" className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]">
          {t('submit_loan')}
        </button>
      </form>
    </div>
  );
}
