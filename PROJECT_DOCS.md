# KrishRide Project Documentation

## Overview

KrishRide is a modern ride-sharing platform that connects riders with drivers. It features a scalable architecture designed to handle real-time location tracking, secure payments, and reliable trip management.

## System Components

The project is divided into four main components, providing flexibility and modularity:

1. **Mobile Application (`mobile-app`)**: 
   - Built with React Native & Expo.
   - Provides interfaces for both Customers (Riders) and Drivers.
   - Handles real-time maps, ride booking, driver tracking, and SOS features.

2. **Web Dashboard (`react-frontend`)**:
   - Built using React and Vite.
   - Serves as the administrative or web-based interface for managing the platform.

3. **Node.js Backend (`node-backend`)**:
   - A lightweight, high-performance API server.
   - Uses Express.js and Prisma ORM.
   - Ideal for rapid development and handling numerous concurrent I/O operations (like WebSockets for location updates).

4. **Spring Boot Backend (`springboot-backend`)**:
   - An enterprise-grade API server.
   - Uses Java, Spring Web, Spring Data JPA, and Hibernate.
   - Ideal for complex business logic, strict type safety, and integrating with robust enterprise systems.

*Note: The platform is designed such that you only need to run ONE backend (Node.js OR Spring Boot) to support the frontend applications.*

## Key Features

- **User Authentication**: Secure signup and login for riders and drivers, potentially using JWT and OTP verification.
- **Ride Booking**: Real-time ride requests, fare estimation, and driver matching.
- **Live Tracking**: WebSocket integration for real-time location updates on Google Maps.
- **Payments**: Integration with payment gateways (e.g., Razorpay) for seamless transactions.
- **Safety**: SOS features and ride sharing links for passenger safety.
- **Notifications**: Push notifications for ride status updates via external services (like Twilio or Firebase).

## Environment Configuration

Environment variables are crucial for running the services securely. Example files are provided in each directory:
- `node-backend/env.example`
- `springboot-backend/.env.example`
- `mobile-app/.env.example`
- `react-frontend/.env.example`

Make sure to replace placeholder values with your actual API keys (e.g., Google Maps API Key, Razorpay Keys, Database URLs) before starting the applications.

## Deployment Strategy

The application can be containerized using Docker and deployed to cloud platforms like AWS, GCP, or Azure. 
- **Database**: We recommend using managed PostgreSQL instances (e.g., Neon, AWS RDS).
- **Cache**: A managed Redis instance (e.g., Upstash, ElastiCache) is required for managing active driver locations and caching.
- **Mobile App**: Can be built and deployed to Google Play Store and Apple App Store using Expo Application Services (EAS).
