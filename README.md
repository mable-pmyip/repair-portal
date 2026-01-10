# Repair Portal

A full-stack web application for managing repair requests with user authentication, admin management, and multi-language support.

## Project Structure

```
repair-portal/
├── frontend/          # React frontend application
├── functions/         # Firebase Cloud Functions (backend)
├── firebase.json      # Firebase configuration
└── .firebaserc        # Firebase project settings
```

## Features

- **User Authentication**: Secure login with Firebase Auth
- **Repair Requests**: Submit and track repair requests with images
- **Admin Dashboard**: Manage users, repairs, and export data
- **Multi-language**: English and Traditional Chinese (繁體中文)
- **Password Security**: Forced password change on first login

## Quick Start

1. **Install dependencies:**
   ```bash
   cd frontend && npm install
   cd ../functions && npm install
   ```

2. **Configure Firebase:**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password), Firestore, and Storage
   - Update Firebase config in `frontend/src/firebase.ts`

3. **Run locally:**
   ```bash
   # Frontend
   cd frontend && npm run dev
   
   # Functions (optional, for local testing)
   cd functions && npm run serve
   ```

4. **Deploy:**
   ```bash
   firebase deploy
   ```

## Default Credentials

- **New User Password**: `TempPass123!` (must be changed on first login)

## Documentation

- [Frontend README](frontend/README.md)
- [Functions README](functions/README.md)
