# Backend Server Setup Guide

This guide will help you set up the Express backend server with Firebase Admin SDK.

## Prerequisites

- Node.js installed (v18 or higher recommended)
- Firebase project with Admin SDK access

---

## Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the **gear icon** ⚙️ next to "Project Overview" → **Project settings**
4. Navigate to the **"Service accounts"** tab
5. Click **"Generate new private key"**
6. Click **"Generate key"** in the confirmation dialog
7. A JSON file will be downloaded (e.g., `your-project-firebase-adminsdk-xxxxx.json`)

---

## Step 2: Setup the Backend

1. **Rename the downloaded file** to `serviceAccountKey.json`

2. **Move it to the `server/` directory**:
   ```
   repair-portal/
   ├── server/
   │   ├── serviceAccountKey.json  ← Place it here
   │   ├── server.js
   │   ├── package.json
   │   └── .env
   ```

3. **Install dependencies**:
   ```bash
   cd server
   npm install
   ```

---

## Step 3: Run the Backend

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on **http://localhost:3001**

You should see:
```
🚀 Repair Portal API server running on http://localhost:3001
📡 Health check: http://localhost:3001/api/health
```

---

## Step 4: Run the Frontend

In a **separate terminal**, navigate to the project root and run:

```bash
npm run dev
```

The frontend will run on **http://localhost:5173** and automatically proxy API calls to the backend.

---

## Testing the Setup

1. Open your browser to http://localhost:5173
2. Log in as admin
3. Go to **User Management**
4. Try adding a new user
5. You should stay logged in (no redirect to password reset)

---

## API Endpoints

### Health Check
```
GET http://localhost:3001/api/health
```

### Create User
```
POST http://localhost:3001/api/create-user
Content-Type: application/json

{
  "username": "JohnDoe",
  "department": "IT",
  "password": "Welcome123!",
  "createdBy": "admin@example.com"
}
```

### Delete User (from Auth)
```
DELETE http://localhost:3001/api/delete-user/:uid
```

---

## Important Security Notes

⚠️ **NEVER commit `serviceAccountKey.json` to version control**

The file is already ignored in `.gitignore`, but double-check before pushing code.

---

## Deployment

### Backend Deployment Options:

1. **Railway** (Recommended - Free tier available)
   - Connect your GitHub repo
   - Set root directory to `server/`
   - Add `serviceAccountKey.json` content as environment variable `GOOGLE_APPLICATION_CREDENTIALS`

2. **Render** (Free tier available)
   - Deploy as a Web Service
   - Set root directory to `server/`
   - Add service account as secret file

3. **Fly.io** (Free tier available)
   - Use `fly launch` in the `server/` directory
   - Add secrets with `fly secrets set`

### Frontend Deployment:

Update the API URL in production:
- Create a `.env` file in the frontend root
- Add: `VITE_API_URL=https://your-backend-url.com`
- Update UserManagement.tsx to use `import.meta.env.VITE_API_URL`

---

## Troubleshooting

### Error: "Cannot find module './serviceAccountKey.json'"
- Make sure the file is in the `server/` directory
- Check the filename is exactly `serviceAccountKey.json`

### Error: "EADDRINUSE: address already in use"
- Port 3001 is already in use
- Change the port in `server/.env`: `PORT=3002`

### Frontend can't reach backend
- Make sure both servers are running
- Check Vite proxy configuration in `vite.config.ts`
- Try accessing http://localhost:3001/api/health directly

---

## Development Workflow

### Daily Development:
1. Open 2 terminals
2. Terminal 1: `cd server && npm run dev`
3. Terminal 2: `npm run dev` (in project root)
4. Both servers will auto-reload on file changes

---

## What Changed?

✅ **Before**: `createUserWithEmailAndPassword` auto-logged you in as the new user  
✅ **After**: Backend API creates users without affecting your admin session

Now you can create users without being logged out! 🎉
