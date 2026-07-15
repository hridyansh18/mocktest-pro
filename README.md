# 🚀 MockTest Pro

> A Secure Online Mock Test & Examination Platform built with React, Node.js, Express, PostgreSQL and Socket.IO.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![Status](https://img.shields.io/badge/Status-Live-success)

## 🌐 Live Demo

### Frontend (Vercel)
https://mocktest-pro-nine.vercel.app

### Backend (Render)
https://mocktest-pro-nak4.onrender.com

### Health Check
https://mocktest-pro-nak4.onrender.com/api/health

---

# 📖 About

MockTest Pro is a modern and secure online examination platform designed for colleges, coaching institutes and organizations.

The platform provides a complete examination ecosystem with separate Admin and Student portals, secure authentication, live monitoring, automatic evaluation, leaderboard generation and anti-cheating mechanisms.

---

# ✨ Features

## 👨‍💼 Admin Portal

- Secure Login
- Dashboard
- Create Test
- Manage Tests
- Question Manager
- Student Management
- Administrator Management
- Live Test Monitor
- Results
- Leaderboard
- Security Logs
- Settings

---

## 👨‍🎓 Student Portal

- Test Access Code
- Secure Instructions
- Full Screen Exam
- Timer
- Auto Save
- Submit Test
- Instant Result
- Score Analysis

---

## 🔒 Security Features

- JWT Authentication
- Password Hashing (bcrypt)
- Role Based Access Control
- Super Admin Support
- Auto Save
- Session Validation
- API Rate Limiting
- CORS Protection
- Helmet Security
- SQL Injection Protection
- XSS Protection

---

# 🛠 Tech Stack

## Frontend

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS
- Lucide Icons
- Recharts
- Sonner

---

## Backend

- Node.js
- Express.js
- PostgreSQL
- JWT
- bcrypt
- Socket.IO
- Express Validator

---

## Database

- PostgreSQL

Main Tables

- administrators
- students
- tests
- questions
- attempts
- answers
- security_logs

---

# 📂 Project Structure

```
mocktest-pro
│
├── client
│   ├── src
│   ├── public
│   └── package.json
│
├── server
│   ├── src
│   │
│   ├── routes
│   ├── controllers
│   ├── middleware
│   ├── services
│   ├── models
│   ├── config
│   └── package.json
│
├── render.yaml
└── README.md
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/hridyansh18/mocktest-pro.git
```

```
cd mocktest-pro
```

---

## Backend

```
cd server
npm install
npm run migrate
npm start
```

---

## Frontend

```
cd client
npm install
npm run dev
```

---

# 🔑 Environment Variables

## Backend

```
PORT=

DATABASE_URL=

JWT_SECRET=

JWT_REFRESH_SECRET=

CLIENT_URL=

ALLOWED_ORIGINS=

ADMIN_BOOTSTRAP_EMAIL=

ADMIN_BOOTSTRAP_PASSWORD=

ADMIN_BOOTSTRAP_NAME=
```

---

## Frontend

```
VITE_API_URL=https://mocktest-pro-nak4.onrender.com/api
```

---

# 🚀 Deployment

## Frontend

- Vercel

## Backend

- Render

## Database

- PostgreSQL

---

# 📡 Important API Endpoints

```
GET /api/health

POST /api/auth/admin/login

POST /api/auth/student/login

GET /api/admin/tests

POST /api/admin/tests

PUT /api/admin/tests/:id

DELETE /api/admin/tests/:id

POST /api/attempts/start

POST /api/attempts/save

POST /api/attempts/submit
```

---

# 🔄 Authentication Flow

```
Admin Login

↓

JWT Generated

↓

Protected Routes

↓

Admin Dashboard

↓

Manage Tests

↓

Students

↓

Results
```

---

# 🎯 Core Modules

- Authentication
- Test Management
- Question Management
- Student Management
- Administrator Management
- Exam Engine
- Result Engine
- Leaderboard
- Security Logs
- Live Monitor

---

# 📊 Future Enhancements

- AI Proctoring
- Webcam Monitoring
- Face Detection
- Email Notifications
- SMS OTP
- Certificate Generation
- Payment Gateway
- Multi Language Support
- Analytics Dashboard

---

# 👨‍💻 Developer

**Hridyansh Chaudhary**

MCA Student

DAVV University, Indore

GitHub

https://github.com/hridyansh18

---

# ⭐ If you like this project

Please give this repository a ⭐ on GitHub.

---

## 📜 License

This project is licensed under the MIT License.

---

**Made with ❤️ by Hridyansh Chaudhary**