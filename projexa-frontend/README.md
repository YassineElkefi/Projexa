# 🎨 Projexa Frontend

<p align="center">
  <img src="https://img.shields.io/badge/Angular_21-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Socket.io_Client-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
</p>

## 📖 Description

The official frontend application for **Projexa**. A sleek, responsive, and interactive dashboard built with **Angular 21** and **Tailwind CSS**.

---

## ✨ Features

- 🖥️ **Responsive Design**: Mobile-first approach using Tailwind CSS.
- 🚦 **State Management**: Reactive data patterns with RxJS.
- 🔑 **Secure Routing**: Protected routes and JWT-based session management.
- 📡 **Live Feedback**: Real-time updates for projects and notifications.
- 💅 **Modern UI**: Polished components and smooth transitions.

---

## 🛠️ Tech Stack

- **Framework**: [Angular 21](https://angular.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State/Reactivity**: [RxJS](https://rxjs.dev/)
- **Authentication**: [@auth0/angular-jwt](https://github.com/auth0/angular-jwt)
- **UI Alerts**: [SweetAlert2](https://sweetalert2.github.io/)
- **Testing**: [Vitest](https://vitest.dev/)

---

## ⚙️ Development

### Installation
```bash
$ npm install
```

### Development Server
```bash
$ npm run start
# OR
$ ng serve
```
Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Build
```bash
$ npm run build
```
The build artifacts will be stored in the `dist/` directory.

---

## 📁 Folder Structure

```bash
src/
└── app/
    ├── 🏛️ core/       # Singleton services, guards, interceptors
    └── 🚀 features/   # Lazy-loaded feature modules
        ├── 👤 admin/     # Admin management screens
        ├── 🔐 auth/      # Login & Registration
        ├── 📊 dashboard/ # Main overview
        └── 📋 projects/  # Project list & details
```

---

## 🧪 Testing

```bash
$ npm run test
```

---

<p align="center">
  <b>Projexa UI</b> • Responsive & Interactive
</p>
