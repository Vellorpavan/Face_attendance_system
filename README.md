<div align="center">

<img src="https://img.shields.io/badge/SVPCET_AI-Attendance_System-0ea5e9?style=for-the-badge&logo=graduation-cap&logoColor=white" alt="SVPCET AI Attendance System" />

# 🎓 SVPCET AI Attendance System

**Intelligent, real-time academic management — attendance, timetables, and communication, unified.**

[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)

[Overview](#-overview) · [Features](#-features) · [Tech Stack](#️-tech-stack) · [Quick Start](#️-setup) · [Roadmap](#-roadmap)

---

</div>

## 📌 Overview

**SVPCET AI Attendance System** is a full-stack academic management platform built to eliminate manual attendance bottlenecks in educational institutions. It connects admins, teachers, and students through a single, unified interface — automating workflows that used to take hours.

Built on **Supabase** for real-time data, **PostgreSQL** for reliable storage, and deployed on **Vercel** for zero-downtime access, this system is designed to scale with your institution.

> 💡 Built for SVPCET — but architected to work for any college or university.

---

## ✨ Features

### 👨‍💼 Admin Panel
| Capability | Description |
|---|---|
| 📅 Timetable Builder | Dynamic period management with conflict-free scheduling |
| 👨‍🏫 Teacher Management | Add, edit, and authorize teaching staff |
| 📊 Attendance Analytics | Present/absent insights across branches and years |
| 🔔 Smart Notifications | Target by branch, year, or individual student |
| 📄 Data Export | One-click PDF & Excel generation |

### 👨‍🏫 Teacher Module
| Capability | Description |
|---|---|
| ✅ Mark Attendance | Period-wise marking with real-time sync |
| 📘 Timetable View | See assigned classes and schedule at a glance |
| 📈 Student Tracking | Monitor individual and class-level attendance trends |

### 🎓 Student Module
| Capability | Description |
|---|---|
| 📊 Attendance Reports | Detailed personal attendance breakdown |
| 🔔 Notifications | Receive messages from admin and faculty instantly |
| 📅 Daily Schedule | Track the day's periods and subjects |

---

## 🧠 Smart Logic

The system goes beyond basic CRUD — it implements intelligent academic logic:

- **Continuous Period Handling** — Auto-adjusts attendance for missing or cancelled periods
- **Real-Time Delivery** — Notifications and attendance updates sync instantly via Supabase Realtime
- **Dynamic Subject Summaries** — Generates per-subject attendance breakdowns automatically
- **Conflict-Free Timetable Engine** — Prevents double-booking of teachers and classrooms
- **Mobile-Responsive UI** — Works seamlessly on any screen size

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML, CSS, Vanilla JavaScript |
| **Backend & Auth** | [Supabase](https://supabase.com) (PostgreSQL + Auth + Realtime) |
| **Database** | PostgreSQL (managed via Supabase) |
| **Hosting** | [Vercel](https://vercel.com) |

---

## 🔐 Authentication & Access Control

- Secure login powered by **Supabase Auth**
- **Role-based access control (RBAC)** with three distinct roles:

```
Admin     →  Full system access (manage users, data, exports)
Teacher   →  Attendance marking + timetable view
Student   →  Read-only access (own data + notifications)
```

No user can access another role's data or actions — enforced at the database level via Supabase Row Level Security (RLS).

---

## ⚙️ Setup

### Prerequisites

- Node.js **18+**
- A free [Supabase](https://supabase.com) account
- A [Vercel](https://vercel.com) account (for deployment)

### 1. Clone the Repository

```bash
git clone https://github.com/Vellorpavan/Face_attendance_system.git
cd Face_attendance_system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> 🔒 Never commit your `.env` file. It's already listed in `.gitignore`.  
> Find these values in your Supabase project under **Settings → API**.

### 4. Run Locally

```bash
npm run dev
```

App will be live at **http://localhost:5173**

### 5. Deploy to Vercel

```bash
npm run build
vercel deploy
```

Or connect your GitHub repo directly to Vercel for **automatic deployments** on every push.

---

## 🎯 Why This Exists

Traditional attendance systems in colleges are slow, error-prone, and siloed. This project was built to:

- ⏱️ **Save time** — Cut manual attendance work from hours to minutes
- ✅ **Eliminate errors** — Automated logic removes human data entry mistakes
- 📡 **Improve communication** — Instant notifications bridge the gap between staff and students
- 📂 **Digitize workflows** — Replace registers and spreadsheets with a live, auditable system

---

## 📸 Screenshots

> _Add screenshots of the Timetable Builder, Attendance Dashboard, Notification Center, and Student View here._

| Timetable Builder | Attendance Dashboard | Notifications |
|---|---|---|
| `screenshot1.png` | `screenshot2.png` | `screenshot3.png` |

---

## 🗺️ Roadmap

- [ ] 📱 **Mobile App** — React Native client for iOS & Android
- [ ] 🤖 **Face Recognition Attendance** — Auto-mark attendance via camera
- [ ] 📡 **Push Notifications** — Web push support for offline alerts
- [ ] 📊 **Advanced Analytics Dashboard** — Trends, predictions, low-attendance alerts
- [ ] 🌐 **Multi-Institution Support** — One deployment, multiple colleges

---

## 🤝 Contributing

Contributions are welcome!

1. Fork this repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: describe your change"`
4. Push and open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ for SVPCET by [Vellorpavan](https://github.com/Vellorpavan)

⭐ If this helped your institution, give it a star!

</div>
