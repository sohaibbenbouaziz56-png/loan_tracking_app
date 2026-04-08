import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProductProvider } from "@/contexts/ProductContext";
import { LoanProvider } from "@/contexts/LoanContext";
import Navbar from "@/components/Navbar";
import Dashboard from "@/pages/Dashboard";
import LoansPage from "@/pages/Loans";
import LoanDetail from "@/pages/LoanDetail";
import AddLoan from "@/pages/AddLoan";
import ProductsPage from "@/pages/Products";
import ReportsPage from "@/pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LanguageProvider>
        <ProductProvider>
          <LoanProvider>
            <BrowserRouter>
              <Navbar />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/loans" element={<LoansPage />} />
                <Route path="/loans/new" element={<AddLoan />} />
                <Route path="/loans/:id" element={<LoanDetail />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </LoanProvider>
        </ProductProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
