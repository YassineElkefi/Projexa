# 🛰️ Projexa Backend

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
</p>

## 📖 Description

The core API for Projexa, built with **NestJS**. This service manages project data, user authentication, real-time communications, and notification systems.

---

## 🛠️ Tech Stack

- **Core**: [NestJS](https://nestjs.com/) (v11+)
- **ORM**: [TypeORM](https://typeorm.io/)
- **Database**: [MySQL 8.0](https://www.mysql.com/)
- **Authentication**: [Passport-JWT](http://www.passportjs.org/packages/passport-jwt/)
- **Real-time**: [@nestjs/websockets](https://docs.nestjs.com/websockets/gateways) & [Socket.io](https://socket.io/)
- **Mailing**: [Nodemailer](https://nodemailer.com/), [Handlebars](https://handlebarsjs.com/), & [Resend](https://resend.com/)
- **Validation**: [class-validator](https://github.com/typestack/class-validator) & [class-transformer](https://github.com/typestack/class-transformer)

---

## ⚙️ Installation

```bash
$ npm install
```

## 🚀 Running the app

### Configuration
1. Rename `.env.example` to `.env` (if available) or create a `.env` file.
2. Configure your MySQL credentials and JWT secrets.

### Start Command
```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

---

## 🧪 Testing

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

---

## 📁 Project Structure

```bash
src/
├── 👤 admin/         # Admin dedicated modules
├── 🔐 auth/          # Authentication & Authorization
├── 🔌 gateway/       # Socket.io Gateways for real-time
├── 📧 mail/          # Email service & templates
├── 🔔 notifications/ # Notification logic
├── 📋 projects/      # Project Management core
├── 📤 upload/        # File upload handling
└── 👥 users/         # User management
```

---

## 🤝 Support

For support, please check the [main README](../README.md) or contact the development team.

---

<p align="center">
  <b>Projexa API</b> • Scalable & Efficient
</p>
