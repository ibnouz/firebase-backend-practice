
# ** Important Info by IBNOUZ**
- Each task has 1 role string, the "concernedrole" property
- a user can have multiple roles in their custom claims data
    - if a task has a role that a user has, they will see it
    - the role "admin" sees all when using /foryou get route but made to not get assigned to the task when firestore trigger searches for someone with the concernedrole to assign to
    
    - UPD: use route /account/setrole with wantedrole in headers to give yourself a role
    - will return your role in this format { rolesnow: ['allo', 'big'] }

# Firebase Backend Intern Practice

## About The Project

This practice program is designed to provide hands-on experience in building and managing backend systems using Firebase and Cloud Functions with TypeScript. By the end of the program, you will have developed a dynamic backend application and learned best practices for backend development.

## Features

- **User Authentication**: Secure login, registration, and session management.
- **Firestore Database**: Real-time data management with Firestore.
- **Cloud Functions**: Scheduled tasks, callable functions, and external API integration.
- **Error Handling and Logging**: Effective debugging and monitoring.
- **Performance Optimization**: Ensure scalable and efficient backend operations.

## Getting Started

To start working on the backend, follow these steps:

## Prerequisites
- Node.js (Latest LTS Version)
- Firebase CLI
- TypeScript
- A Firebase account

## Installation

1. **Fork the Repository**:
   - Visit the provided repository link.
   - Click the "Fork" button to create a copy under your GitHub account.

2. **Clone Your Fork**:
```bash
git clone https://github.com/[YourUsername]/firebase-backend-practice.git
```

3. Navigate to the project directory:
```bash
cd firebase-backend-practice
```

4. Install all dependencies:
```bash
npm install
```

5. Set up your Firebase project.
   - Run the Firebase initialization command:
   ```bash
   firebase init
   ```
   - Select "Functions" and choose TypeScript.
   
6. Deploy your Firebase setup:
```bash
firebase deploy
```

## Working with the Project

- **Do Not Push Directly to Main Repository**: Make changes in your fork and create pull requests for updates.
- **Stay Updated**: Regularly fetch and merge changes from the main repository to your fork:
```bash
git remote add upstream https://github.com/devxpressinc/firebase-backend-practice.git
git fetch upstream
git merge upstream/main
```

- **Create Feature Branches**: For new features or changes, create separate branches in your fork:
```bash
git checkout -b feature/YourFeatureName
```

- **Push to Your Fork**: Commit your changes and push them to your forked repository.
- **Create Pull Requests**: For merging your changes into the main repository, create a pull request from your fork.

## Requirements

### Application Overview
- **Name**: Task Management API
- **Platform**: Backend
- **Technologies**: Firebase, TypeScript

### Key Features

#### 1. Authentication Module
- **Features**:
    - Email and password-based registration.                X
    - Secure login and session management.                X
    - Callable function to create user-specific profiles.
- **Firebase Integration**: Use Firebase Authentication. X

#### 2. Task Management Module
- **Features**:
    - Create, read, update, and delete tasks.                X
    - Assign tasks dynamically to users based on predefined criteria.                X
    - Real-time updates for task changes using Firestore triggers.                X
- **Firebase Integration**: Use Firestore for data management.    X

#### 3. External API Integration
- **Features**:
    - Fetch and display external data (e.g., weather data for task scheduling).
    - Securely store and use API keys with Firebase Config.
- **Cloud Function**: Implement integration within a callable function.

#### 4. Scheduled Notifications
- **Features**:
    - Send notifications for upcoming deadlines.
    - Use Firebase Cloud Functions to schedule reminders.
- **Firebase Integration**: Use scheduled functions and push notifications.

#### 5. Role-Based Access Control (RBAC)
- **Features**:
    - Implement role-based access for different user types (e.g., Admin, User).    X
    - Define Firestore rules for access control.
    - Use Cloud Functions to enforce RBAC for sensitive operations.    X

#### 6. Advanced Reporting Module
- **Features**:
    - Generate periodic reports for task completion statistics.
    - Implement a Cloud Function to summarize user activity.
    - Store reports in Firestore for admin access.

#### 7. Webhook Integration
- **Features**:
    - Handle incoming webhooks (e.g., for syncing with third-party services).
    - Validate and securely process webhook data.
    - Log webhook events for debugging.

#### 8. Data Backup and Restoration
- **Features**:
    - Implement scheduled backups of Firestore data.
    - Use Cloud Storage to store backup files.
    - Create a Cloud Function to restore data from backups.

#### 9. Error Handling and Performance Monitoring
- **Features**:
    - Log and handle errors effectively.
    - Monitor performance using Firebase Performance Monitoring.

### Testing and Deployment

- **Unit Testing**: Write tests for Cloud Functions using Jest.    X
- **Firestore Testing**: Use Firebase Emulator for database rule validation.   
- **Deployment**: Deploy functions and database rules:
```bash
firebase deploy
```

### Bonus Features (Optional)
- Implement categorization or tagging for tasks.
- Add analytics for task completion rates.
- Implement a reporting module for admin users.

## Tools and Resources
- **Firebase CLI**: https://firebase.google.com/docs/cli
- **TypeScript**: https://www.typescriptlang.org/
- **Postman**: https://www.postman.com/
- **Jest**: https://jestjs.io/
- **Node.js**: https://nodejs.org/

## Best Practices

- Follow the principle of least privilege for Firestore rules.
- Ensure Cloud Functions are modular and reusable.
- Use environment variables for sensitive information.
- Write detailed comments and maintain clear documentation.

Enjoy your learning journey!
