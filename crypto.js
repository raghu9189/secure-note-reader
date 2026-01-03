/**
 * Secure Note Encryption Module
 * Uses Web Crypto API with AES-256-CBC and PBKDF2 key derivation
 */

/**
 * Derives a cryptographic key from a password using PBKDF2
 * @param {string} password - User's password
 * @param {Uint8Array} salt - Random salt for key derivation
 * @returns {Promise<CryptoKey>} Derived AES-CBC key
 */
async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  
  // Import password as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive AES-CBC key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000, // 100k iterations for strong key derivation
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-CBC', length: 256 }, // AES-256-CBC
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts text using AES-256-CBC
 * @param {string} text - Plaintext to encrypt
 * @param {string} password - Password for encryption
 * @returns {Promise<Object>} Object containing cipherText, iv, and salt (all base64 encoded)
 */
async function encrypt(text, password) {
  const enc = new TextEncoder();
  
  // Generate random IV (16 bytes for CBC) and salt (16 bytes)
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Derive encryption key
  const key = await deriveKey(password, salt);

  // Encrypt the text
  const cipherText = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    key,
    enc.encode(text)
  );

  // Return base64-encoded values for storage/transmission
  return {
    cipherText: btoa(String.fromCharCode(...new Uint8Array(cipherText))),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt))
  };
}

/**
 * Decrypts AES-256-CBC encrypted data
 * @param {Object} data - Object containing cipherText, iv, and salt (base64 encoded)
 * @param {string} password - Password for decryption
 * @returns {Promise<string>} Decrypted plaintext
 * @throws {Error} If decryption fails (wrong password or corrupted data)
 */
async function decrypt(data, password) {
  const dec = new TextDecoder();

  // Decode base64 values back to Uint8Array
  const cipher = Uint8Array.from(atob(data.cipherText), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(data.iv), c => c.charCodeAt(0));
  const salt = Uint8Array.from(atob(data.salt), c => c.charCodeAt(0));

  // Derive decryption key (must match encryption key)
  const key = await deriveKey(password, salt);

  // Decrypt the data
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv },
    key,
    cipher
  );

  return dec.decode(plain);
}
