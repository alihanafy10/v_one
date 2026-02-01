# 🚑 Car Crash Reporting & Ambulance Dispatch System

A complete full-stack web application for emergency crash reporting and intelligent ambulance dispatch.

## 🌟 Features

- **User Crash Reporting**: GPS-based location capture with photo upload
- **Automatic Dispatch**: Smart algorithm finds nearest available ambulance
- **Real-time Notifications**: WebSocket-powered instant updates
- **Admin Dashboard**: Fleet management and report monitoring
- **Driver Interface**: Mobile-optimized assignment tracking
- **Secure Authentication**: JWT-based with role-based access control

## 🏗️ Tech Stack

- **Frontend**: React, Socket.io-client, Axios
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB Atlas
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (already configured)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/alihanafy10/v_one.git
cd v_one
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Seed the database**
```bash
cd ../backend
node seed.js
```

5. **Start backend** (Terminal 1)
```bash
cd backend
npm run dev
```

6. **Start frontend** (Terminal 2)
```bash
cd frontend
npm start
```

## 👤 Demo Credentials

### Healthcare Admin
- **Username**: `admin_cairo`
- **Password**: `admin123`

### Ambulance Driver
- **Username**: `driver_001`
- **Password**: `driver123`

## 📱 Application URLs

- **Local Frontend**: http://localhost:3000
- **Local Backend**: http://localhost:5000
- **Production**: https://v-one.vercel.app (after deployment)

## 🗂️ Project Structure

```
v_one/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── models/      # MongoDB models
│   │   ├── routes/      # API endpoints
│   │   ├── middleware/  # Auth, validation
│   │   ├── services/    # Business logic
│   │   └── socket/      # WebSocket handler
│   ├── server.js
│   └── seed.js
├── frontend/            # React application
│   ├── src/
│   │   ├── pages/       # Main pages
│   │   ├── components/  # Reusable components
│   │   ├── context/     # Auth & Socket contexts
│   │   └── services/    # API client
│   └── package.json
└── docs/                # Comprehensive documentation
```

## 📚 Documentation

Detailed documentation available in the `/docs` folder:

- `SYSTEM_ARCHITECTURE.md` - System design
- `DATABASE_SCHEMA.md` - Data models
- `API_SPECIFICATIONS.md` - Complete API reference
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `QUICK_START_GUIDE.md` - Developer guide

## 🔐 Security Features

- JWT authentication with 24h expiration
- Bcrypt password hashing (12 rounds)
- Role-based access control (RBAC)
- Rate limiting (100 req/15min public, 1000 req/15min auth)
- Input validation and sanitization
- CORS configuration
- Helmet security headers

## 🎯 Key Features Implemented

✅ GPS-based crash reporting with photo upload
✅ Automatic nearest-ambulance dispatch algorithm
✅ Real-time WebSocket notifications
✅ Admin dashboard with fleet management
✅ Driver mobile interface with navigation
✅ Status tracking (Dispatched → En Route → Arrived → Resolved)
✅ Inter-station resource sharing
✅ False report management
✅ Complete audit logging

## 🧪 Testing

1. **Report a crash** (User flow)
   - Go to http://localhost:3000
   - Click "Report a Car Crash"
   - Allow location access
   - Upload photos and submit

2. **View in admin dashboard**
   - Login as admin
   - See new report and assigned ambulance

3. **Update status as driver**
   - Login as driver
   - View assignment and update status

## 🌐 Deployment

### Backend (Vercel)
```bash
cd backend
vercel --prod
```

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

Set environment variables in Vercel dashboard:
- `MONGODB_URI`
- `JWT_SECRET`
- `FRONTEND_URL`

## 📊 Database

**MongoDB Atlas**: Pre-configured with connection string
**Collections**: 8 (cities, areas, stations, ambulances, users, reports, logs, requests)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

MIT License

## 👨‍💻 Author

**Ali Hanafy**
- GitHub: [@alihanafy10](https://github.com/alihanafy10)

## 🆘 Support

For issues and questions, please check the documentation in `/docs` or create an issue on GitHub.

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: February 2026
