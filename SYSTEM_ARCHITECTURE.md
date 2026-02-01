# Car Crash Reporting & Ambulance Dispatch System
## System Architecture Documentation

---

## 1. OVERALL SYSTEM ARCHITECTURE

### Technology Stack
- **Frontend**: React (Web & Mobile Progressive Web App)
- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time Communication**: WebSockets (Socket.io)
- **File Storage**: MongoDB GridFS (for crash photos)
- **Geolocation**: Browser Geolocation API + Reverse Geocoding Service

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  React Web App (User)                                        │
│  React Web App (Healthcare Admin Dashboard)                 │
│  React Web App (Ambulance Driver Mobile)                    │
└─────────────────────────────────────────────────────────────┘
                          ↓ ↑
                      HTTPS / WSS
                          ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  Node.js + Express.js REST API                              │
│  - Authentication Service                                    │
│  - Crash Report Service                                      │
│  - Ambulance Dispatch Service                               │
│  - Station Management Service                               │
│  - Real-time Notification Service (Socket.io)               │
└─────────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
├─────────────────────────────────────────────────────────────┤
│  MongoDB Database                                            │
│  - Users Collection                                          │
│  - CrashReports Collection                                   │
│  - AmbulanceStations Collection                             │
│  - Ambulances Collection                                     │
│  - Cities Collection                                         │
│  - Areas Collection                                          │
│  - DispatchLogs Collection                                   │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Assumptions
- Backend deployed on cloud infrastructure (AWS/Azure/GCP)
- Frontend served via CDN
- MongoDB hosted on MongoDB Atlas or self-hosted cluster
- SSL/TLS certificates for HTTPS
- Environment variables for secrets management
- Load balancer for horizontal scaling

---
