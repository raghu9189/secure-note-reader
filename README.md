# 🔐 Secure Note Reader

A **zero-knowledge encrypted note-sharing application** built with Node.js and vanilla JavaScript. All encryption happens in the browser - the server only stores encrypted data.

**Monolithic Architecture** - Single server serves both frontend and API with **ZERO dependencies**!

![Architecture](https://mcndt.dev/media/posts/noteshare-architecture.png)

## 🔒 Key Security Features

- ✅ **Client-side encryption only** - All encryption happens in your browser
- ✅ **Zero-knowledge architecture** - Server never sees your password or plaintext
- ✅ **AES-256-CBC encryption** - Military-grade encryption
- ✅ **PBKDF2 key derivation** - 100,000 iterations for password hardening
- ✅ **Random IV and salt** - Each note has unique encryption parameters
- ✅ **No external dependencies** - Uses native Node.js and Web Crypto API

## 📁 Project Structure

```
secure-note-reader/
├── server.js           # Monolithic server (API + static file serving)
├── index.html          # Web interface
├── public-app.js       # Frontend application logic
├── crypto.js           # Encryption/decryption functions
├── db.json             # JSON database (auto-created)
├── package.json        # No dependencies!
└── README.md
```

## 🚀 Quick Start

### 1️⃣ No Installation Needed!

No `npm install` required - **zero dependencies!**

### 2️⃣ Start the Server

```bash
node server.js
```

Server will run on `http://localhost:3003`

### 3️⃣ Open in Browser

Navigate to: **http://localhost:3003**

That's it! The server serves both the frontend and API endpoints.

## 📖 How to Use

### Creating a Note

1. Write your secret message in the text area
2. Enter a strong password (min 8 characters)
3. Click "Encrypt & Save"
4. Copy the Note ID - you'll need it to read the note!

### Reading a Note

1. Paste the Note ID
2. Enter the correct password
3. Click "Decrypt & Read"
4. If the password is correct, you'll see the decrypted note

## 🔐 How It Works

### Encryption Flow

```
User writes note → Browser encrypts with AES-256-GCM → 
Encrypted data sent to server → Server stores encrypted data → 
Returns Note ID
```

### Decryption Flow

```
User provides Note ID + Password → Fetch encrypted data from server → 
Browser decrypts with password → Display plaintext note
```

### Technical Details

- **Algorithm**: AES-256-GCM (Authenticated Encryption)
- **Key Derivation**: PBKDF2 with SHA-256 (100,000 iterations)
- **IV**: 12 bytes (96 bits) random for each note
- **Salt**: 16 bytes (128 bits) random for each note
- **Encoding**: Base64 for storage/transmission

## 🛠️ API Endpoints

### POST `/note`
Create a new encrypted note

**Request Body:**
```json
{
  "cipherText": "base64_encrypted_data",
  "iv": "base64_initialization_vector",
  "salt": "base64_salt"
}
```

**Response:**
```json
{
  "id": "uuid-of-note"
}
```

### GET `/note/:id`
Retrieve an encrypted note

**Response:**
```json
{
  "id": "uuid",
  "cipherText": "base64_encrypted_data",
  "iv": "base64_initialization_vector",
  "salt": "base64_salt",
  "createdAt": 1234567890
}
```

## 🔧 Dependencies

**ZERO!** 🎉

- Server: Uses only native Node.js modules (`http`, `fs`, `crypto`, `path`)
- Client: Uses native Web Crypto API

No npm packages required!

## 🚨 Security Considerations

### ✅ What's Secure
- Passwords never leave your browser
- Server cannot decrypt notes (zero-knowledge)
- Each note has unique encryption parameters
- Uses modern, audited encryption standards

### ⚠️ Limitations
- No password recovery (by design)
- Notes stored indefinitely (add expiry for production)
- No brute-force protection (add rate limiting)
- Uses JSON file storage (use proper DB in production)

## 🎯 Future Enhancements

- [ ] One-time read with auto-delete
- [ ] Note expiration (time-based)
- [ ] Encrypted shareable links
- [ ] Rate limiting & DDoS protection
- [ ] PostgreSQL/MongoDB backend
- [ ] Docker deployment
- [ ] HTTPS enforcement
- [ ] Password strength meter
- [ ] Mobile-responsive design improvements

## 📝 License

MIT

## 🙏 Credits

Inspired by services like:
- PrivateBin
- Noteshare.space
- OneTimeSecret

---

**⚡ Built with minimal dependencies and maximum security!**
