import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoans, getAmountPaid, getRemaining, getLoanStatus, getLastPaymentDate } from '@/contexts/LoanContext';
import { useProducts } from '@/contexts/ProductContext';
import { formatDZD, formatDate, formatDZDRaw } from '@/lib/formatters';
import { FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
  const { t, language } = useLanguage();
  const { loans } = useLoans();
  const { products } = useProducts();
  const [period, setPeriod] = useState<'all' | 'month' | 'year'>('all');

  const now = new Date();

  const filterByPeriod = () => {
    return loans.filter(loan => {
      if (period === 'all') return true;
      const createdAt = new Date(loan.createdAt);
      if (period === 'month') return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
      if (period === 'year') return createdAt.getFullYear() === now.getFullYear();
      return true;
    });
  };

  const filteredLoans = filterByPeriod();
  const activeCnt = filteredLoans.filter(l => getLoanStatus(l) === 'active').length;
  const overdueCnt = filteredLoans.filter(l => getLoanStatus(l) === 'overdue').length;
  const totalRemaining = filteredLoans.reduce((s, l) => s + getRemaining(l), 0);
  const totalCollected = filteredLoans.reduce((s, l) => s + getAmountPaid(l), 0);

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Électronique Shop — Rapport', 14, 20);
    doc.setFontSize(10);
    doc.text(`${t('report_generated_on')}: ${formatDate(now)}`, 14, 28);
    const periodLabel = period === 'all' ? t('export_all') : period === 'month' ? t('export_this_month') : t('export_this_year');
    doc.text(`${t('export_period')}: ${periodLabel}`, 14, 34);

    doc.setFontSize(12);
    doc.text(t('report_summary'), 14, 44);
    doc.setFontSize(10);
    doc.text(`${t('active_loans')}: ${activeCnt}`, 14, 52);
    doc.text(`${t('overdue_loans')}: ${overdueCnt}`, 14, 58);
    doc.text(`${t('remaining')}: ${formatDZD(totalRemaining)}`, 14, 64);
    doc.text(`${t('amount_paid')}: ${formatDZD(totalCollected)}`, 14, 70);

    doc.setFontSize(12);
    doc.text(t('report_loans_section'), 14, 82);

    autoTable(doc, {
      startY: 86,
      head: [[t('borrower'), t('phone'), t('product'), t('total_amount'), t('amount_paid'), t('remaining'), t('status')]],
      body: filteredLoans.map(l => [
        l.borrowerName, l.phone, l.productName,
        formatDZD(l.totalAmount), formatDZD(getAmountPaid(l)), formatDZD(getRemaining(l)),
        t(getLoanStatus(l)),
      ]),
      styles: { fontSize: 8 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 160;

    doc.setFontSize(12);
    doc.text(t('report_products_section'), 14, finalY + 10);

    autoTable(doc, {
      startY: finalY + 14,
      head: [[t('product_name'), t('buying_price'), t('original_price'), t('installment_price'), t('quantity')]],
      body: products.map(p => [
        p.name, formatDZD(p.buyingPrice), formatDZD(p.originalPrice), formatDZD(p.baseInstallmentPrice), p.availableQuantity.toString(),
      ]),
      styles: { fontSize: 8 },
    });

    doc.save(`rapport_loans_${now.toISOString().slice(0, 10)}.pdf`);
  };

  const exportCSV = () => {
    let csv = `${t('report_loans_section')}\n`;
    csv += `${t('borrower')};${t('phone')};${t('product')};${t('total_amount')};${t('amount_paid')};${t('remaining')};${t('status')}\n`;
    filteredLoans.forEach(l => {
      csv += `${l.borrowerName};${l.phone};${l.productName};${formatDZDRaw(l.totalAmount)};${formatDZDRaw(getAmountPaid(l))};${formatDZDRaw(getRemaining(l))};${t(getLoanStatus(l))}\n`;
    });
    csv += `\n${t('report_products_section')}\n`;
    csv += `${t('product_name')};${t('buying_price')};${t('original_price')};${t('installment_price')};${t('quantity')}\n`;
    products.forEach(p => {
      csv += `${p.name};${p.buyingPrice};${p.originalPrice};${p.baseInstallmentPrice};${p.availableQuantity}\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_loans_${now.toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">{t('export_report')}</h1>

      {/* Period selector */}
      <div className="flex gap-2 items-center">
        <span className="text-sm font-medium text-muted-foreground">{t('export_period')}:</span>
        {([['all', t('export_all')], ['month', t('export_this_month')], ['year', t('export_this_year')]] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setPeriod(val as any)}
            className={`px-3 py-2 text-sm rounded-lg font-medium ${period === val ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-card rounded-xl border p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div><p className="text-sm text-muted-foreground">{t('active_loans')}</p><p className="text-xl font-bold">{activeCnt}</p></div>
        <div><p className="text-sm text-muted-foreground">{t('overdue_loans')}</p><p className="text-xl font-bold text-destructive">{overdueCnt}</p></div>
        <div><p className="text-sm text-muted-foreground">{t('remaining')}</p><p className="text-xl font-bold">{formatDZD(totalRemaining)}</p></div>
        <div><p className="text-sm text-muted-foreground">{t('amount_paid')}</p><p className="text-xl font-bold text-success">{formatDZD(totalCollected)}</p></div>
      </div>

      {/* Export buttons */}
      <div className="flex gap-4">
        <button onClick={exportPDF} className="flex items-center gap-2 px-6 py-3 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90">
          <FileText className="w-5 h-5" /> {t('export_pdf')}
        </button>
        <button onClick={exportCSV} className="flex items-center gap-2 px-6 py-3 bg-success text-success-foreground rounded-lg font-medium hover:bg-success/90">
          <Download className="w-5 h-5" /> {t('export_csv')}
        </button>
      </div>
    </div>
  );
}
