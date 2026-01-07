# Repair Portal

A web application for managing repair requests with user authentication, admin management, and multi-language support.

## Features

### User Features
- **User Authentication**: Secure login system for users to submit repair requests
- **Repair Request Submission**: Submit detailed repair requests with descriptions and images
- **Password Management**: Forced password change on first login with strong password requirements
- **Multi-language Support**: Switch between English and Traditional Chinese (繁體中文)
- **Request Tracking**: Receive unique order numbers to track repair status

### Admin Features
- **User Management**: 
  - Add new users with default passwords
  - Edit user information
  - Suspend/activate user accounts
  - Reset user passwords
  - Delete users
  - View user login history
- **Repair Request Dashboard**: View and manage all repair requests
- **Status Management**: Mark repairs as pending, completed, or cancelled
- **Follow-up Actions**: Add notes and track progress on repairs
- **CSV Export**: Export repair data with date filters
- **Image Management**: View uploaded repair images

### Security Features
- Secure Firebase authentication
- Password strength validation
- Account status management (active/suspended)
- First-time login password reset
- Admin-initiated password resets
- Session management

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

3. Configure Admin Email:
   - Open `src/App.tsx`
   - Update `ADMIN_EMAIL` constant with your admin email:
   ```typescript
   const ADMIN_EMAIL = 'your-admin@email.com';
   ```

4. Run the development server:
```bash
npm run dev
```

## Firebase Setup

1. **Authentication**: 
   - Enable Email/Password authentication
   - Create admin account in Firebase Console

2. **Firestore Database**: Create collections:
   - `repairs`: Store repair requests
   - `users`: Store user accounts (created automatically by app)

3. **Storage**: Set up storage bucket for images

## Getting Started

### Admin Access
1. Create an admin account in Firebase Authentication with the email specified in `ADMIN_EMAIL`
2. Log in at the admin panel
3. Navigate to "User Management"
4. Add users who will submit repair requests

### User Access
1. Admin creates user account with email and display name
2. User receives login credentials (default password: `TempPass123!`)
3. User logs in and is prompted to change password
4. User can now submit repair requests

## Default Credentials

- **Default Password for New Users**: `TempPass123!`
- Users must change this on first login
- Admins can reset user passwords, which will require users to change them again

## Documentation

- [User Management Guide](USER_MANAGEMENT.md) - Comprehensive guide for managing users
- [Language Feature](LANGUAGE_FEATURE.md) - Multi-language implementation details
