import sqlite3
import uuid
import os
from datetime import datetime
from typing import List, Optional, Literal
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Gestion Crédit Électronique API")

# Configuration CORS with environment variables
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

allow_origins = [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:5173",
    FRONTEND_URL,
]

# Allow all origins in development, restrict in production
if os.getenv("ENVIRONMENT") == "production":
    allow_origins = [FRONTEND_URL]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE = os.getenv("DATABASE_URL", "loans.db")

def get_db():
    conn = sqlite3.connect(DATABASE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        buyingPrice REAL NOT NULL,
        originalPrice REAL NOT NULL,
        baseInstallmentPrice REAL NOT NULL,
        availableQuantity INTEGER NOT NULL DEFAULT 0
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS loans (
        id TEXT PRIMARY KEY,
        borrowerName TEXT NOT NULL,
        phone TEXT NOT NULL,
        nationalId TEXT,
        address TEXT,
        productId TEXT NOT NULL,
        totalAmount REAL NOT NULL,
        advanceAmount REAL NOT NULL,
        notes TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (productId) REFERENCES products(id)
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        loanId TEXT NOT NULL,
        date TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        note TEXT,
        FOREIGN KEY (loanId) REFERENCES loans(id)
    )
    """)
    
    conn.commit()
    conn.close()

# Initialisation de la base de données au démarrage
@app.on_event("startup")
def startup():
    init_db()

# --- Modèles Pydantic ---

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    buyingPrice: float
    originalPrice: float
    baseInstallmentPrice: float
    availableQuantity: int

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: str

class PaymentBase(BaseModel):
    amount: float
    type: Literal["advance", "monthly"]
    note: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: str
    loanId: str
    date: str

class LoanBase(BaseModel):
    borrowerName: str
    phone: str
    nationalId: Optional[str] = None
    address: Optional[str] = None
    productId: str
    totalAmount: float
    advanceAmount: float
    notes: Optional[str] = None

class LoanCreate(LoanBase):
    pass

class Loan(LoanBase):
    id: str
    createdAt: str
    productName: Optional[str] = None
    payments: List[Payment] = []

# --- Endpoints Produits ---

@app.get("/products", response_model=List[Product])
def get_products(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM products")
    return [dict(row) for row in cursor.fetchall()]

@app.post("/products", response_model=Product)
def create_product(product: ProductCreate, db: sqlite3.Connection = Depends(get_db)):
    product_id = f"p{uuid.uuid4().hex[:8]}"
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO products (id, name, description, buyingPrice, originalPrice, baseInstallmentPrice, availableQuantity) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (product_id, product.name, product.description, product.buyingPrice, product.originalPrice, product.baseInstallmentPrice, product.availableQuantity)
    )
    db.commit()
    return {**product.model_dump(), "id": product_id}

@app.put("/products/{product_id}", response_model=Product)
def update_product(product_id: str, product: ProductCreate, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute(
        "UPDATE products SET name=?, description=?, buyingPrice=?, originalPrice=?, baseInstallmentPrice=?, availableQuantity=? WHERE id=?",
        (product.name, product.description, product.buyingPrice, product.originalPrice, product.baseInstallmentPrice, product.availableQuantity, product_id)
    )
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    db.commit()
    return {**product.model_dump(), "id": product_id}

@app.delete("/products/{product_id}")
def delete_product(product_id: str, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("DELETE FROM products WHERE id=?", (product_id,))
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    db.commit()
    return {"message": "Product deleted"}

# --- Endpoints Prêts ---

@app.get("/loans", response_model=List[Loan])
def get_loans(db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""
        SELECT l.*, p.name as productName 
        FROM loans l 
        LEFT JOIN products p ON l.productId = p.id
        ORDER BY l.createdAt DESC
    """)
    loans_rows = cursor.fetchall()
    loans_list = []
    for row in loans_rows:
        loan_dict = dict(row)
        cursor.execute("SELECT id, loanId, date, amount, type, note FROM payments WHERE loanId=?", (loan_dict["id"],))
        loan_dict["payments"] = [dict(p) for p in cursor.fetchall()]
        loans_list.append(loan_dict)
    return loans_list

@app.post("/loans", response_model=Loan)
def create_loan(loan: LoanCreate, db: sqlite3.Connection = Depends(get_db)):
    loan_id = f"l{uuid.uuid4().hex[:8]}"
    created_at = datetime.now().isoformat()
    cursor = db.cursor()
    
    # Vérifier le produit
    cursor.execute("SELECT name, availableQuantity FROM products WHERE id=?", (loan.productId,))
    product = cursor.fetchone()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # On autorise la création même si stock=0 si l'utilisateur insiste (mais on décrémente quand même)
    cursor.execute("UPDATE products SET availableQuantity = MAX(0, availableQuantity - 1) WHERE id=?", (loan.productId,))
    
    # Créer le prêt
    cursor.execute(
        "INSERT INTO loans (id, borrowerName, phone, nationalId, address, productId, totalAmount, advanceAmount, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (loan_id, loan.borrowerName, loan.phone, loan.nationalId, loan.address, loan.productId, loan.totalAmount, loan.advanceAmount, loan.notes, created_at)
    )
    
    # Créer le paiement de l'avance
    if loan.advanceAmount > 0:
        payment_id = f"pay-{uuid.uuid4().hex[:8]}"
        cursor.execute(
            "INSERT INTO payments (id, loanId, date, amount, type, note) VALUES (?, ?, ?, ?, ?, ?)",
            (payment_id, loan_id, created_at, loan.advanceAmount, "advance", "Avance initiale")
        )
    
    db.commit()
    
    # Récupérer les paiements
    cursor.execute("SELECT id, loanId, date, amount, type, note FROM payments WHERE loanId=?", (loan_id,))
    payments = [dict(p) for p in cursor.fetchall()]
    
    return {
        **loan.model_dump(),
        "id": loan_id,
        "createdAt": created_at,
        "productName": product["name"],
        "payments": payments
    }

@app.get("/loans/{loan_id}", response_model=Loan)
def get_loan(loan_id: str, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("""
        SELECT l.*, p.name as productName 
        FROM loans l 
        LEFT JOIN products p ON l.productId = p.id 
        WHERE l.id=?
    """, (loan_id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    loan_dict = dict(row)
    cursor.execute("SELECT id, loanId, date, amount, type, note FROM payments WHERE loanId=?", (loan_id,))
    loan_dict["payments"] = [dict(p) for p in cursor.fetchall()]
    return loan_dict

@app.delete("/loans/{loan_id}")
def delete_loan(loan_id: str, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    
    # Récupérer le productId avant de supprimer le prêt
    cursor.execute("SELECT productId FROM loans WHERE id=?", (loan_id,))
    loan = cursor.fetchone()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    product_id = loan["productId"]
    
    # Supprimer les paiements associés d'abord
    cursor.execute("DELETE FROM payments WHERE loanId=?", (loan_id,))
    
    # Supprimer le prêt
    cursor.execute("DELETE FROM loans WHERE id=?", (loan_id,))
    
    # Incrémenter la quantité du produit
    cursor.execute("UPDATE products SET availableQuantity = availableQuantity + 1 WHERE id=?", (product_id,))
    
    db.commit()
    return {"message": "Loan deleted and product quantity updated"}

@app.post("/loans/{loan_id}/payments", response_model=Payment)
def record_payment(loan_id: str, payment: PaymentCreate, db: sqlite3.Connection = Depends(get_db)):
    payment_id = f"pay-{uuid.uuid4().hex[:8]}"
    date_now = datetime.now().isoformat()
    cursor = db.cursor()
    
    # Vérifier si le prêt existe
    cursor.execute("SELECT id FROM loans WHERE id=?", (loan_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Loan not found")
        
    cursor.execute(
        "INSERT INTO payments (id, loanId, date, amount, type, note) VALUES (?, ?, ?, ?, ?, ?)",
        (payment_id, loan_id, date_now, payment.amount, payment.type, payment.note)
    )
    db.commit()
    return {**payment.model_dump(), "id": payment_id, "loanId": loan_id, "date": date_now}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
