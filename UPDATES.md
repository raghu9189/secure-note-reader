# 🔐 Secure Note Reader - Feature Update

## ✨ New Features Implemented (Jan 3, 2026)

### 🎯 Changes Summary

#### 1. 🌓 **Night Mode Toggle**
- ✅ Beautiful dark theme with custom color scheme
- ✅ Smooth transitions between light/dark modes
- ✅ Theme preference saved in localStorage
- ✅ Toggle button in top-right corner (🌓)
- ✅ All UI elements adapt to dark mode

**Dark Mode Colors:**
- Background: Dark blue gradient (#1a1a2e → #16213e)
- Cards: Deep blue (#0f3460)
- Text: Light gray (#e0e0e0)
- Inputs: Dark backgrounds with proper contrast

#### 2. 🔌 **Port Changed to 3003**
- ✅ Server now runs on `http://localhost:3003`
- ✅ All API endpoints updated in client
- ✅ No conflicts with other services on port 3000

#### 3. 🔐 **Encryption Algorithm: AES-256-CBC**
- ✅ Changed from AES-GCM to AES-CBC
- ✅ IV size: 16 bytes (128 bits) - CBC standard
- ✅ Key derivation: PBKDF2 with 100,000 iterations
- ✅ Full compatibility maintained

**Why AES-CBC?**
- Industry standard for block encryption
- Wide browser support
- Predictable padding behavior
- Still provides strong 256-bit security

---

## 🚀 How to Use

### Start Server
```bash
cd /Users/raghuballu/Documents/raghu_works/secure-note-reader/server
node server.js
```

Server runs on: **http://localhost:3003** 🟢

### Open Client
Open: `client/index.html` in your browser

### Toggle Night Mode
Click the **🌓** button in the top-right corner!

---

## 🔄 API Endpoints (Updated)

### Create Note
```
POST http://localhost:3003/note
```

### Get Note
```
GET http://localhost:3003/note/:id
```

---

## 🎨 Night Mode Preview

**Light Mode:**
- Purple gradient background
- White cards
- Dark text
- Blue accents

**Dark Mode:**
- Dark blue gradient background
- Deep blue cards
- Light text
- Purple accents

---

## 🔐 Security Notes

**AES-256-CBC Configuration:**
- Block size: 128 bits (16 bytes)
- Key length: 256 bits (32 bytes)
- IV: 16 bytes random per encryption
- Salt: 16 bytes random per password
- Mode: CBC (Cipher Block Chaining)

**Note:** Old notes encrypted with AES-GCM will NOT be compatible with the new AES-CBC implementation. This is a breaking change.

---

## ✅ All Tests Passed

- ✅ Server starts on port 3003
- ✅ POST /note endpoint working
- ✅ GET /note/:id endpoint working
- ✅ Night mode toggle functional
- ✅ Theme persists across page reloads
- ✅ Encryption/decryption with AES-CBC working

---

**🎉 Your app is ready with all new features!**
