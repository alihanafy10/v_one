# Car Crash Reporting & Ambulance Dispatch System
## Implementation Guide

---

## 🚀 Project Structure

```
crash-report-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── jwt.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── CrashReport.js
│   │   │   ├── Ambulance.js
│   │   │   ├── AmbulanceStation.js
│   │   │   ├── City.js
│   │   │   ├── Area.js
│   │   │   ├── DispatchLog.js
│   │   │   └── StationRequest.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── reports.js
│   │   │   ├── admin.js
│   │   │   ├── driver.js
│   │   │   └── files.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── validation.js
│   │   │   └── rateLimiter.js
│   │   ├── services/
│   │   │   └── dispatchService.js
│   │   ├── utils/
│   │   │   ├── distance.js
│   │   │   └── helpers.js
│   │   └── socket/
│   │       └── socketHandler.js
│   ├── package.json
│   ├── server.js
│   └── .env
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── common/
│   │   │       └── ProtectedRoute.js
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── SocketContext.js
│   │   ├── pages/
│   │   │   ├── HomePage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── ReportCrashPage.js
│   │   │   ├── AdminDashboardPage.js
│   │   │   └── DriverDashboardPage.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env
│
└── docs/
    └── (all documentation files)
```

---

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js** v18+ installed
- **MongoDB** v6.0+ installed and running
- **npm** or **yarn** package manager
- **Git** for version control

---

## 🔧 Installation & Setup

### 1. Clone or Navigate to Repository

```bash
cd v_one
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows (if installed as service, it's already running)
# Or start manually:
mongod

# Linux/Mac
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### 5. Seed Database (Optional but Recommended)

Create a seed script to add initial data. Create `backend/seed.js`:

```javascript
// This will create sample cities, areas, stations, ambulances, and users
// Run with: node seed.js
```

---

## 🚀 Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
# or
npm start
```

Server will run on: **http://localhost:5000**

### Start Frontend Development Server

```bash
cd frontend
npm start
```

Frontend will run on: **http://localhost:3000**

---

## 👥 Demo Users

After seeding the database, you can use these demo accounts:

### Healthcare Admin
- **Username**: `admin_cairo`
- **Password**: `admin123`
- **Station**: Cairo Central Emergency Station

### Ambulance Driver
- **Username**: `driver_001`
- **Password**: `driver123`
- **Station**: Cairo Central Emergency Station

---

## 🧪 Testing the System

### 1. Test Crash Reporting (User Flow)

1. Open http://localhost:3000
2. Click "Report a Car Crash"
3. Allow location access
4. Upload 1-5 photos (use any images for demo)
5. Enter a National ID (e.g., `12345678901234`)
6. Fill in crash details
7. Submit report
8. Note the Report Number

### 2. Test Admin Dashboard

1. Go to http://localhost:3000/login
2. Login as admin (see demo users above)
3. View incoming reports
4. Manually assign ambulances
5. View fleet status
6. Test marking reports as false

### 3. Test Driver Dashboard

1. Go to http://localhost:3000/login
2. Login as driver (see demo users above)
3. View assigned report (if auto-dispatched)
4. Update status: Dispatched → En Route → Arrived → Resolved
5. Test navigation integration
6. Test backup request

### 4. Test Real-time Features

- Open admin dashboard in one browser
- Open driver dashboard in another browser
- Submit a crash report
- Watch real-time notifications and status updates

---

## 📊 Database Collections

The system uses these MongoDB collections:

1. **cities** - Geographic cities
2. **areas** - Neighborhoods within cities  
3. **ambulanceStations** - Emergency stations
4. **ambulances** - Vehicle fleet
5. **users** - Admins and drivers
6. **crashReports** - All crash reports
7. **dispatchLogs** - Audit trail
8. **stationRequests** - Inter-station requests

---

## 🔐 Security Notes

### Production Deployment

Before deploying to production:

1. **Change all secrets** in `.env` files
2. **Enable HTTPS** with valid SSL certificates
3. **Set up proper CORS** policies
4. **Enable rate limiting** on all endpoints
5. **Use environment-based** configurations
6. **Set NODE_ENV** to `production`
7. **Implement proper logging** and monitoring
8. **Set up database backups**
9. **Use a process manager** like PM2

### Environment Variables

Update these in production:

```bash
# Backend
JWT_SECRET=<generate-strong-random-string-min-32-chars>
ENCRYPTION_KEY=<generate-64-char-hex-string>
SALT_SECRET=<generate-another-strong-secret>
MONGODB_URI=<production-mongodb-connection-string>
FRONTEND_URL=<production-frontend-url>
```

```bash
# Frontend
REACT_APP_API_URL=<production-api-url>
REACT_APP_SOCKET_URL=<production-socket-url>
```

---

## 🐛 Troubleshooting

### Backend won't start
- Check if MongoDB is running: `mongosh` or `mongo`
- Check if port 5000 is available
- Verify `.env` file exists and is configured
- Check console for error messages

### Frontend won't start
- Clear node_modules: `rm -rf node_modules && npm install`
- Check if port 3000 is available
- Verify `.env` file exists
- Try: `npm cache clean --force`

### CORS errors
- Ensure `FRONTEND_URL` in backend `.env` matches frontend URL
- Check CORS configuration in `server.js`

### WebSocket not connecting
- Ensure both backend and frontend are running
- Check `SOCKET_URL` in frontend `.env`
- Verify firewall settings

### Photos not uploading
- Check file size (max 2MB per photo)
- Verify file type (JPEG/PNG only)
- Check browser console for errors

---

## 📝 API Endpoints

### Public
- `POST /api/v1/reports/create` - Submit crash report

### Authentication
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/verify` - Verify token

### Admin (Requires Auth)
- `GET /api/v1/admin/reports` - List reports
- `GET /api/v1/admin/ambulances` - Fleet status
- `POST /api/v1/admin/reports/:id/assign` - Assign ambulance
- `PUT /api/v1/admin/reports/:id/mark-false` - Mark false
- `GET /api/v1/admin/analytics` - Analytics

### Driver (Requires Auth)
- `GET /api/v1/driver/assignment` - Current assignment
- `PUT /api/v1/driver/reports/:id/status` - Update status
- `POST /api/v1/driver/reports/:id/request-backup` - Request backup

---

## 🎯 Key Features Implemented

✅ User crash reporting with GPS and photos
✅ Face ID / National ID verification
✅ Automatic nearest-ambulance dispatch
✅ Haversine distance calculation
✅ Real-time WebSocket notifications
✅ Admin dashboard with fleet management
✅ Driver mobile interface
✅ Status tracking and updates
✅ Inter-station resource sharing
✅ False report management
✅ Complete audit logging

---

## 🔄 Git Workflow

### Initial Commit

```bash
git init
git add .
git commit -m "Initial implementation of crash report system"
```

### Push to GitHub

```bash
git remote add origin https://github.com/alihanafy10/v_one.git
git branch -M main
git push -u origin main
```

---

## 📚 Additional Documentation

Refer to these files for detailed information:

- `SYSTEM_ARCHITECTURE.md` - System design
- `DATABASE_SCHEMA.md` - Database structure
- `API_SPECIFICATIONS.md` - Complete API docs
- `SECURITY_AND_EDGE_CASES.md` - Security implementation
- `QUICK_START_GUIDE.md` - Developer guide

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes and test
3. Commit: `git commit -m "Add new feature"`
4. Push: `git push origin feature/new-feature`
5. Create Pull Request

---

## 📞 Support

For issues or questions:
- Check documentation in `/docs` folder
- Review error logs in console
- Check GitHub issues

---

**Status**: ✅ Complete and Ready for Testing
**Version**: 1.0.0
**Last Updated**: February 2026
