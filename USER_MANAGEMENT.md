# User Management & Authentication System

## Overview
The Repair Portal now includes a comprehensive user management system with secure authentication, password management, and user permissions.

## Key Features

### 1. **Admin User Management**
- Add new users with default password
- Edit user information (display name)
- Suspend/activate user accounts
- Reset user passwords (forces password change on next login)
- Delete users
- View user login history and status

### 2. **User Authentication**
- Users must log in before submitting repair requests
- Secure password-based authentication
- Account status validation (suspended accounts cannot log in)
- Session management with automatic logout

### 3. **Password Security**
- **First-time login**: Users with default password must change it immediately
- **Admin password reset**: When admin resets a password, user must change it on next login
- **Strong password requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (!@#$%^&*)

### 4. **User States**
- **Active**: User can log in and submit requests
- **Suspended**: User account is disabled, cannot log in
- **First Login**: User must change password before accessing the system

## Configuration

### Admin Account
The admin email is configured in [frontend/src/App.tsx](frontend/src/App.tsx):
```typescript
const ADMIN_EMAIL = 'admin@repairportal.com';
```
Update this to your admin email address.

### Default Password
Default password for new users is defined in [frontend/src/types.ts](frontend/src/types.ts):
```typescript
export const DEFAULT_PASSWORD = 'TempPass123!';
```

## Usage Guide

### For Administrators

#### Adding a New User
1. Click "User Management" in the navigation bar
2. Click "Add User" button
3. Enter user's email and display name
4. User is created with default password: `TempPass123!`
5. Share login credentials with the user
6. User will be required to change password on first login

#### Managing Users
- **Edit**: Update user's display name
- **Suspend/Activate**: Toggle user account status
- **Reset Password**: Reset user password to default (user must change on next login)
- **Delete**: Permanently remove user (cannot be undone)

#### Viewing User Information
The user table shows:
- Display name
- Email address
- Account status (Active/Suspended)
- First login status (Yes/No)
- Date created
- Last login timestamp

### For Users

#### First Time Login
1. Receive email and default password from administrator
2. Navigate to the repair portal
3. Click "Submit Request" (will show login form)
4. Enter email and default password
5. **Password Reset Modal appears automatically**
6. Create a new strong password following the requirements
7. Submit new password
8. Access granted to repair form

#### Submitting Repair Requests
Once logged in:
- Your name is automatically filled in the form
- Location and description fields are required
- Can optionally upload images
- Submit request to receive tracking number
- Can submit multiple requests while logged in

#### If Password is Reset by Admin
1. Attempt to log in with current password
2. Password reset modal appears
3. Create new password
4. Continue to repair form

## File Structure

### New Files Created
```
frontend/src/
├── components/
│   ├── UserManagement.tsx       # Admin UI for managing users
│   ├── UserLogin.tsx            # User login form
│   └── PasswordReset.tsx        # Password reset modal
└── types.ts                      # Updated with PortalUser interface
```

### Modified Files
```
frontend/src/
├── App.tsx                       # Updated authentication flow
├── App.css                       # Added styles for new components
├── components/
│   └── RepairForm.tsx           # Now requires user prop
└── translations.json            # Added translations for new features
```

## Database Structure

### Users Collection (`users`)
```typescript
{
  uid: string;              // Firebase Auth UID
  email: string;            // User email
  displayName: string;      // User's full name
  status: 'active' | 'suspended';
  isFirstLogin: boolean;    // true if password change required
  createdAt: Timestamp;     // Account creation date
  createdBy: string;        // Admin who created the account
  lastLogin?: Timestamp;    // Last successful login
}
```

### Enhanced Repairs Collection
Repair requests now include user information:
```typescript
{
  // ... existing fields
  submitterName: string;    // Auto-filled from user profile
  submitterEmail: string;   // User's email
  submitterUid: string;     // User's Firebase Auth UID
}
```

## Security Features

1. **Firebase Authentication**: Uses Firebase Auth for secure user management
2. **Password Validation**: Client-side and server-side password validation
3. **Account Status**: Suspended accounts cannot authenticate
4. **Forced Password Change**: First-time users must set their own password
5. **Session Management**: Automatic logout on inactivity
6. **Admin Separation**: Admin login is separate from user login

## Multi-Language Support

All new features support both English and Traditional Chinese:
- User management interface
- Login forms
- Password reset modal
- Error messages and validation
- Success notifications

## Translations Keys

### User Management
- `userManagement.*` - All user management UI text
- Fields, actions, status labels, confirmation dialogs

### User Login
- `userLogin.*` - Login form and error messages
- Help text and validation messages

### Password Reset
- `passwordReset.*` - Password reset modal
- Requirements, validation, error messages

## Admin Workflow Example

1. **Create User Account**
   ```
   Admin → User Management → Add User
   Email: john.doe@company.com
   Name: John Doe
   → User created with default password
   ```

2. **Share Credentials**
   ```
   Email to user:
   Login: john.doe@company.com
   Password: TempPass123!
   Note: You will be required to change your password on first login
   ```

3. **User First Login**
   ```
   User logs in → Password reset required → Sets new password → Access granted
   ```

4. **If User Forgets Password**
   ```
   Admin → User Management → Find user → Reset Password
   → User receives notification to change password on next login
   ```

## Troubleshooting

### User Cannot Login
- Check if account is suspended
- Verify email is correct
- Ensure user is in the `users` collection in Firestore
- Check Firebase Authentication for the user account

### Password Reset Not Working
- Ensure user is logged in when resetting
- Check browser console for errors
- Verify Firestore rules allow updates to users collection

### Admin Cannot Add Users
- Check Firebase Admin permissions
- Verify `createUserWithEmailAndPassword` is enabled in Firebase
- Check browser console for specific error messages

## Best Practices

1. **User Creation**: Always inform users of their default password
2. **Password Reset**: Use this feature instead of deleting and recreating accounts
3. **Account Suspension**: Use suspension instead of deletion for temporary access removal
4. **Regular Audits**: Review user list and last login dates regularly
5. **Security**: Change default password if needed for your organization

## Future Enhancements

Potential improvements:
- Email notifications for new accounts
- Password reset via email link
- User roles and permissions
- Bulk user import
- User activity logs
- Two-factor authentication
- Self-service password reset

## Support

For issues or questions:
1. Check Firebase console for authentication errors
2. Review browser console for client-side errors
3. Verify Firestore security rules
4. Check user permissions in Firebase Authentication
