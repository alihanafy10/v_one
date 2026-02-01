# Deployment Guide
## Car Crash Reporting & Ambulance Dispatch System

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Start MongoDB

```bash
# Make sure MongoDB is running
mongod
```

### 3. Seed Database

```bash
cd backend
node seed.js
```

### 4. Start Backend

```bash
cd backend
npm run dev
```

Backend runs on: **http://localhost:5000**

### 5. Start Frontend

```bash
cd frontend
npm start
```

Frontend runs on: **http://localhost:3000**

---

## 🌐 Production Deployment

### Option 1: Deploy to Heroku

#### Backend Deployment

```bash
cd backend

# Create Heroku app
heroku create crash-report-api

# Add MongoDB add-on
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-production-secret
heroku config:set FRONTEND_URL=https://your-frontend-url.com

# Deploy
git push heroku main

# Seed database
heroku run node seed.js
```

#### Frontend Deployment

```bash
cd frontend

# Build for production
npm run build

# Deploy to Netlify, Vercel, or Heroku
# Update .env with production API URL
```

---

### Option 2: Deploy to AWS/Azure/GCP

#### Backend (Node.js)
- Deploy to EC2, Azure App Service, or Google App Engine
- Use MongoDB Atlas for database
- Configure environment variables
- Set up SSL certificates
- Enable auto-scaling

#### Frontend (React)
- Deploy to S3 + CloudFront, Azure Static Web Apps, or Firebase Hosting
- Configure CDN
- Set up custom domain

---

### Option 3: Docker Deployment

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/crash_report_system
      - JWT_SECRET=your-secret
      - NODE_ENV=production
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

Run:
```bash
docker-compose up -d
```

---

## 🔐 Security Checklist

Before going live:

- [ ] Change all default passwords and secrets
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Configure MongoDB authentication
- [ ] Enable request logging
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy
- [ ] Review all environment variables
- [ ] Enable helmet security headers
- [ ] Set up CSP (Content Security Policy)

---

## 📊 Monitoring

### Backend Health Check
```
GET http://your-api.com/health
```

### Recommended Tools
- **Monitoring**: New Relic, Datadog, or PM2
- **Logging**: Winston + Loggly or Papertrail
- **Error Tracking**: Sentry
- **Uptime**: Pingdom or UptimeRobot

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install Backend Dependencies
      run: |
        cd backend
        npm install
    
    - name: Install Frontend Dependencies
      run: |
        cd frontend
        npm install
    
    - name: Build Frontend
      run: |
        cd frontend
        npm run build
    
    - name: Deploy
      run: |
        # Your deployment commands here
```

---

## 📝 Post-Deployment

1. **Test all features** thoroughly
2. **Monitor logs** for errors
3. **Check performance** metrics
4. **Verify SSL** certificate
5. **Test real-time** WebSocket connections
6. **Verify database** backups
7. **Set up alerts** for downtime

---

## 🆘 Rollback Plan

If issues occur:

1. Keep previous version available
2. Have database backup ready
3. Document rollback procedure
4. Test rollback in staging first

---

## 📞 Support

For deployment issues, check:
- Server logs
- Database connection
- Environment variables
- Network/firewall settings
- DNS configuration

---

**Ready for Production!** 🎉
