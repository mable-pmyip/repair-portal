# Repair Portal Backend API

This Express server provides a backend API for user management operations that require Firebase Admin SDK privileges.

## Why This Server Exists

### The Problem
When using Firebase's client SDK method `createUserWithEmailAndPassword()` to create new users, Firebase automatically signs in as the newly created user. This caused a critical UX issue:

1. Admin creates a new user via User Management
2. Firebase Auth automatically signs in as that new user
3. Since the new user has `isFirstLogin: true`, the app triggers the password reset modal
4. Admin gets logged out and redirected to password reset page

**Result**: Admins couldn't create users without being logged out.

### The Solution
Firebase Admin SDK allows creating users **without affecting the current authentication session**. By moving user creation to a backend server with Admin SDK:

✅ Admin stays logged in  
✅ New users are created in Firebase Auth  
✅ Users are added to Firestore  
✅ No session interference  

## What This Server Does

### Primary Function
Provides an API endpoint for creating Firebase users without disrupting the admin's session.

### Endpoints

#### `POST /api/create-user`
Creates a new user in Firebase Authentication and Firestore.

**Request:**
```json
{
  "username": "John Doe",
  "department": "IT",
  "password": "TempPass123!",
  "createdBy": "admin@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "uid": "firebase-uid-here",
  "email": "johndoe@repairportal.com"
}
```

#### `DELETE /api/delete-user/:uid`
Deletes a user from Firebase Authentication (bonus feature).

#### `GET /api/health`
Health check endpoint to verify server is running.

## Technical Details

### Stack
- **Express.js**: Web framework
- **Firebase Admin SDK**: Server-side Firebase operations
- **CORS**: Cross-origin resource sharing
- **dotenv**: Environment variable management

### How It Works

```
Frontend (React)                Backend (Express + Admin SDK)
─────────────────              ──────────────────────────────

Admin clicks                   
"Add User"                     
     │                         
     ├─→ POST /api/create-user
     │                              │
     │                              ├─→ admin.auth().createUser()
     │                              │   (creates user WITHOUT signing in)
     │                              │
     │                              ├─→ db.collection('users').add()
     │                              │   (adds user to Firestore)
     │                              │
     │   ←─ Success response   ←────┘
     │
Admin stays logged in ✓
```

### Client SDK vs Admin SDK

| Feature | Client SDK | Admin SDK |
|---------|-----------|-----------|
| Create user | ✅ Yes | ✅ Yes |
| Auto sign-in | ❌ Always signs in | ✅ No sign-in |
| Requires backend | ❌ No | ✅ Yes |
| Admin privileges | ❌ No | ✅ Yes |

## Setup & Usage

See [SERVER_SETUP.md](../SERVER_SETUP.md) in the project root for detailed setup instructions.

**Quick start:**
```bash
# Install dependencies
npm install

# Add serviceAccountKey.json (download from Firebase Console)
# See SERVER_SETUP.md for instructions

# Run development server
npm run dev

# Run production server
npm start
```

## Security

🔒 **Service Account Key Protection**
- The `serviceAccountKey.json` file contains admin credentials
- Never commit this file to version control (already in .gitignore)
- Keep it secure and private

🔒 **API Security Considerations**
- Currently allows any request (for internal use)
- For production, consider adding:
  - Authentication/authorization middleware
  - Rate limiting
  - Request validation
  - CORS restrictions to your domain only

## Development

The server runs on **port 3001** by default (configurable in `.env`).

The frontend Vite dev server automatically proxies `/api/*` requests to this backend (configured in `vite.config.ts`).

## Deployment

When deploying to production:

1. **Backend**: Deploy to Railway, Render, or Fly.io
2. **Frontend**: Update API URL to production backend URL
3. **Security**: Add environment variables instead of `serviceAccountKey.json` file

See [SERVER_SETUP.md](../SERVER_SETUP.md) for deployment details.

## Alternative Approaches Considered

### 1. Custom Auth (Firestore only)
- Store hashed passwords in Firestore
- Manual authentication logic
- ❌ Loses Firebase Auth features (rate limiting, security)

### 2. Firebase Cloud Functions
- Serverless alternative to Express
- ✅ Could work, requires Firebase Blaze plan
- More complex setup for this use case

### 3. Accept the logout behavior
- Admin logs back in after creating users
- ❌ Poor UX

**Chosen solution**: Express + Admin SDK provides the best balance of simplicity, security, and user experience.

## Troubleshooting

### Server won't start
- Ensure `serviceAccountKey.json` exists in this directory
- Check Node.js version (v18+ recommended)
- Verify port 3001 is available

### "ENOENT: no such file or directory, open './serviceAccountKey.json'"
- Download service account key from Firebase Console
- Save as `serviceAccountKey.json` in the `server/` directory

### Frontend can't reach backend
- Ensure backend is running on port 3001
- Check Vite proxy configuration in `vite.config.ts`
- Try accessing `http://localhost:3001/api/health` directly

## Dependencies

```json
{
  "express": "^4.18.2",        // Web framework
  "cors": "^2.8.5",            // CORS middleware
  "dotenv": "^16.3.1",         // Environment variables
  "firebase-admin": "^12.0.0"  // Firebase Admin SDK
}
```

## License

Part of the Repair Portal project.
