import { createCipheriv, createDecipheriv, createHmac } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

/**
 * Get the 32-byte encryption key from the LINK_SECRET env var (64 hex chars).
 */
function getKey(): Buffer {
  const secret = process.env.LINK_SECRET;
  if (!secret || secret.length < 64) {
    throw new Error("LINK_SECRET must be a 64-character hex string (32 bytes)");
  }
  return Buffer.from(secret, "hex");
}

/**
 * Derive a deterministic 12-byte IV from the guest ID using HMAC-SHA256.
 * This ensures the same guest UUID always produces the same encrypted code.
 */
function deriveIV(guestId: string): Buffer {
  const secret = process.env.LINK_SECRET!;
  const hmac = createHmac("sha256", secret);
  hmac.update(guestId);
  return hmac.digest().subarray(0, IV_LENGTH);
}

/**
 * Encode a buffer to URL-safe base64 (no padding).
 */
function toBase64Url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decode a URL-safe base64 string back to a Buffer.
 */
function fromBase64Url(str: string): Buffer {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding
  const pad = 4 - (b64.length % 4);
  if (pad < 4) b64 += "=".repeat(pad);
  return Buffer.from(b64, "base64");
}

/**
 * Encrypt a guest UUID into a URL-safe, deterministic encrypted code.
 *
 * Output format: base64url( IV[12] || authTag[16] || ciphertext )
 */
export function encryptGuestId(id: string): string {
  const key = getKey();
  const iv = deriveIV(id);

  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(id, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Concatenate: IV + authTag + ciphertext
  const payload = Buffer.concat([iv, authTag, encrypted]);
  return toBase64Url(payload);
}

/**
 * Decrypt an encrypted invite code back to a guest UUID.
 * Returns null on any failure (malformed, tampered, wrong key) — never throws.
 */
export function decryptGuestId(code: string): string | null {
  try {
    const key = getKey();
    const payload = fromBase64Url(code);

    // Minimum length: IV(12) + authTag(16) + at least 1 byte of ciphertext
    if (payload.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
      return null;
    }

    const iv = payload.subarray(0, IV_LENGTH);
    const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    // GCM auth tag verification failure, malformed base64, etc.
    return null;
  }
}
