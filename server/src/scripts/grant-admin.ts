import "dotenv/config";
import { getApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { initializeFirebase } from "../plugins/firebase.js";

const uid = process.argv[2]?.trim();
if (!uid) {
  throw new Error("Usage: npm run auth:grant-admin -- <firebase-user-uid>");
}

await initializeFirebase();
if (getApps().length === 0) {
  throw new Error("Configure Firebase Admin credentials before granting admin access.");
}

const auth = getAuth(getApp());
const user = await auth.getUser(uid);
await auth.setCustomUserClaims(uid, { ...user.customClaims, admin: true });
console.log(`Administrator claim granted to Firebase user ${uid}.`);
