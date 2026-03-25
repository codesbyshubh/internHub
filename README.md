# internHub
A comprehensive, full-stack internship and job portal designed to bridge the gap between talented students and top employers. Built with a clean, responsive UI and a robust relational database backend.

A full-stack internship and job platform built with **HTML, CSS, JavaScript** (frontend) and **Node.js, Express.js, MySQL** (backend).

---

### Prerequisites
- Node.js v16+
- MySQL 8.0+
- npm

### 1. Database Setup

Open MySQL and run:

```bash
mysql -u root -p < backend/database.sql
```

Or copy-paste the contents of `backend/database.sql` into MySQL Workbench.

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` file:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=internshala_db
JWT_SECRET=your_secret_key_here
PORT=5000
```

Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

### 3. Access the Application

Open your browser and visit: **http://localhost:5000**

---

## 🎯 Features

### For Students
- 🔐 Register/Login with JWT authentication
- 🔍 Browse and search internships with filters (category, type, location, stipend)
- 💼 Browse and search full-time/part-time jobs
- 📄 Apply with cover letter
- 🔖 Save/bookmark listings
- 📊 Track application status in dashboard
- 👤 Edit profile (skills, college, bio)

### For Employers
- 🏢 Create company profile
- ➕ Post internships with full details (stipend, duration, skills, perks)
- ➕ Post jobs with full details (salary, experience, qualifications)
- 📬 View applications received
- ✅ Update application status (pending → reviewed → shortlisted → hired/rejected)
- 📈 Dashboard with stats

### Platform
- 🎨 Clean, modern UI similar to Internshala
- 📱 Responsive design (mobile-friendly)
- 🔎 Advanced filtering system
- 📄 Pagination
- 🍞 Toast notifications
- 🔑 Role-based access (student/employer/admin)

---

## 🗄️ Database Tables

| Table | Description |
|-------|-------------|
| `users` | Student and employer accounts |
| `companies` | Company profiles |
| `internships` | Internship listings |
| `jobs` | Job listings |
| `applications` | Student applications |
| `saved_items` | Bookmarked listings |
| `categories` | Available categories |

---

## 🔑 Default Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@internshala.com | admin123 |
| Employer | hr@techcorp.com | employer123 |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Internships
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/internships` | List with filters |
| GET | `/api/internships/:id` | Get single |
| POST | `/api/internships` | Create (employer) |
| PUT | `/api/internships/:id` | Update (employer) |
| DELETE | `/api/internships/:id` | Delete (employer) |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List with filters |
| GET | `/api/jobs/:id` | Get single |
| POST | `/api/jobs` | Create (employer) |
| PUT | `/api/jobs/:id` | Update (employer) |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/applications` | Submit application |
| GET | `/api/applications/my` | My applications |
| GET | `/api/applications/check/:type/:id` | Check if applied |
| PUT | `/api/applications/:id/status` | Update status (employer) |

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (CSS Variables, Grid, Flexbox), Vanilla JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: MySQL with mysql2 driver
- **Auth**: JWT (jsonwebtoken), bcryptjs
- **Fonts**: Sora + Plus Jakarta Sans (Google Fonts)
