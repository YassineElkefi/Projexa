# 🚀 Projexa - Professional Project Management Suite

<p align="center">
  <img src="https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular" />
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
</p>

## 🌟 Overview

**Projexa** is a modern, full-stack project management platform designed for seamless collaboration and efficient task tracking. Built with a powerful **NestJS** backend and a dynamic **Angular 21** frontend, it leverages real-time capabilities to keep teams in sync.

---

## ✨ Key Features

- 🛠️ **Project Management**: Create, manage, and track projects with ease.
- 🔐 **Secure Authentication**: Robust JWT-based authentication system.
- ⚡ **Real-time Updates**: Live notifications and updates via Socket.io.
- 📊 **Interactive Dashboard**: Comprehensive overview of project progress and team activities.
- 🛂 **Role-Based Access**: Specialized views for Administrators and regular Users.
- 📧 **Automated Notifications**: Integrated mail system for important updates.
- 📁 **File Management**: Secure file upload and sharing capabilities.

---

## 🏗️ Project Structure

The repository is organized into two main workspaces:

```bash
Projexa/
├── 📂 projexa-backend/  # NestJS API, TypeORM, WebSockets
└── 📂 projexa-frontend/ # Angular 21, Tailwind CSS, State Management
```

---

## 🚦 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Projexa.git
cd Projexa
```

### 2. Setup Backend
Follow the instructions in the [Backend README](./projexa-backend/README.md).

### 3. Setup Frontend
Follow the instructions in the [Frontend README](./projexa-frontend/README.md).

---

## 🛠️ Technology Stack

### Backend
- **Framework**: [NestJS](https://nestjs.com/)
- **Database**: [MySQL](https://www.mysql.com/) with [TypeORM](https://typeorm.io/)
- **Auth**: [Passport.js](https://www.passportjs.org/) & [JWT](https://jwt.io/)
- **Communication**: [Socket.io](https://socket.io/)
- **Mailing**: [Resend](https://resend.com/) & [Nodemailer](https://nodemailer.com/)

### Frontend
- **Framework**: [Angular 21](https://angular.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [SweetAlert2](https://sweetalert2.github.io/)
- **Real-time**: [Socket.io Client](https://socket.io/docs/v4/client-api/)

---

<p align="center">
  Made with ❤️ by Yassine
</p>
