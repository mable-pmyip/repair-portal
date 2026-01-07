# Setup Instructions for Repair Portal

## 1. Fix CORS Error

### Install Google Cloud SDK
```bash
brew install google-cloud-sdk
```

### Authenticate and Configure
```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project repair-portal-d9b17

# Apply CORS configuration (run from project root)
gcloud storage buckets update gs://repair-portal-d9b17.firebasestorage.app --cors-file=cors.json
```

### Alternative: Update Firebase Storage Rules
Go to [Firebase Console - Storage Rules](https://console.firebase.google.com/project/repair-portal-d9b17/storage/rules)

Replace with:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /repairs/{allPaths=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

## 2. Create Admin User

1. Go to [Firebase Console - Authentication](https://console.firebase.google.com/project/repair-portal-d9b17/authentication/users)
2. Click **Add User**
3. Enter email and password (example: `admin@repair-portal.com`)
4. Click **Add User**
5. Use these credentials to log into the Admin Panel

## 3. Firestore Database Rules

Go to [Firebase Console - Firestore Rules](https://console.firebase.google.com/project/repair-portal-d9b17/firestore/rules)

Update to:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read and write repairs (for demo)
    match /repairs/{repairId} {
      allow read, write: if true;
    }
    
    // For production, you'd want:
    // match /repairs/{repairId} {
    //   allow read: if request.auth != null;
    //   allow create: if true;  // Anyone can submit
    //   allow update, delete: if request.auth != null;
    // }
  }
}
```

## 4. Run the Application

```bash
npm install
npm run dev
```

Visit http://localhost:5173

## Troubleshooting

- **Still getting CORS errors?** Make sure the CORS configuration is applied and wait a few minutes
- **Can't log in?** Verify you created a user in Firebase Authentication
- **Database errors?** Check Firestore rules allow read/write access
