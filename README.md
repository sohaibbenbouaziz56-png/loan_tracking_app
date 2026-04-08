# Application de Gestion de Crédit Électronique

Cette application permet de gérer les produits, les prêts clients et les paiements. Elle se compose d'un front-end en React/Vite et d'un back-end en FastAPI avec SQLite.

## Structure du Projet

- `backend/` : Code source de l'API FastAPI et base de données SQLite.
- `gestion-cr-dit-lectronique-main/` : Code source du front-end React.
- `backend_design.md` : Documentation de la conception du backend.

## Installation et Lancement

### 1. Backend (FastAPI)

```bash
cd backend
# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
# Installer les dépendances
pip install -r requirements.txt
# Lancer le serveur
uvicorn main:app --reload
```

L'API sera disponible sur `http://localhost:8000`. La documentation Swagger est accessible sur `http://localhost:8000/docs`.

### 2. Frontend (React)

```bash
cd gestion-cr-dit-lectronique-main
# Installer les dépendances
npm install
# Créer le fichier .env si nécessaire (déjà inclus par défaut)
# VITE_API_URL=http://localhost:8000
# Lancer l'application
npm run dev
```

L'application sera disponible sur `http://localhost:5173`.

## Fonctionnalités

- **Tableau de bord** : Vue d'ensemble des statistiques (total prêté, encaissé, restant).
- **Gestion des Produits** : Ajouter, modifier et suivre le stock des produits.
- **Gestion des Prêts** : Créer des nouveaux prêts avec calcul automatique de l'avance.
- **Suivi des Paiements** : Enregistrer les versements mensuels et voir l'historique par prêt.
- **Rapports** : Analyse des performances et état des remboursements.
