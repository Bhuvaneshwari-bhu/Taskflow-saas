---

# 🚀 TaskFlow — SaaS Project Management System

A full-stack **SaaS-based project management platform** that enables organizations to manage projects, tasks, and team collaboration with secure authentication, caching, background jobs, and cloud-based media handling.

---
## 🚀 Live Deployment

The application is fully deployed and accessible online:

* **Frontend (Vercel):** Vercel
  👉 [https://taskflow-saas-frontend-81ktwus0x-bhu1.vercel.app](https://taskflow-saas-frontend-81ktwus0x-bhu1.vercel.app)

* **Backend API (Render):** Render
  👉 [https://taskflow-saas-backend-s4ee.onrender.com](https://taskflow-saas-backend-s4ee.onrender.com)

---

# 📌 Features

## 🔐 Authentication

* JWT-based authentication (Access + Refresh tokens)
* Secure login & signup
* Session handling with refresh token flow

---

## 🏢 Multi-Tenant Architecture

* Users can belong to **multiple organizations**
* Organizations act as **independent workspaces**
* Users must **join via invite code** or create a new organization

---

## 👥 Organization System

* Invite-based onboarding using **Invite Codes**
* Role-based access:

  * **Owner**
  * **Member**
* Organization-level user management

---

## 📁 Project Management

* Projects exist inside organizations
* Each project has its own **members**
* Admins can:

  * Add/remove members
  * Manage project settings

---

## ✅ Task Management (Kanban System)

* Tasks belong to projects
* Status-based workflow:

  * TODO
  * IN_PROGRESS
  * DONE
* Assign tasks to project members
* Real-time UI updates

---

## ☁️ Cloudinary Integration

* File uploads handled via **Cloudinary**
* Stores images/files securely in cloud
* Returns optimized URLs for frontend use

---

## ⚡ Redis Caching

* Used for:

  * Faster data retrieval
  * Reducing database load
* Example:

  * Project/task caching
* Improves performance significantly

---

## 🔁 Queue System (Bull / Redis)

* Background jobs for:

  * Notifications
  * Async processing
* Ensures scalability and non-blocking operations

---

## 🗄️ MongoDB Atlas

* Cloud-hosted NoSQL database
* Stores:

  * Users
  * Organizations
  * Projects
  * Tasks

---

# 🧠 System Flow (IMPORTANT — Interview Ready)

## 1. User Authentication

```text
User → Login/Signup → JWT issued → Stored in frontend
```

---

## 2. Organization Flow

```text
User logs in →
Fetch organizations →
If none → Join via invite / create org →
Select organization →
Enter dashboard
```

---

## 3. Project Flow

```text
Organization →
Create Project →
Add members from organization →
Project ready for collaboration
```

---

## 4. Task Flow (Core Logic)

```text
Project →
Create Task →
Assign to member →
Task moves:
TODO → IN_PROGRESS → DONE
```

---

## 5. Redis + Cache Flow

```text
Request → Check Redis →
If HIT → return cached data
If MISS → fetch from MongoDB → store in Redis → return
```

---

## 6. Queue System Flow

```text
Trigger action →
Push job to queue →
Worker processes job asynchronously
```

---

## 7. Cloudinary Flow

```text
Upload file →
Send to Cloudinary →
Store URL in DB →
Render in frontend
```

---

# 🛠️ Tech Stack

## Backend

* Node.js
* Express.js
* MongoDB Atlas
* Redis
* Bull Queue
* Cloudinary

## Frontend

* React (Vite)
* Axios
* React Router

---

# ⚙️ Setup Instructions (LOCAL RUN)

## 1. Clone Repository

```bash
git clone <your-repo-url>
cd Saas_product
```

---

## 2. Install Dependencies

### Backend

```bash
npm install
```

### Frontend

```bash
cd client
npm install
```

---

## 3. Environment Variables

Create `.env` in root:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 4. Start Redis

Using Docker:

```bash
docker start redis
```

OR (if not running):

```bash
docker run -d --name redis -p 6379:6379 redis:latest
```

---

## 5. Run Backend

```bash
npm run dev
```

Runs on:

```text
http://localhost:5000
```

---

## 6. Run Frontend

```bash
cd client
npm run dev
```

Runs on:

```text
http://localhost:5173
```

---

# 🔗 API Base URL

```text
http://localhost:5000/api
```

---

# 🧪 How to Test (Quick Demo Flow)

1. Signup new user
2. Create organization
3. Copy invite code
4. Login with another user
5. Join organization
6. Create project
7. Add members
8. Create tasks
9. Move tasks across Kanban board

---

# 🎯 Key Highlights (Say this in Interview)

* Built **multi-tenant SaaS architecture**
* Implemented **JWT auth with refresh tokens**
* Used **Redis caching for performance optimization**
* Integrated **Bull queue for async processing**
* Designed **Kanban workflow system**
* Implemented **invite-based collaboration system**
* Used **Cloudinary for scalable media handling**

---

# 🚀 Future Improvements

* Email-based invitations
* Role-based permissions (Admin, Viewer)
* Real-time updates (WebSockets)
* Notifications system
* Analytics dashboard

---

# 👩‍💻 Author

**Bhuvaneshwari (Bhu)**
CSE Student | Full Stack Developer | AI Enthusiast

---

# ⭐ Final Note

This project demonstrates a **complete SaaS lifecycle**:

```text
Authentication → Multi-tenancy → Collaboration → Task workflow → Performance optimization
```

---

Add it cleanly and professionally—don’t just say “deployed,” show links + stack.

Copy-paste this into your README:

---


## 🏗️ Deployment Architecture

* Frontend is deployed on **Vercel** for fast global delivery and automatic CI/CD.
* Backend is deployed on **Render** as a Node.js service.
* Database is hosted on **MongoDB Atlas** (cloud-managed NoSQL database).
* Redis (Upstash) is used for caching and background queue handling.

---

## ⚙️ Environment & Configuration

* Environment variables are securely managed on both Vercel and Render.
* CORS is configured to allow communication between frontend and backend.
* API base URL is dynamically configured using environment variables.

---

## 🔁 CI/CD Workflow

* Code is pushed to GitHub.
* Vercel automatically deploys frontend changes.
* Render automatically deploys backend updates.
* No manual deployment steps required.

---

## 🌐 Key Highlights

* Fully working production deployment
* Handles real-world issues like:

  * CORS configuration
  * Environment variable management
  * API routing across domains
* Scalable architecture with separate frontend and backend services

---

