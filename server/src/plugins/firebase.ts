import { applicationDefault, cert, getApp, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import type { FastifyReply, FastifyRequest } from "fastify";
import { readFile } from "node:fs/promises";

declare module "fastify" {
  interface FastifyRequest {
    firebaseUser: DecodedIdToken | null;
  }
}

export async function initializeFirebase(): Promise<void> {
  if (getApps().length > 0) return;

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (serviceAccountPath) {
    const serviceAccount = JSON.parse(await readFile(serviceAccountPath, "utf8")) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };
    initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      } satisfies ServiceAccount),
    });
    return;
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp({ credential: applicationDefault() });
  }
}

export async function requireFirebaseUser(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (getApps().length === 0) {
    await reply.code(503).send({ error: "Firebase authentication is not configured." });
    return;
  }

  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    await reply.code(401).send({ error: "A Firebase ID token is required." });
    return;
  }

  try {
    request.firebaseUser = await getAuth(getApp()).verifyIdToken(authorization.slice(7));
  } catch {
    await reply.code(401).send({ error: "The Firebase ID token is invalid or expired." });
  }
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await requireFirebaseUser(request, reply);
  if (reply.sent) return;
  if (request.firebaseUser?.admin !== true) {
    await reply.code(403).send({ error: "Administrator access is required." });
  }
}
