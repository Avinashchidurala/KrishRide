# KrishRide

Welcome to **KrishRide**, a comprehensive ride-hailing application platform.

## Architecture & Tech Stack

KrishRide offers a flexible architecture allowing you to choose your preferred backend stack. The repository is structured as a monorepo containing:

- **Mobile App (`mobile-app/`)**: Built with React Native and Expo for both iOS and Android.
- **Web Frontend (`react-frontend/`)**: An admin/web dashboard built with React and Vite.
- **Node.js Backend (`node-backend/`)**: A fast and scalable backend using Node.js, Express, and Prisma.
- **Spring Boot Backend (`springboot-backend/`)**: A robust and enterprise-ready backend using Java and Spring Boot.

**You can choose to run EITHER the Node.js backend OR the Spring Boot backend.** The frontend applications are designed to interface seamlessly with either option, provided the API endpoints conform to the same specifications.

## Quick Start

### 1. Prerequisites
- Node.js (v18+)
- Java (v17+) and Maven (if using Spring Boot)
- PostgreSQL (or configure your preferred database)
- Redis

### 2. Backend Setup
Choose your preferred backend:

**Option A: Node.js Backend**
1. Navigate to the Node backend directory: `cd node-backend`
2. Install dependencies: `npm install`
3. Copy the example environment file: `cp env.example .env`
4. Update the `.env` file with your database and service credentials.
5. Run database migrations: `npx prisma db push` (or migrate dev)
6. Start the server: `npm run dev`

**Option B: Spring Boot Backend**
1. Navigate to the Spring Boot backend directory: `cd springboot-backend`
2. View `.env.example` to see the required properties. You can set these in your environment or update `src/main/resources/application.properties`.
3. Run the application using Maven: `./mvnw spring-boot:run`

### 3. Frontend Setup
**Mobile App:**
1. Navigate to the mobile app directory: `cd mobile-app`
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in the required keys.
4. Start Expo: `npx expo start`

**React Frontend (Web):**
1. Navigate to the React frontend directory: `cd react-frontend`
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`.
4. Start the development server: `npm run dev`

---
For more detailed information on the project's architecture, features, and deployment strategies, please refer to the [PROJECT_DOCS.md](./PROJECT_DOCS.md).
