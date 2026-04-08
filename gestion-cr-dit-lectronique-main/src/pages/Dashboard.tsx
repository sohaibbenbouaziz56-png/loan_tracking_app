import React from 'react';
import { useLanguage, useMonthNames } from '@/contexts/LanguageContext';
import { useLoans, getAmountPaid, getRemaining, getLoanStatus, getLastPaymentDate, getNextPaymentDate } from '@/contexts/LoanContext';
import { useProducts } from '@/contexts/ProductContext';
import { formatDZD, LTR, daysBetween, formatDate } from '@/lib/formatters';
import { Link } from 'react-router-dom';
import { TrendingUp, AlertTriangle, DollarSign, Clock, BarChart3, PieChart as PieIcon, Activity } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';

const COLORS = { 
  active: '#6366f1', 
  overdue: '#ef4444', 
  paid: '#10b981', 
  advance: '#f59e0b', 
  monthly: '#6366f1',
  remaining: '#e2e8f0'
};

export default function Dashboard() {
  const { t } = useLanguage();
  const months = useMonthNames();
  const { loans } = useLoans();
  const { products } = useProducts();
  const now = new Date();

  // --- KPI Calculations ---
  const activeLoans = loans.filter(l => getLoanStatus(l) === 'active');
  const overdueLoans = loans.filter(l => getLoanStatus(l) === 'overdue');
  const paidLoans = loans.filter(l => getLoanStatus(l) === 'paid');
  const totalOwed = loans.filter(l => getLoanStatus(l) !== 'paid').reduce((s, l) => s + getRemaining(l), 0);
  const totalLent = loans.reduce((s, l) => s + l.totalAmount, 0);
  const totalCollected = loans.reduce((s, l) => s + getAmountPaid(l), 0);
  const collectionRate = totalLent > 0 ? (totalCollected / totalLent) * 100 : 0;

  // --- 1. Loan Health Funnel (Pie Chart) ---
  const healthData = [
    { name: t('active'), value: activeLoans.length, color: COLORS.active },
    { name: t('overdue'), value: overdueLoans.length, color: COLORS.overdue },
    { name: t('paid'), value: paidLoans.length, color: COLORS.paid },
  ];

  // --- 2. Collection Performance (Area Chart - Last 6 Months) ---
  const getCollectionHistory = () => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      let collected = 0;
      loans.forEach(loan => {
        (loan.payments || []).forEach(p => {
          const pDate = new Date(p.date);
          if (pDate.getMonth() === m && pDate.getFullYear() === y) {
            collected += p.amount;
          }
        });
      });
      data.push({ name: months[m], amount: collected });
    }
    return data;
  };
  const collectionHistory = getCollectionHistory();

  // --- 3. Risk Exposure by Product (Bar Chart) ---
  const riskByProduct = products.map(p => {
    const productLoans = loans.filter(l => l.productId === p.id);
    const overdueAmount = productLoans
      .filter(l => getLoanStatus(l) === 'overdue')
      .reduce((s, l) => s + getRemaining(l), 0);
    const activeAmount = productLoans
      .filter(l => getLoanStatus(l) === 'active')
      .reduce((s, l) => s + getRemaining(l), 0);
    return { name: p.name, overdue: overdueAmount, active: activeAmount };
  }).filter(p => p.overdue > 0 || p.active > 0).sort((a, b) => (b.overdue + b.active) - (a.overdue + a.active)).slice(0, 5);

  // --- 4. Upcoming Collections (Next 30 Days) ---
  const upcomingCollections = loans.filter(l => {
    if (getRemaining(l) === 0) return false;
    const nextDate = getNextPaymentDate(l);
    const days = daysBetween(now, nextDate);
    return days >= 0 && days <= 30;
  }).sort((a, b) => getNextPaymentDate(a).getTime() - getNextPaymentDate(b).getTime());

  const recentLoans = [...loans].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-card border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: entry.color || entry.fill }}>
            {entry.name}: <LTR>{formatDZD(entry.value)}</LTR>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card kpi-card-accent-blue">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg"><Activity className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('active_loans')}</p>
              <p className="text-2xl font-bold"><LTR>{activeLoans.length}</LTR></p>
            </div>
          </div>
        </div>
        <div className="kpi-card kpi-card-accent-red">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('overdue_loans')}</p>
              <p className="text-2xl font-bold text-destructive"><LTR>{overdueLoans.length}</LTR></p>
            </div>
          </div>
        </div>
        <div className="kpi-card kpi-card-accent-green">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg"><DollarSign className="w-5 h-5 text-success" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('total_owed')}</p>
              <p className="text-2xl font-bold text-success"><LTR>{formatDZD(totalOwed)}</LTR></p>
            </div>
          </div>
        </div>
        <div className="kpi-card kpi-card-accent-amber">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg"><TrendingUp className="w-5 h-5 text-amber-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('collection_rate')}</p>
              <p className="text-2xl font-bold text-amber-600"><LTR>{Math.round(collectionRate)}%</LTR></p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Collection Trend (Area Chart) */}
        <div className="bg-card rounded-xl border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> {t('collection_trend')}</h3>
            <span className="text-xs text-muted-foreground">{t('last_6_months')}</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={collectionHistory}>
              <defs>
                <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.active} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.active} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} hide />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="amount" stroke={COLORS.active} fillOpacity={1} fill="url(#colorColl)" strokeWidth={3} name={t('amount_paid')} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Risk Exposure by Product (Stacked Bar) */}
        <div className="bg-card rounded-xl border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /> {t('risk_exposure')}</h3>
            <span className="text-xs text-muted-foreground">{t('top_5_products')}</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={riskByProduct} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fontSize: 11}} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="overdue" stackId="a" fill={COLORS.overdue} name={t('overdue')} radius={[0, 0, 0, 0]} barSize={20} />
              <Bar dataKey="active" stackId="a" fill={COLORS.active} name={t('active')} radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Loan Status Distribution (Donut) */}
        <div className="bg-card rounded-xl border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2"><PieIcon className="w-4 h-4 text-primary" /> {t('loan_portfolio')}</h3>
          </div>
          <div className="flex flex-col md:flex-row items-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie 
                  data={healthData} 
                  cx="50%" cy="50%" 
                  innerRadius={60} outerRadius={85} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {healthData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full md:w-1/2 space-y-3">
              {healthData.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Upcoming Collections (List) */}
        <div className="bg-card rounded-xl border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> {t('upcoming_collections')}</h3>
            <Link to="/loans" className="text-xs text-primary hover:underline">{t('view_all')}</Link>
          </div>
          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
            {upcomingCollections.length === 0 ? (
              <p className="text-center text-muted-foreground py-10 text-sm">{t('no_upcoming')}</p>
            ) : (
              upcomingCollections.slice(0, 6).map(loan => (
                <div key={loan.id} className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-secondary/10 transition-colors">
                  <div>
                    <p className="text-sm font-bold">{loan.borrowerName}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{loan.productName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary"><LTR>{formatDZD(getRemaining(loan) / 10)}</LTR></p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(getNextPaymentDate(loan))}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b bg-secondary/10">
          <h3 className="font-bold">{t('recent_loans')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground bg-secondary/5">
                <th className="text-start p-4 font-semibold">{t('borrower')}</th>
                <th className="text-start p-4 font-semibold">{t('product')}</th>
                <th className="text-start p-4 font-semibold">{t('total_amount')}</th>
                <th className="text-start p-4 font-semibold">{t('progress')}</th>
                <th className="text-start p-4 font-semibold">{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {recentLoans.map(loan => {
                const status = getLoanStatus(loan);
                const progress = Math.round((getAmountPaid(loan) / loan.totalAmount) * 100);
                return (
                  <tr key={loan.id} className="border-t hover:bg-secondary/20 transition-colors">
                    <td className="p-4">
                      <Link to={`/loans/${loan.id}`} className="font-bold text-primary hover:underline">{loan.borrowerName}</Link>
                    </td>
                    <td className="p-4 text-muted-foreground">{loan.productName}</td>
                    <td className="p-4 font-medium"><LTR>{formatDZD(loan.totalAmount)}</LTR></td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-[10px] font-bold">{progress}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`status-badge ${status === 'active' ? 'status-active' : status === 'overdue' ? 'status-overdue' : 'status-paid'}`}>
                        {t(status as any)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
