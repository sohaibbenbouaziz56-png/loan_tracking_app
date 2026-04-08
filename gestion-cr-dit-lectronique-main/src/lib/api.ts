const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Product {
  id: string;
  name: string;
  description?: string;
  buyingPrice: number;
  originalPrice: number;
  baseInstallmentPrice: number;
  availableQuantity: number;
}

export interface Payment {
  id: string;
  loanId: string;
  date: string;
  amount: number;
  type: 'advance' | 'monthly';
  note?: string;
}

export interface Loan {
  id: string;
  borrowerName: string;
  phone: string;
  nationalId?: string;
  address?: string;
  productId: string;
  productName?: string;
  totalAmount: number;
  advanceAmount: number;
  notes?: string;
  createdAt: string;
  payments: Payment[];
}

// Products API
export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE_URL}/products`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create product');
  }
  return response.json();
}

export async function updateProduct(id: string, product: Omit<Product, 'id'>): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update product');
  }
  return response.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete product');
  }
}

// Loans API
export async function getLoans(): Promise<Loan[]> {
  const response = await fetch(`${API_BASE_URL}/loans`);
  if (!response.ok) throw new Error('Failed to fetch loans');
  return response.json();
}

export async function getLoan(id: string): Promise<Loan> {
  const response = await fetch(`${API_BASE_URL}/loans/${id}`);
  if (!response.ok) throw new Error('Failed to fetch loan');
  return response.json();
}

export async function createLoan(loan: Omit<Loan, 'id' | 'createdAt' | 'payments' | 'productName'>): Promise<Loan> {
  const response = await fetch(`${API_BASE_URL}/loans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loan),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create loan');
  }
  return response.json();
}

export async function deleteLoan(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/loans/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete loan');
  }
}

// Payments API
export async function recordPayment(loanId: string, payment: Omit<Payment, 'id' | 'loanId' | 'date'>): Promise<Payment> {
  const response = await fetch(`${API_BASE_URL}/loans/${loanId}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payment),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to record payment');
  }
  return response.json();
}
