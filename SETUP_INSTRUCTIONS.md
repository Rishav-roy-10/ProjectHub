# 🚀 AI Developer Project - Complete Setup Guide

## 📁 **Required Files and Folders Structure**

```
AI Developer/
├── frontend/
│   ├── package.json ✅
│   ├── package-lock.json ✅
│   ├── node_modules/ ✅
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── utils/
│   │   └── main.jsx
│   ├── public/
│   └── vite.config.js ✅
├── backend/
│   ├── package.json ✅
│   ├── package-lock.json ✅
│   ├── node_modules/ ✅
│   ├── server.js ✅
│   ├── app.js ✅
│   ├── .env (create this)
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── middleware/
├── start-project.bat ✅
├── start-project.ps1 ✅
└── SETUP_INSTRUCTIONS.md ✅
```

## 🔧 **Step-by-Step Setup**

### **1. Create Environment File**
Create `backend/.env` file with this content:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai_developer
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
GOOGLE_API_KEY=your_google_ai_api_key_here
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### **2. Install Dependencies**

**Frontend:**
```bash
cd frontend
npm install
```

**Backend:**
```bash
cd backend
npm install
```

### **3. Start the Project**

**Option A: Using Batch File (Windows)**
```bash
# Double-click or run:
start-project.bat
```

**Option B: Using PowerShell Script**
```powershell
# Run in PowerShell:
.\start-project.ps1
```

**Option C: Manual Start**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🌐 **Access Your Project**

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

## ✅ **Features Available**

- ✅ **File Tab System** (like Cursor IDE)
- ✅ **Professional SVG Icons** for file types
- ✅ **Multiple Open Files** with tabs
- ✅ **Real-time AI Chat** with send button
- ✅ **Project Management**
- ✅ **File Explorer** with language detection
- ✅ **File Deletion** (closes tabs automatically)

## 🔍 **Troubleshooting**

### **If `node_modules` is missing:**
```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
npm install
```

### **If ports are in use:**
- Frontend: Change port in `frontend/vite.config.js`
- Backend: Change port in `backend/.env`

### **If MongoDB connection fails:**
- Install MongoDB locally, or
- Use MongoDB Atlas (cloud)

### **If Google AI doesn't work:**
- Get API key from Google AI Studio
- Add to `backend/.env`

## 📝 **Quick Commands**

```bash
# Build frontend
cd frontend && npm run build

# Start backend only
cd backend && npm start

# Start frontend only
cd frontend && npm run dev

# Install all dependencies
cd frontend && npm install
cd backend && npm install
```

## 🎯 **What You Get**

1. **Professional IDE-like interface**
2. **File tabs like Cursor IDE**
3. **Language-specific icons**
4. **Real-time chat with AI**
5. **Project management**
6. **File deletion with tab cleanup**

Your AI Developer project is now ready to use! 🎉
