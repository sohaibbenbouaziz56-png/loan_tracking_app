import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoans, getLastPaymentDate, getRemaining, getLoanStatus } from '@/contexts/LoanContext';
import { daysBetween, formatDate } from '@/lib/formatters';
import { LayoutDashboard, CreditCard, PlusCircle, Package, Bell, FileText, Menu, X, Globe } from 'lucide-react';
import NotificationPanel from './NotificationPanel';

export default function Navbar() {
  const { t, language, setLanguage } = useLanguage();
  const { loans } = useLoans();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const now = new Date();
  const notifCount = loans.filter(loan => {
    if (getRemaining(loan) === 0) return false;
    const days = daysBetween(getLastPaymentDate(loan), now);
    return days >= 28;
  }).length;

  const navItems = [
    { to: '/', label: t('dashboard'), icon: LayoutDashboard },
    { to: '/loans', label: t('loans'), icon: CreditCard },
    { to: '/loans/new', label: t('add_loan'), icon: PlusCircle },
    { to: '/products', label: t('products'), icon: Package },
    { to: '/reports', label: t('export_report'), icon: FileText },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg text-foreground">LoanTracker</span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.to) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {notifCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setLanguage(language === 'fr' ? 'ar' : 'fr')}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors text-muted-foreground"
              >
                <Globe className="w-4 h-4" />
                {language === 'fr' ? 'العربية' : 'Français'}
              </button>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-secondary"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t bg-card px-4 py-2">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium ${
                  isActive(item.to) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
    </>
  );
}
