import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/** Hash a plaintext password. Passwords are never stored in plaintext. */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Compare a plaintext password against a stored hash. */
export function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
