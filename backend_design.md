# Conception du Backend pour l'Application de Suivi de Prêts

Ce document détaille la conception du schéma de base de données SQLite et des endpoints API FastAPI pour l'application de suivi de prêts, en se basant sur l'analyse du code front-end existant.

## 1. Schéma de la Base de Données SQLite

Nous allons utiliser trois tables principales pour stocker les données de l'application : `products`, `loans` et `payments`.

### 1.1 Table `products`

Cette table stockera les informations sur les produits disponibles pour les prêts.

| Champ                | Type      | Contraintes           | Description                               |
| :------------------- | :-------- | :--------------------- | :---------------------------------------- |
| `id`                 | TEXT      | PRIMARY KEY            | Identifiant unique du produit             |
| `name`               | TEXT      | NOT NULL               | Nom du produit                            |
| `description`        | TEXT      |                        | Description du produit                    |
| `buying_price`       | REAL      | NOT NULL               | Prix d'achat du produit                   |
| `original_price`     | REAL      | NOT NULL               | Prix de vente original du produit         |
| `base_installment_price` | REAL      | NOT NULL               | Prix de base pour les versements          |
| `available_quantity` | INTEGER   | NOT NULL, DEFAULT 0    | Quantité disponible en stock              |

### 1.2 Table `loans`

Cette table stockera les informations sur chaque prêt accordé.

| Champ                | Type      | Contraintes                     | Description                               |
| :------------------- | :-------- | :------------------------------ | :---------------------------------------- |
| `id`                 | TEXT      | PRIMARY KEY                     | Identifiant unique du prêt                |
| `borrower_name`      | TEXT      | NOT NULL                        | Nom de l'emprunteur                       |
| `phone`              | TEXT      | NOT NULL                        | Numéro de téléphone de l'emprunteur       |
| `national_id`        | TEXT      |                                 | Numéro d'identité nationale de l'emprunteur |
| `address`            | TEXT      |                                 | Adresse de l'emprunteur                   |
| `product_id`         | TEXT      | NOT NULL, FOREIGN KEY (products.id) | Identifiant du produit lié au prêt        |
| `total_amount`       | REAL      | NOT NULL                        | Montant total du prêt                     |
| `advance_amount`     | REAL      | NOT NULL                        | Montant de l'avance                       |
| `notes`              | TEXT      |                                 | Notes additionnelles sur le prêt          |
| `created_at`         | TEXT      | NOT NULL                        | Date de création du prêt (ISO 8601)       |

### 1.3 Table `payments`

Cette table stockera les informations sur chaque paiement effectué pour un prêt.

| Champ                | Type      | Contraintes                     | Description                               |
| :------------------- | :-------- | :------------------------------ | :---------------------------------------- |
| `id`                 | TEXT      | PRIMARY KEY                     | Identifiant unique du paiement            |
| `loan_id`            | TEXT      | NOT NULL, FOREIGN KEY (loans.id) | Identifiant du prêt associé au paiement   |
| `date`               | TEXT      | NOT NULL                        | Date du paiement (ISO 8601)               |
| `amount`             | REAL      | NOT NULL                        | Montant du paiement                       |
| `type`               | TEXT      | NOT NULL                        | Type de paiement (‘advance’ ou ‘monthly’) |
| `note`               | TEXT      |                                 | Notes additionnelles sur le paiement      |

## 2. Endpoints API FastAPI

L'API sera structurée autour des ressources `products`, `loans` et `payments`.

### 2.1 Endpoints `products`

| Méthode | Chemin           | Description                                  | Requête (Body)                                  | Réponse (Succès)                               |
| :------ | :--------------- | :------------------------------------------- | :---------------------------------------------- | :--------------------------------------------- |
| `GET`   | `/products`      | Récupérer tous les produits                  | Aucun                                           | `List[Product]`                                |
| `GET`   | `/products/{id}` | Récupérer un produit par son ID              | Aucun                                           | `Product`                                      |
| `POST`  | `/products`      | Ajouter un nouveau produit                   | `ProductCreate` (sans `id`)                     | `Product`                                      |
| `PUT`   | `/products/{id}` | Mettre à jour un produit existant            | `ProductUpdate` (tous les champs modifiables)   | `Product`                                      |
| `DELETE`| `/products/{id}` | Supprimer un produit par son ID              | Aucun                                           | `{"message": "Product deleted"}`             |

### 2.2 Endpoints `loans`

| Méthode | Chemin           | Description                                  | Requête (Body)                                  | Réponse (Succès)                               |
| :------ | :--------------- | :------------------------------------------- | :---------------------------------------------- | :--------------------------------------------- |
| `GET`   | `/loans`         | Récupérer tous les prêts                     | Aucun                                           | `List[Loan]`                                   |
| `GET`   | `/loans/{id}`    | Récupérer un prêt par son ID                 | Aucun                                           | `Loan`                                         |
| `POST`  | `/loans`         | Ajouter un nouveau prêt                      | `LoanCreate` (sans `id`, `createdAt`, `payments`) | `Loan`                                         |
| `PUT`   | `/loans/{id}`    | Mettre à jour un prêt existant               | `LoanUpdate` (tous les champs modifiables)      | `Loan`                                         |
| `DELETE`| `/loans/{id}`    | Supprimer un prêt par son ID                 | Aucun                                           | `{"message": "Loan deleted"}`                |

### 2.3 Endpoints `payments`

| Méthode | Chemin           | Description                                  | Requête (Body)                                  | Réponse (Succès)                               |
| :------ | :--------------- | :------------------------------------------- | :---------------------------------------------- | :--------------------------------------------- |
| `GET`   | `/loans/{loan_id}/payments` | Récupérer tous les paiements pour un prêt | Aucun                                           | `List[Payment]`                                |
| `POST`  | `/loans/{loan_id}/payments` | Enregistrer un nouveau paiement pour un prêt | `PaymentCreate` (sans `id`, `date`, `loan_id`)  | `Payment`                                      |

## 3. Modèles Pydantic pour FastAPI

Pour la validation des données et la sérialisation/désérialisation, nous utiliserons les modèles Pydantic suivants :

```python
from datetime import date
from typing import List, Literal, Optional
from pydantic import BaseModel

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    buying_price: float
    original_price: float
    base_installment_price: float
    available_quantity: int

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: str

    class Config:
        from_attributes = True

class PaymentBase(BaseModel):
    amount: float
    type: Literal["advance", "monthly"]
    note: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: str
    loan_id: str
    date: date

    class Config:
        from_attributes = True

class LoanBase(BaseModel):
    borrower_name: str
    phone: str
    national_id: Optional[str] = None
    address: Optional[str] = None
    product_id: str
    total_amount: float
    advance_amount: float
    notes: Optional[str] = None

class LoanCreate(LoanBase):
    pass

class Loan(LoanBase):
    id: str
    created_at: date
    payments: List[Payment] = []

    class Config:
        from_attributes = True
```
