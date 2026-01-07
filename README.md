# Repair Portal

A web application for managing repair requests with user submission and admin management capabilities.

## Features

- **User Interface**: Submit repair requests with descriptions and image uploads
- **Admin Dashboard**: View and manage all repair requests
- **Authentication**: Secure admin login system
- **Status Tracking**: Mark repairs as completed
- **Image Upload**: Upload and view repair images
- **Multi-language Support**: Switch between English and Traditional Chinese (繁體中文)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase:
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Enable Storage
   - Copy your Firebase config to `src/firebase.ts`

3. Run the development server:
```bash
npm run dev
```

## Firebase Setup

1. **Authentication**: Enable Email/Password authentication
2. **Firestore Database**: Create collections:
   - `repairs`: Store repair requests
3. **Storage**: Set up storage bucket for images

## Admin Access

Create an admin user in Firebase Authentication and use those credentials to log in.
