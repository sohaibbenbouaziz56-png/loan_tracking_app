# Deployment Guide

## Backend Deployment (Render)

### Prerequisites
- Render account (https://render.com)
- GitHub repository with your code

### Steps:

1. **Push code to GitHub** (if not already done)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Create a New Web Service on Render**
   - Go to https://render.com/dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: loan-app-api
     - **Environment**: Python 3
     - **Build Command**: `pip install -r backend/requirements.txt`
     - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
     - **Region**: Choose closest to your users

3. **Set Environment Variables** (in Render dashboard)
   - Go to your service → Environment
   - Add:
     - `FRONTEND_URL`: The URL of your frontend deployment (e.g., https://yourdomain.vercel.app)
     - `DATABASE_URL`: loans.db (default)

4. **Enable auto-deploy**
   - Enable "Auto-Deploy" to deploy on every push to main branch

5. **Update Backend CORS**
   - Update `backend/main.py` CORS configuration with your frontend URL:
   ```python
   allow_origins=[
       "http://localhost:3000",
       "http://localhost:8080",
       "https://yourdomain.vercel.app",  # Your frontend URL
   ]
   ```

### Backend URL
Once deployed, you'll get a URL like: `https://loan-app-api.onrender.com`

---

## Frontend Deployment

### Option 1: Vercel (Recommended for React/Vite)

1. **Install Vercel CLI** (optional)
   ```bash
   npm i -g vercel
   ```

2. **Deploy via Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `gestion-cr-dit-lectronique-main/`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`

3. **Set Environment Variables** (in Vercel Project Settings)
   - Go to Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://loan-app-api.onrender.com`
   - Apply to Production, Preview, and Development

4. **Deploy**
   - Push to GitHub - automatic deployment triggered
   - Or click "Deploy" manually

### Option 2: Netlify

1. **Deploy via Netlify Dashboard**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub and select your repository

2. **Configure Build Settings**
   - **Base directory**: `gestion-cr-dit-lectronique-main`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

3. **Set Environment Variables** (in Netlify Dashboard)
   - Go to Site Settings → Build & deploy → Environment
   - Add: `VITE_API_URL` = `https://loan-app-api.onrender.com`

4. **Deploy**
   - Push to GitHub - automatic deployment triggered

---

## Testing After Deployment

1. Visit your frontend URL
2. Test creating loans, products, and payments
3. Check browser console for any CORS errors
4. Verify all API calls reach the backend successfully

---

## Troubleshooting

### CORS Error
- Update `backend/main.py` `allow_origins` to include your frontend URL
- Re-deploy the backend

### API Endpoint Not Responding
- Check that `VITE_API_URL` environment variable is set correctly in frontend
- Verify Render backend service is running (check logs)
- Check database file permissions on Render

### Slow Performance
- Render free tier has limited resources; consider upgrading
- Use database caching for frequently accessed data

---

## Notes

- **SQLite on Render**: SQLite works fine for small to medium apps. For production scale, consider upgrading to PostgreSQL
- **Free Tier Limitations**: 
  - Render free tier services spin down after 15 min of inactivity
  - Vercel free tier is generous for static sites
  - Netlify free tier has 300 build minutes/month
- **Custom Domain**: Both platforms support custom domains in paid plans
