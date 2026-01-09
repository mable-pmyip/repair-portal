/**
 * Firebase Cloud Functions for user management
 */

import {onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

admin.initializeApp();

// Create user in Firebase Auth
export const createUser = onCall(async (request) => {
  // Verify caller is authenticated
  if (!request.auth) {
    throw new Error("unauthenticated: User must be authenticated");
  }

  const {username, password} = request.data;

  if (!username || !password) {
    throw new Error("invalid-argument: Missing username or password");
  }

  const email = `${username}@repairportal.com`;

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username,
    });

    logger.info(`User created: ${email}`);

    return {
      uid: userRecord.uid,
      email: userRecord.email,
    };
  } catch (error) {
    const err = error as {code?: string; message?: string};
    logger.error("Error creating user:", error);
    // Handle specific Firebase errors
    if (err.code === "auth/email-already-exists") {
      throw new Error(
        "already-exists: A user with this username already exists",
      );
    }
    throw new Error(`internal: ${err.message}`);
  }
});

// Delete user from Firebase Auth
export const deleteUser = onCall(async (request) => {
  // Verify caller is authenticated
  if (!request.auth) {
    throw new Error("unauthenticated: User must be authenticated");
  }

  const {uid} = request.data;

  if (!uid) {
    throw new Error("invalid-argument: Missing user ID");
  }

  try {
    await admin.auth().deleteUser(uid);
    logger.info(`User deleted: ${uid}`);
    return {success: true, message: "User deleted successfully"};
  } catch (error) {
    const err = error as {code?: string; message?: string};
    logger.error("Error deleting user:", error);
    if (err.code === "auth/user-not-found") {
      throw new Error("not-found: User not found");
    }
    throw new Error(`internal: ${err.message}`);
  }
});

