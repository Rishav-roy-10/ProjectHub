# 📌 ProjectHub

**ProjectHub** is a full-stack developer platform that allows users to create, manage, and run code projects directly in the browser.  
It features a collaborative environment powered by **React, Vite, Node.js, Express, MongoDB, Redis, and Socket.IO**, with real-time communication and modern UI.

---

## 🚀 Features
- 🔐 **User Authentication** – Secure login & registration with JWT & bcrypt  
- 📂 **Project Management** – Create, edit, and organize coding projects  
- 💻 **In-Browser Code Execution** – Run code snippets directly in the app (multi-language support ready)  
- ⚡ **Real-Time Updates** – Live collaboration and instant feedback with Socket.IO  
- 🎨 **Modern UI** – Built with React, TailwindCSS, HeroIcons, and Monaco Editor  
- ☁️ **Cloud Deployment** – Backend on Render, frontend on Vercel  

---

## 🛠️ Tech Stack
- **Frontend:** React, Vite, TailwindCSS, Monaco Editor, Socket.IO Client  
- **Backend:** Node.js, Express, MongoDB, Redis, Socket.IO  
- **Authentication:** JWT, bcrypt  
- **Deployment:** Render (API), Vercel (Frontend)  

---

## 🔧 Setup & Installation

```bash
# Clone the repo
git clone https://github.com/Rishav-roy-10/ProjectHub.git
cd ProjectHub

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Run backend
cd backend
npm run dev

# Run frontend
cd frontend
npm run dev
