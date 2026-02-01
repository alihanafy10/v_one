# 🚀 Vercel Deployment Guide
## Car Crash Reporting & Ambulance Dispatch System

---

## ✅ Prerequisites Completed

- ✅ MongoDB Atlas configured: `mongodb+srv://alikato:ytIbBw68Uxr1jeBG@kato.ixssyb0.mongodb.net/incident-reporter`
- ✅ Database seeded with demo data
- ✅ Code pushed to GitHub: `https://github.com/alihanafy10/v_one`
- ✅ Vercel configuration files created

---

## 🌐 Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Deploy Frontend

1. Go to **https://vercel.com/dashboard**
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select **`alihanafy10/v_one`**
5. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

6. Add Environment Variables:
   ```
   REACT_APP_API_URL=https://your-backend-url.vercel.app/api/v1
   REACT_APP_SOCKET_URL=https://your-backend-url.vercel.app
   ```
   (You'll update these after deploying backend)

7. Click **"Deploy"**

#### Step 2: Deploy Backend

1. In Vercel Dashboard, click **"Add New Project"** again
2. Select **`alihanafy10/v_one`** (same repository)
3. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: Leave empty or `npm install`
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

4. Add Environment Variables:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://alikato:ytIbBw68Uxr1jeBG@kato.ixssyb0.mongodb.net/incident-reporter?retryWrites=true&w=majority
   JWT_SECRET=crash-report-jwt-secret-production-change-this-to-strong-random-string
   JWT_EXPIRE=24h
   ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
   SALT_SECRET=additional-salt-secret-for-hashing-security-production
   MAX_FILE_SIZE=2097152
   MAX_FILES=5
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```

5. Click **"Deploy"**

#### Step 3: Update Frontend Environment Variables

1. After backend is deployed, copy the backend URL (e.g., `https://v-one-backend.vercel.app`)
2. Go to your frontend project in Vercel
3. Go to **Settings → Environment Variables**
4. Update:
   ```
   REACT_APP_API_URL=https://v-one-backend.vercel.app/api/v1
   REACT_APP_SOCKET_URL=https://v-one-backend.vercel.app
   ```
5. Redeploy frontend (Deployments → ... → Redeploy)

#### Step 4: Update Backend CORS

1. Go to backend project in Vercel
2. Go to **Settings → Environment Variables**
3. Update `FRONTEND_URL` to your actual frontend URL
4. Redeploy backend

---

### Option 2: Deploy via Vercel CLI

#### Install Vercel CLI

```bash
npm install -g vercel
```

#### Login to Vercel

```bash
vercel login
```

#### Deploy Backend

```bash
cd backend
vercel --prod
```

When prompted:
- Set up and deploy: **Yes**
- Scope: Select your account
- Link to existing project: **No**
- Project name: `v-one-backend`
- Directory: `./`
- Override settings: **No**

#### Deploy Frontend

```bash
cd ../frontend
vercel --prod
```

When prompted:
- Set up and deploy: **Yes**
- Scope: Select your account
- Link to existing project: **No**
- Project name: `v-one-frontend`
- Directory: `./`
- Override settings: **Yes**
  - Build Command: `npm run build`
  - Output Directory: `build`
  - Development Command: `npm start`

#### Add Environment Variables via CLI

```bash
# Backend
cd backend
vercel env add MONGODB_URI production
# Paste: mongodb+srv://alikato:ytIbBw68Uxr1jeBG@kato.ixssyb0.mongodb.net/incident-reporter?retryWrites=true&w=majority

vercel env add JWT_SECRET production
# Enter a strong random string

vercel env add FRONTEND_URL production
# Enter your frontend URL

# Frontend
cd ../frontend
vercel env add REACT_APP_API_URL production
# Enter: https://your-backend-url.vercel.app/api/v1

vercel env add REACT_APP_SOCKET_URL production
# Enter: https://your-backend-url.vercel.app
```

---

## 🔧 Post-Deployment Configuration

### 1. Test API Health

Visit: `https://your-backend-url.vercel.app/health`

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-02-01T...",
  "environment": "production",
  "database": "connected"
}
```

### 2. Test Frontend

Visit: `https://your-frontend-url.vercel.app`

Should see the home page with:
- "Report a Car Crash" button
- "Staff Login" button

### 3. Test Login

1. Click "Staff Login"
2. Use credentials:
   - Username: `admin_cairo`
   - Password: `admin123`
3. Should redirect to admin dashboard

### 4. Test Crash Reporting

1. Go to home page
2. Click "Report a Car Crash"
3. Allow location access
4. Upload a photo
5. Submit report
6. Should see success message

---

## 🎯 Expected URLs

After deployment, you'll have:

- **Frontend**: `https://v-one-frontend-alihanafy10.vercel.app` (or custom domain)
- **Backend API**: `https://v-one-backend-alihanafy10.vercel.app` (or custom domain)
- **API Docs**: Backend URL + `/health` for health check

---

## 🐛 Troubleshooting

### Frontend can't connect to backend
- ✅ Check `REACT_APP_API_URL` in frontend environment variables
- ✅ Check `FRONTEND_URL` in backend environment variables
- ✅ Verify CORS is configured correctly
- ✅ Check browser console for errors

### Database connection failed
- ✅ Verify MongoDB Atlas connection string in backend env
- ✅ Check MongoDB Atlas network access (allow all IPs: 0.0.0.0/0)
- ✅ Verify database user credentials

### JWT authentication errors
- ✅ Ensure `JWT_SECRET` is set in backend
- ✅ Must be at least 32 characters
- ✅ Same secret across all backend instances

### WebSocket not connecting
- ✅ Check `REACT_APP_SOCKET_URL` in frontend
- ✅ Verify backend is running
- ✅ Check browser console for WebSocket errors

---

## 🔒 Security Checklist

Before going live:

- [ ] Change `JWT_SECRET` to a strong random string (32+ chars)
- [ ] Change `ENCRYPTION_KEY` to a new 64-char hex string
- [ ] Change `SALT_SECRET` to a new random string
- [ ] Update MongoDB Atlas password if needed
- [ ] Configure MongoDB Atlas IP whitelist (or 0.0.0.0/0 for Vercel)
- [ ] Enable Vercel password protection (optional)
- [ ] Set up custom domain (optional)
- [ ] Configure SSL/TLS (automatic with Vercel)
- [ ] Review CORS settings
- [ ] Test all authentication flows

---

## 📊 Monitoring

After deployment, monitor:

1. **Vercel Dashboard**
   - Build logs
   - Runtime logs
   - Function invocations
   - Bandwidth usage

2. **MongoDB Atlas**
   - Connection count
   - Database size
   - Query performance
   - Network traffic

3. **Application Health**
   - API response times
   - Error rates
   - WebSocket connections
   - User activity

---

## 🎉 Success Indicators

Your deployment is successful when:

✅ Frontend loads without errors
✅ Backend health check returns OK
✅ Database shows "connected"
✅ Login works for admin and driver
✅ Crash reporting submits successfully
✅ Real-time notifications work
✅ WebSocket connections establish
✅ No CORS errors in console

---

## 📞 Support

If you encounter issues:

1. Check Vercel logs (Dashboard → Project → Logs)
2. Check MongoDB Atlas logs
3. Review browser console errors
4. Check network tab for failed requests
5. Verify all environment variables are set

---

## 🚀 Next Steps After Deployment

1. **Test all features** in production
2. **Share URLs** with stakeholders
3. **Monitor logs** for errors
4. **Set up alerts** in Vercel
5. **Configure custom domain** (optional)
6. **Add analytics** (Google Analytics, etc.)
7. **Set up monitoring** (Sentry for error tracking)

---

**Ready to deploy! Follow the steps above to get your application live on Vercel.** 🎉

**Estimated Deployment Time**: 10-15 minutes
**Difficulty**: Easy (Vercel handles most complexity)
