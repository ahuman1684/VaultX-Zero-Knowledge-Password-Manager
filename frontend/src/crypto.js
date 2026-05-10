/**
 * Derives a 256-bit vault encryption key from the master password using PBKDF2.
 * The key never leaves the browser.
 */
export async function deriveKey(masterPassword, username) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(username),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns base64(iv + ciphertext).
 */
export async function encryptPassword(key, plaintext) {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts base64(iv + ciphertext) using AES-256-GCM.
 */
export async function decryptPassword(key, base64) {
  const combined = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plainBuffer);
}

/**
 * Cryptographically secure random integer in [0, max).
 */
export function cryptoRandInt(max) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

/**
 * Generates a random password using Web Crypto API.
 */
export function generatePassword({ length = 16, uppercase = true, lowercase = true, numbers = true, symbols = true }) {
  const charsets = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  };

  const flags = { lowercase, uppercase, numbers, symbols };
  let pool = '';
  const guaranteed = [];

  for (const [key, chars] of Object.entries(charsets)) {
    if (flags[key]) {
      pool += chars;
      guaranteed.push(chars[cryptoRandInt(chars.length)]);
    }
  }

  if (!pool) return '';

  const remaining = Array.from(
    { length: Math.max(0, length - guaranteed.length) },
    () => pool[cryptoRandInt(pool.length)]
  );

  const all = [...guaranteed, ...remaining];
  // Fisher-Yates shuffle with crypto random
  for (let i = all.length - 1; i > 0; i--) {
    const j = cryptoRandInt(i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }

  return all.join('');
}

/**
 * Calculates password entropy in bits.
 */
export function calculateEntropy(password) {
  if (!password) return 0;
  const charsets = [
    { regex: /[a-z]/, size: 26 },
    { regex: /[A-Z]/, size: 26 },
    { regex: /[0-9]/, size: 10 },
    { regex: /[^a-zA-Z0-9]/, size: 32 },
  ];
  const poolSize = charsets.reduce((acc, c) => acc + (c.regex.test(password) ? c.size : 0), 0);
  return password.length * Math.log2(poolSize || 1);
}

export function entropyToStrength(bits) {
  if (bits < 28) return { label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-400', pct: 10 };
  if (bits < 36) return { label: 'Weak', color: 'bg-orange-500', textColor: 'text-orange-400', pct: 28 };
  if (bits < 60) return { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-400', pct: 52 };
  if (bits < 128) return { label: 'Strong', color: 'bg-green-500', textColor: 'text-green-400', pct: 78 };
  return { label: 'Very Strong', color: 'bg-teal-500', textColor: 'text-teal-400', pct: 100 };
}

/**
 * Checks a password against the HaveIBeenPwned k-Anonymity API (via backend proxy).
 */
export async function checkBreach(plaintextPassword) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintextPassword);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  const prefix = hashHex.slice(0, 5);
  const suffix = hashHex.slice(5);

  const response = await fetch(`/api/tools/breach-check?prefix=${prefix}`, {
    headers: { Authorization: `Bearer ${window.__vaultAccessToken || ''}` },
  });

  if (!response.ok) throw new Error('Breach check failed');

  const text = await response.text();
  const lines = text.split('\n');
  const match = lines.find((line) => line.trimStart().startsWith(suffix));

  if (match) {
    const count = parseInt(match.split(':')[1], 10);
    return { breached: true, count };
  }
  return { breached: false, count: 0 };
}

export async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
  setTimeout(async () => {
    try {
      const current = await navigator.clipboard.readText();
      if (current === text) await navigator.clipboard.writeText('');
    } catch {
      // Clipboard read may be denied — silently ignore
    }
  }, 30000);
}
