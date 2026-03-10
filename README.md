# 🚀 ResolveX - Community Issue Resolution Platform

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

**ResolveX** is a comprehensive, multi-tenant web application designed to bridge the communication gap between community members, operational staff, and administrators. It streamlines the process of reporting, assigning, tracking, and resolving community or organizational issues.



## ✨ Key Features

### 🔐 Multi-Tier Role-Based Access Control (RBAC)
* **Administrators:** Can create a secure "Workspace" and generate a unique `Workspace Code`. Admins manage departments, oversee staff, view detailed analytics, and track system-wide audit logs.
* **Staff Members:** Register using an Admin's `Workspace Code`. They are auto-assigned a unique Staff ID and placed into specific departments to handle relevant tickets.
* **Community Members (Users):** Can sign up, submit complaints/issues, track resolution progress in real-time, and communicate with assigned staff.

### 🏢 Smart Department Management
* **Dynamic Routing:** Issues are routed to specific departments (e.g., Sanitation, Electricity, IT).
* **"Smart Delete" Fallback:** If an Admin deletes a department, the system prevents data loss by automatically reassigning all orphaned staff members and active tickets to a protected, default "Other" bucket.

### 🛡️ Secure Authentication
* **OTP Verification:** Email-based One-Time Password (OTP) verification is strictly enforced for all roles during signup and password resets.
* **JWT Authorization:** Secure, token-based API endpoints.

### 📊 Real-Time Analytics & Operations
* **Live Dashboards:** Interactive Recharts-powered graphs showing resolution rates, complaint volume, and department performance.
* **Real-time Communication:** Socket.io integration for instant chat between users and staff, plus live notification bells.
* **Audit Logging:** System automatically tracks critical actions (logins, ticket updates, department changes) for accountability.

---

## 💻 Tech Stack

**Frontend:**
* React (Vite)
* Tailwind CSS (Styling)
* Framer Motion (Animations)
* Recharts (Data Visualization)
* Lucide React (Icons)
* React Router Dom (Navigation)

**Backend:**
* Node.js & Express.js
* MongoDB & Mongoose (Database)
* Socket.io (Real-time WebSockets)
* JWT & Bcrypt (Auth & Encryption)
* Nodemailer (OTP Email Delivery)

---

## ⚙️ Installation & Setup

### Prerequisites
* Node.js (v16+ recommended)
* MongoDB database (Local or Atlas)

### 1. Clone the repository
```bash
git clone [https://github.com/yourusername/resolvex.git](https://github.com/yourusername/resolvex.git)
cd resolvex

```

### 2. Setup the Backend

```bash
cd backend
npm install

cd frontend 
npm i

```

Create a `.env` file in the `backend` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
EMAIL_USER=your_smtp_email@gmail.com
EMAIL_PASS=your_smtp_app_password
FRONTEND_URL=http://localhost:5173

```

Start the backend server:

```bash
npm run dev

```

### 3. Setup the Frontend

```bash
cd frontend
npm install

```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000

```

Start the Vite development server:

```bash
npm run dev

```

---

## 🚦 System Flow

1. **Admin Creation:** An Admin creates an account (verified via OTP) and establishes a Workspace. The system generates a `Workspace Code` (e.g., `A7X9P2`).
2. **Department Setup:** The Admin creates operational departments (e.g., "Water Supply").
3. **Staff Onboarding:** Staff sign up using the `Workspace Code`, verify their email, and are assigned to a department.
4. **Issue Reporting:** A User signs up and submits an issue.
5. **Resolution:** Staff in the relevant department receive the ticket, chat with the user via WebSockets, and update the status to "Resolved".
6. **Analytics:** The Admin monitors the entire lifecycle from the high-level dashboard.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://www.google.com/search?q=https://github.com/yourusername/resolvex/issues).