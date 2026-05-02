import admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import { existsSync, readFileSync } from 'fs'

type ServiceAccountShape = {
  projectId: string
  clientEmail: string
  privateKey: string
}

function normalizeSecretInput(value: string) {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

function tryParseJson(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return null
  }
}

function toBase64(value: string) {
  // Accept base64url secrets from CI systems by normalizing to standard base64.
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '')
  const padding = normalized.length % 4
  if (padding === 0) return normalized
  return normalized + '='.repeat(4 - padding)
}

function parseServiceAccountKey(rawKey: string) {
  const input = normalizeSecretInput(rawKey)

  // Support plain JSON secrets (common in local/dev and some hosts).
  const jsonDirect = tryParseJson(input)
  if (jsonDirect) return jsonDirect

  // Support base64/base64url encoded JSON secrets.
  const decoded = Buffer.from(toBase64(input), 'base64').toString('utf8').trim()
  const jsonBase64 = tryParseJson(decoded)
  if (jsonBase64) return jsonBase64

  return null
}

function readServiceAccountFromPath(path: string) {
  try {
    const content = readFileSync(path, 'utf8')
    return tryParseJson(content)
  } catch {
    return null
  }
}

function parseServiceAccountFromEnvOrPath(value: string | undefined) {
  if (!value) return null
  const normalized = normalizeSecretInput(value)

  // Some platforms set GOOGLE_APPLICATION_CREDENTIALS as inline JSON.
  const inline = parseServiceAccountKey(normalized)
  if (inline) return inline

  return readServiceAccountFromPath(normalized)
}

function findDefaultServiceAccount() {
  const candidates = [
    '/app/espeezylearning-firebase-adminsdk-fbsvc-3b02e3eff9.json',
    '/opt/testingcodebase/espeezylearning-firebase-adminsdk-fbsvc-3b02e3eff9.json',
    './espeezylearning-firebase-adminsdk-fbsvc-3b02e3eff9.json',
  ]

  for (const path of candidates) {
    if (!existsSync(path)) continue
    const parsed = readServiceAccountFromPath(path)
    if (parsed) return parsed
  }

  return null
}

function normalizeServiceAccount(value: Record<string, unknown> | null): ServiceAccountShape | null {
  if (!value) return null

  const projectId = value.projectId ?? value.project_id
  const clientEmail = value.clientEmail ?? value.client_email
  const privateKeyRaw = value.privateKey ?? value.private_key

  if (typeof projectId !== 'string' || typeof clientEmail !== 'string' || typeof privateKeyRaw !== 'string') {
    return null
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, '\n'),
  }
}

function initAdmin() {
  if (admin.apps.length) return true;

  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  const explicitPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  const googleCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS

  try {
    let source = 'none'
    const fromKey = rawKey ? parseServiceAccountKey(rawKey) : null
    const fromExplicitPath = parseServiceAccountFromEnvOrPath(explicitPath)
    const fromGoogleCreds = parseServiceAccountFromEnvOrPath(googleCreds)
    const fromDefaultPath = findDefaultServiceAccount()

    const raw = fromKey || fromExplicitPath || fromGoogleCreds || fromDefaultPath
    if (fromKey) source = 'FIREBASE_SERVICE_ACCOUNT_KEY (env)'
    else if (fromExplicitPath) source = `FIREBASE_SERVICE_ACCOUNT_PATH (${explicitPath})`
    else if (fromGoogleCreds) source = `GOOGLE_APPLICATION_CREDENTIALS (${googleCreds})`
    else if (fromDefaultPath) source = 'default file path'

    const serviceAccount = normalizeServiceAccount(raw)

    if (!serviceAccount) {
      throw new Error(
        `Firebase Admin credentials are invalid (source: ${source}). ` +
        'Ensure FIREBASE_SERVICE_ACCOUNT_KEY contains a valid service account JSON (not an OAuth client key). ' +
        'Required fields: project_id, client_email, private_key.'
      )
    }

    console.log(`[firebase-admin] Initializing with credentials from: ${source} (project: ${serviceAccount.projectId})`)

    const appConfig: admin.AppOptions = {
      credential: admin.credential.cert(serviceAccount),
    }
    if (process.env.FIREBASE_DATABASE_URL) {
      appConfig.databaseURL = process.env.FIREBASE_DATABASE_URL
    }
    if (process.env.FIREBASE_STORAGE_BUCKET) {
      appConfig.storageBucket = process.env.FIREBASE_STORAGE_BUCKET
    }

    admin.initializeApp(appConfig)
    return true;
  } catch (error) {
    console.error('[firebase-admin] Initialization error:', error);
    return false;
  }
}

function getConfiguredFirestoreDatabaseId() {
  const candidates = [process.env.FIREBASE_DATABASE_ID, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID]

  for (const candidate of candidates) {
    const normalized = candidate?.trim()
    if (!normalized || normalized === '(default)') continue
    return normalized
  }

  return null
}

export const getAdminDb = () => {
  if (!initAdmin()) return null
  const app = admin.app()
  const databaseId = getConfiguredFirestoreDatabaseId()
  return databaseId ? getFirestore(app, databaseId) : getFirestore(app)
}

export const getAdminAuth = () => {
  if (!initAdmin()) return null
  return admin.auth()
}

export const getAdminStorage = () => {
  if (!initAdmin()) return null
  return admin.storage()
}

export default admin
