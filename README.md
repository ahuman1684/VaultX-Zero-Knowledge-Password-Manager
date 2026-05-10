<div align="center">

# 🔐 VaultX

### Zero-Knowledge, End-to-End Encrypted Password Manager

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://github.com/WiseLibs/better-sqlite3)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Your master password never leaves your browser. Your passwords are encrypted before they ever touch the server.**

[Features](#-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [Security Model](#-security-model) • [API Reference](#-api-reference)

</div>

---

## ✨ Features

| | Feature | Details |
|---|---|---|
| 🔑 | **Auth** | JWT access tokens (15m) + refresh tokens (7d), bcrypt with 12 salt rounds |
| 🔒 | **E2E Encryption** | AES-256-GCM — all encryption runs client-side via the Web Crypto API |
| 🧪 | **Key Derivation** | PBKDF2-SHA256 with 100,000 iterations — vault key never sent to server |
| ⚡ | **Password Generator** | Cryptographically secure (`crypto.getRandomValues`), 8–64 chars, configurable charsets |
| 📊 | **Strength Meter** | Real entropy calculation in bits (`H = L × log₂N`), not naive regex rules |
| 🛡️ | **Breach Detection** | HaveIBeenPwned k-Anonymity — only a 5-char SHA-1 prefix ever leaves the browser |
| 📋 | **Clipboard Safety** | Auto-clears clipboard after 30 seconds |
| 👁️ | **Auto-hide** | Revealed passwords auto-hide after 10 seconds with countdown |
| 🔍 | **Search** | Real-time client-side filter by site name or username |
| 💀 | **Auto-logout** | In-memory tokens cleared on tab close; vault key never persisted |

---

## 🏗️ Architecture

The core principle: **the server is a dumb encrypted-blob store.** It has no decryption capability whatsoever.

```
┌──────────────────────────────────────────────────────────────────┐
│  BROWSER                                                         │
│                                                                  │
│  masterPassword ──► PBKDF2(username, 100k iters) ──► vaultKey   │
│                                          │                       │
│                         AES-256-GCM(vaultKey, randomIV)         │
│                                          │                       │
│                    base64(IV + ciphertext + authTag)             │
│                                          │                       │
└──────────────────────────────── POST /api/vault ─────────────────┘
                                           │
┌──────────────────────────────────────────▼───────────────────────┐
│  SERVER (Express + SQLite)                                        │
│                                                                  │
│  Stores encrypted blob — zero knowledge of plaintext passwords   │
│  JWT middleware enforces ownership on every operation            │
└──────────────────────────────────────────────────────────────────┘
```

### Encryption Flow

1. User logs in → browser derives `vaultKey = PBKDF2(masterPassword, username)`
2. `vaultKey` stored only in React context (memory) — never serialized or sent
3. **Save:** `encryptPassword(vaultKey, plain)` → `base64(12B IV + ciphertext + 16B auth tag)` → server
4. **Reveal:** fetch encrypted blob → `decryptPassword(vaultKey, blob)` → display for 10s → auto-hide

---

## 📁 Project Structure

```
vaultx/
├── backend/
│   ├── index.js              # Express app, CORS, middleware wiring
│   ├── db.js                 # SQLite init, schema, WAL mode
│   ├── routes/
│   │   ├── auth.js           # Register, login, refresh, logout
│   │   ├── vault.js          # CRUD for password entries (all protected)
│   │   └── tools.js          # HIBP breach-check proxy
│   └── middleware/
│       └── auth.js           # JWT verification → req.userId
│
└── frontend/
    └── src/
        ├── crypto.js          # deriveKey, encrypt/decrypt, generatePassword, checkBreach
        ├── api/
        │   └── client.js      # Axios instance with silent token-refresh interceptor
        ├── context/
        │   ├── AuthContext.jsx # Auth state + vaultKey lifecycle
        │   └── ToastContext.jsx
        ├── hooks/
        │   └── useVault.js     # Vault CRUD with encrypt/decrypt wrappers
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   └── Vault.jsx
        └── components/
            ├── PasswordCard.jsx       # Reveal / copy / countdown timers
            ├── AddPasswordModal.jsx   # Add & edit with inline generator
            ├── PasswordGenerator.jsx  # Length slider, charset toggles, live preview
            ├── StrengthMeter.jsx      # Animated entropy bar
            └── BreachChecker.jsx      # HIBP k-Anonymity check
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js **18+**
- npm

### 1. Clone the repo

```bash
git clone https://github.com/ahuman1684/vaultx.git
cd vaultx
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
ACCESS_JWT_SECRET=your_access_secret_here_min_32_chars
REFRESH_JWT_SECRET=your_refresh_secret_here_min_32_chars
DB_PATH=./vaultx.db
```

> ⚠️ Generate strong secrets in production: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Start the server:

```bash
npm start          # production
npm run dev        # hot-reload with nodemon
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Start the dev server:

```bash
npm run dev
```

### 4. Open the app

```
http://localhost:5173
```

The SQLite database (`vaultx.db`) is created automatically on first backend start — no setup needed.

---

## 🔐 Security Model

### What the server knows

| Data | Stored? |
|------|---------|
| Username | ✅ Plaintext |
| Master password | ❌ bcrypt hash only |
| Site names | ✅ Plaintext (metadata) |
| Entry usernames | ✅ Plaintext (metadata) |
| **Passwords** | ❌ **AES-256 encrypted blobs only** |
| Vault encryption key | ❌ **Never — derived client-side** |

### Security guarantees

- **Master password** — hashed with bcrypt (12 rounds) server-side; never stored in plaintext
- **Vault key** — derived via PBKDF2 in the browser; lives only in React state; gone on tab close
- **Plaintext passwords** — encrypted before leaving the browser; server has no decryption capability
- **Access tokens** — stored in `window` memory only; cleared on `beforeunload`
- **AES-GCM auth tag** — detects any ciphertext tampering; decryption throws on modification
- **HIBP breach check** — only a 5-character SHA-1 prefix is transmitted; full hash never leaves browser

### Why AES-GCM over AES-CBC?

AES-GCM is an **AEAD** (Authenticated Encryption with Associated Data) cipher — it simultaneously encrypts and authenticates. AES-CBC provides no integrity protection, making it vulnerable to bit-flip and padding oracle attacks without a separate MAC. AES-GCM's 128-bit authentication tag detects any tampering.

### Why PBKDF2 for key derivation?

PBKDF2 with 100,000 iterations means an attacker who steals the encrypted database must run 100k hash operations per password guess — reducing brute-force throughput from billions/sec (plain SHA-256) to ~10,000/sec.

---

## 📡 API Reference

All `/vault` and `/tools` routes require `Authorization: Bearer <accessToken>`.

### Auth

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | `{ username, masterPassword }` | Create account |
| `POST` | `/api/auth/login` | `{ username, masterPassword }` | Login → returns tokens |
| `POST` | `/api/auth/refresh` | `{ refreshToken }` | Issue new access token |
| `POST` | `/api/auth/logout` | — | Stateless (client clears tokens) |

### Vault

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/vault` | — | Fetch all entries for authenticated user |
| `POST` | `/api/vault` | `{ site, username, encryptedPassword }` | Create entry |
| `PUT` | `/api/vault/:id` | `{ site, username, encryptedPassword }` | Update entry (ownership verified) |
| `DELETE` | `/api/vault/:id` | — | Delete entry (ownership verified) |

### Tools

| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/tools/breach-check` | `?prefix=XXXXX` | Proxy HIBP range lookup |

---

## 🗄️ Database Schema

```sql
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE passwords (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id            INTEGER NOT NULL,
  site               TEXT NOT NULL,
  username           TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,          -- base64(IV + ciphertext + auth_tag)
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + Vite | Component model ideal for complex per-card state (timers, reveal, copy) |
| Styling | TailwindCSS 3 | Utility-first, dark theme, zero runtime overhead |
| HTTP Client | Axios | Interceptor API for silent token refresh |
| Backend | Node.js + Express | Non-blocking I/O, simple middleware chaining |
| Database | SQLite (better-sqlite3) | Synchronous API, zero config, ACID-compliant, WAL mode |
| Auth | JWT (jsonwebtoken) | Stateless, scalable, dual-token pattern |
| Password Hash | bcryptjs | Purpose-built slow hashing with built-in salt |
| Crypto | Web Crypto API | Native browser implementation, non-extractable CryptoKey objects |

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

```bash
# Fork the repo, then:
git checkout -b feature/your-feature
git commit -m "feat: add your feature"
git push origin feature/your-feature
# Open a pull request
```

---

## 📄 License

[MIT](LICENSE) © Kartik Thalore

---

<div align="center">

**If you found this useful, drop a ⭐ — it helps!**

</div>
