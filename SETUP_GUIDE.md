# Setup Guide - KrishRide

This document provides step-by-step instructions on how to set up Gmail App Passwords, Upstash Redis, and Neon PostgreSQL for the **KrishRide** project, as well as a list of the technology stack versions used across the platform.

---

## Tech Stack & Versions

The KrishRide platform is built using the following modern tech stacks:

### 1. Spring Boot Backend (`springboot-backend/`)
- **Java Platform**: Version `21` (LTS)
- **Spring Boot**: Version `4.0.6` (Core framework, WebMVC, Data JPA, Data Redis, Security, WebSocket)
- **JSON Web Tokens (JJWT)**: Version `0.12.5` (Authentication)
- **Netty Socket.io**: Version `2.0.13` (Real-time tracking and notifications)
- **Twilio SDK**: Version `10.1.0` (SMS and OTP services)
- **Cloudinary SDK**: Version `1.39.0` (Profile/Document image uploads)

### 2. Node.js Backend (`node-backend/`)
- **Node.js**: Recommended `v18.x` or higher (Engine requirement: `>=16.0.0`)
- **Prisma Client/ORM**: Version `^5.22.0`
- **Express.js**: Version `^4.18.2`
- **Redis Client**: Version `^4.6.13`
- **Razorpay Node SDK**: Version `^2.9.6`
- **Twilio Node SDK**: Version `^5.10.7`

### 3. Mobile Application (`mobile-app/`)
- **Expo Framework**: Version `~54.0.0`
- **React Native**: Version `0.81.5`
- **React / React DOM**: Version `19.1.0`
- **Redux Toolkit**: Version `^2.11.2`
- **Socket.io Client**: Version `^4.7.2`

### 4. Web Frontend (`react-frontend/`)
- **Vite & React**: Version `^18.x` (React ecosystem)
- **Material UI (MUI) & Tailwind CSS**: Styling & layout libraries

---

## 1. How to Create a Gmail App Password

Since Google discontinued "Less Secure Apps" access, you must use an **App Password** to configure automatic email sending (e.g., invoice delivery, OTP notifications) via SMTP in the backend.

### Step-by-Step Instructions:
1. Ensure **2-Step Verification** is enabled on the Google Account you wish to use. If not:
   - Go to the [Google Account Security Settings](https://myaccount.google.com/security).
   - Under "How you sign in to Google", select **2-Step Verification** and follow the prompts to set it up.
2. Visit the Google Account [App Passwords page](https://myaccount.google.com/apppasswords) directly (you may be asked to sign in again).
3. In the **App name** input field, type a descriptive name (e.g., `KrishRide Backend`).
4. Click the **Create** button.
5. A modal will pop up displaying a **16-character code** (e.g., `abcd efgh ijkl mnop`). Copy this password immediately (without spaces).
6. Update your environment configuration:
   - **For Node Backend**: Paste this 16-character password into the `.env` file for `SMTP_PASSWORD` or similar variables.
   - **For Spring Boot Backend**: Add it to your `.env` or `application.properties` configuration under `spring.mail.password`.

---

## 2. How to Set Up Upstash Redis

Upstash provides a fully managed serverless Redis database that is ideal for handling session caching and tracking live locations of active drivers.

### Step-by-Step Instructions:
1. Go to the [Upstash Console](https://console.upstash.com/) and sign up for an account.
2. In the dashboard, click on **Create Database**.
3. Fill in the following details:
   - **Name**: e.g., `krishride-redis`
   - **Type**: Select **Redis**
   - **Region**: Select a cloud provider (AWS/GCP) and region closest to your server deployment.
4. Click **Create**.
5. Once created, scroll down to the **Details** section on your database dashboard:
   - Locate your **Endpoint** (Hostname) and **Port**. (e.g., Host: `super-ghost-129531.upstash.io`, Port: `6379`).
   - Click the eyes icon to reveal the **Password**.
6. Integrate with your backends:
   - **For Node Backend (`.env`)**:
     ```env
     REDIS_HOST=your-endpoint.upstash.io
     REDIS_PORT=6379
     REDIS_PASSWORD=your-redis-password
     ```
   - **For Spring Boot Backend (`application.properties`)**:
     ```properties
     spring.data.redis.host=your-endpoint.upstash.io
     spring.data.redis.port=6379
     spring.data.redis.username=default
     spring.data.redis.password=your-redis-password
     spring.data.redis.ssl.enabled=true
     ```

---

## 3. How to Set Up Neon PostgreSQL

Neon is a serverless Postgres database designed for modern applications, handling the relational data of users, rides, bookings, and KYC info.

### Step-by-Step Instructions:
1. Go to the [Neon Console](https://console.neon.tech/) and sign up.
2. Click **Create Project**.
3. Enter your project details:
   - **Project Name**: e.g., `krishride-database`
   - **Database Name**: Leave default as `neondb` or configure a custom one.
   - **Region**: Choose a region closest to your deployment server.
4. Click **Create Project**.
5. You will be redirected to the dashboard where your **Connection String** is displayed.
6. Under **Connection Details**, copy the connection string. It looks like:
   `postgresql://neondb_owner:npg_xxxxxxx@ep-winter-sunset-ap8nhxsg-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require`
7. Integrate with your backends:
   - **For Node Backend (`.env` for Prisma)**:
     ```env
     DATABASE_URL="postgresql://neondb_owner:npg_xxxxxxx@ep-winter-sunset-ap8nhxsg-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"
     ```
   - **For Spring Boot Backend (`application.properties` / `.env`)**:
     Use the JDBC URL format:
     ```properties
     spring.datasource.url=jdbc:postgresql://ep-winter-sunset-ap8nhxsg-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&stringtype=unspecified
     spring.datasource.username=neondb_owner
     spring.datasource.password=npg_xxxxxxx
     ```
