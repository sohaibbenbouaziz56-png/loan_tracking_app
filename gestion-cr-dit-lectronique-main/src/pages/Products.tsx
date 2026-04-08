import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProducts, Product } from '@/contexts/ProductContext';
import { formatDZD, LTR } from '@/lib/formatters';
import KpiCard from '@/components/KpiCard';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';

export default function ProductsPage() {
  const { t } = useLanguage();
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const filteredProducts = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  // KPI calculations
  const totalCapital = products.reduce((s, p) => s + p.buyingPrice * p.availableQuantity, 0);
  const totalCashRevenue = products.reduce((s, p) => s + p.originalPrice * p.availableQuantity, 0);
  const totalCreditRevenue = products.reduce((s, p) => s + p.baseInstallmentPrice * p.availableQuantity, 0);
  const totalProfitCash = totalCashRevenue - totalCapital;
  const totalProfitCredit = totalCreditRevenue - totalCapital;

  const totalQty = products.reduce((s, p) => s + p.availableQuantity, 0);

  // Weighted averages
  const avgMarginCash = totalQty > 0 ? products.reduce((s, p) => s + ((p.originalPrice - p.buyingPrice) / p.originalPrice * 100) * p.availableQuantity, 0) / totalQty : 0;
  const avgMarginCredit = totalQty > 0 ? products.reduce((s, p) => s + ((p.baseInstallmentPrice - p.buyingPrice) / p.baseInstallmentPrice * 100) * p.availableQuantity, 0) / totalQty : 0;
  const avgMarkupCash = totalQty > 0 ? products.reduce((s, p) => s + ((p.originalPrice - p.buyingPrice) / p.buyingPrice * 100) * p.availableQuantity, 0) / totalQty : 0;
  const avgMarkupCredit = totalQty > 0 ? products.reduce((s, p) => s + ((p.baseInstallmentPrice - p.buyingPrice) / p.buyingPrice * 100) * p.availableQuantity, 0) / totalQty : 0;

  const outOfStock = products.filter(p => p.availableQuantity === 0).length;
  const lowStock = products.filter(p => p.availableQuantity >= 1 && p.availableQuantity <= 2).length;

  const handleDelete = async (id: string) => {
    if (confirm(t('confirm_delete'))) {
      try {
        await deleteProduct(id);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete product');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">{t('products')}</h1>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg">
          {error}
        </div>
      )}

      {/* KPI Panel */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <KpiCard label={t('total_capital_invested')} value={totalCapital} tooltip={t('tooltip_capital_invested')} type="money" colorVariant="blue" />
        <KpiCard label={t('total_cash_revenue_potential')} value={totalCashRevenue} tooltip={t('tooltip_ca_cash')} type="money" colorVariant="green" />
        <KpiCard label={t('total_credit_revenue_potential')} value={totalCreditRevenue} tooltip={t('tooltip_ca_credit')} type="money" colorVariant="green" />
        <KpiCard label={t('total_gross_profit_cash')} value={totalProfitCash} tooltip={t('tooltip_profit_cash')} type="money" colorVariant="green" />
        <KpiCard label={t('total_gross_profit_credit')} value={totalProfitCredit} tooltip={t('tooltip_profit_credit')} type="money" colorVariant="green" />
        <KpiCard label={t('average_margin_cash')} value={avgMarginCash} tooltip={t('tooltip_margin_cash')} type="percent" colorVariant="blue" />
        <KpiCard label={t('average_margin_credit')} value={avgMarginCredit} tooltip={t('tooltip_margin_credit')} type="percent" colorVariant="blue" />
        <KpiCard label={t('average_markup_cash')} value={avgMarkupCash} tooltip={t('tooltip_markup_cash')} type="percent" colorVariant="amber" />
        <KpiCard label={t('average_markup_credit')} value={avgMarkupCredit} tooltip={t('tooltip_markup_credit')} type="percent" colorVariant="amber" />
        <KpiCard label={t('total_units_in_stock')} value={totalQty} tooltip={t('tooltip_units')} type="count" colorVariant={totalQty > 10 ? 'green' : 'amber'} />
        <KpiCard label={t('out_of_stock')} value={outOfStock} tooltip={t('tooltip_out_of_stock')} type="count" colorVariant={outOfStock > 0 ? 'red' : 'green'} />
        <KpiCard label={t('low_stock_alert')} value={lowStock} tooltip={t('tooltip_low_stock')} type="count" colorVariant={lowStock > 0 ? 'amber' : 'green'} />
      </div>

      {/* Product List */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="relative">
          <Search className="absolute top-2.5 left-3 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search')}
            className="pl-9 pr-4 py-2 border rounded-lg bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button onClick={() => { setEditProduct(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> {t('add_product')}
        </button>
      </div>

      <div className="bg-card rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/50">
              <th className="text-start p-3">{t('product_name')}</th>
              <th className="text-start p-3">{t('description')}</th>
              <th className="text-start p-3">{t('buying_price')}</th>
              <th className="text-start p-3">{t('original_price')}</th>
              <th className="text-start p-3">{t('installment_price')}</th>
              <th className="text-start p-3">{t('markup_cash')}</th>
              <th className="text-start p-3">{t('markup_credit')}</th>
              <th className="text-start p-3">{t('available_qty')}</th>
              <th className="text-start p-3">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => {
              const markupCash = ((p.originalPrice - p.buyingPrice) / p.buyingPrice * 100);
              const markupCredit = ((p.baseInstallmentPrice - p.buyingPrice) / p.buyingPrice * 100);
              const qtyColor = p.availableQuantity === 0 ? 'bg-destructive text-destructive-foreground' : p.availableQuantity <= 2 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800';
              return (
                <tr key={p.id} className="border-b hover:bg-secondary/30">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-muted-foreground">{p.description || '—'}</td>
                  <td className="p-3"><LTR>{formatDZD(p.buyingPrice)}</LTR></td>
                  <td className="p-3"><LTR>{formatDZD(p.originalPrice)}</LTR></td>
                  <td className="p-3"><LTR>{formatDZD(p.baseInstallmentPrice)}</LTR></td>
                  <td className="p-3"><LTR>{markupCash.toFixed(1)}%</LTR></td>
                  <td className="p-3"><LTR>{markupCredit.toFixed(1)}%</LTR></td>
                  <td className="p-3"><span className={`status-badge ${qtyColor}`}>{p.availableQuantity}</span></td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => { setEditProduct(p); setShowModal(true); }} className="p-1.5 rounded hover:bg-secondary">
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-secondary">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredProducts.length === 0 && (
              <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">{t('no_data')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && <ProductModal product={editProduct} onClose={() => setShowModal(false)} onSave={(p) => { if (editProduct) updateProduct(p as Product); else addProduct(p); setShowModal(false); }} />}
    </div>
  );
}

function ProductModal({ product, onClose, onSave }: { product: Product | null; onClose: () => void; onSave: (p: Omit<Product, 'id'> | Product) => void }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    buyingPrice: product?.buyingPrice?.toString() || '',
    originalPrice: product?.originalPrice?.toString() || '',
    baseInstallmentPrice: product?.baseInstallmentPrice?.toString() || '',
    availableQuantity: product?.availableQuantity?.toString() || '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const data = {
        name: form.name,
        description: form.description,
        buyingPrice: parseFloat(form.buyingPrice) || 0,
        originalPrice: parseFloat(form.originalPrice) || 0,
        baseInstallmentPrice: parseFloat(form.baseInstallmentPrice) || 0,
        availableQuantity: parseInt(form.availableQuantity) || 0,
      };
      if (product) onSave({ ...data, id: product.id });
      else onSave(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    }
  };

  const inputCls = "w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30" onClick={onClose}>
      <div className="bg-card rounded-xl border shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{product ? t('edit_product') : t('add_product')}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>
        {error && (
          <div className="p-3 mb-4 bg-destructive/10 border border-destructive text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">{t('product_name')}</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} required />
          </div>
          <div>
            <label className="text-sm font-medium">{t('description')}</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="text-sm font-medium">{t('buying_price')} (DA)</label>
            <input type="number" step="0.01" value={form.buyingPrice} onChange={e => setForm({ ...form, buyingPrice: e.target.value })} className={inputCls} required />
          </div>
          <div>
            <label className="text-sm font-medium">{t('original_price')} (DA)</label>
            <input type="number" step="0.01" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })} className={inputCls} required />
          </div>
          <div>
            <label className="text-sm font-medium">{t('installment_price')} (DA)</label>
            <input type="number" step="0.01" value={form.baseInstallmentPrice} onChange={e => setForm({ ...form, baseInstallmentPrice: e.target.value })} className={inputCls} required />
          </div>
          <div>
            <label className="text-sm font-medium">{t('quantity')}</label>
            <input type="number" value={form.availableQuantity} onChange={e => setForm({ ...form, availableQuantity: e.target.value })} className={inputCls} required />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-secondary text-secondary-foreground">{t('cancel')}</button>
            <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-medium">{t('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
