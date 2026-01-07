import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(
  readFileSync('./serviceAccountKey.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Repair Portal API is running' });
});

// Create user endpoint
app.post('/api/create-user', async (req, res) => {
  try {
    const { username, department, password, createdBy } = req.body;

    // Validate input
    if (!username || !department || !password) {
      return res.status(400).json({
        error: 'Missing required fields: username, department, or password',
      });
    }

    // Generate email from username
    // Remove all characters except letters, numbers, dots, and hyphens
    // This handles special characters from mobile keyboards (apostrophes, unicode, etc.)
    const sanitizedUsername = username
      .toLowerCase()
      .normalize('NFD') // Decompose unicode characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (accents)
      .replace(/[^a-z0-9.-]/g, '') // Keep only letters, numbers, dots, hyphens
      .replace(/^[.-]+|[.-]+$/g, '') // Remove leading/trailing dots and hyphens
      .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
      .slice(0, 64); // Email local part max length
    
    const email = `${sanitizedUsername}@repairportal.com`;

    // Create user in Firebase Auth using Admin SDK
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: username,
    });

    // Add user to Firestore
    await db.collection('users').add({
      uid: userRecord.uid,
      email: email,
      username: username,
      department: department,
      status: 'active',
      isFirstLogin: true,
      createdAt: admin.firestore.Timestamp.now(),
      createdBy: createdBy || 'admin',
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      uid: userRecord.uid,
      email: email,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({
        error: 'A user with this username already exists',
      });
    }
    
    res.status(500).json({
      error: 'Failed to create user',
      details: error.message,
    });
  }
});

// Delete user endpoint (bonus: also delete from Auth)
app.delete('/api/delete-user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    // Delete from Firebase Auth
    await admin.auth().deleteUser(uid);

    res.json({
      success: true,
      message: 'User deleted from Authentication',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Repair Portal API server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});
