// lib/crypto.ts
import crypto from "crypto";

export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex"); // token visible en URL
}

export function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex"); // guardamos hash
}
