/**
 * Secure Notes Application Logic
 * Handles UI interactions and API calls
 */

const API_BASE = window.location.origin;

/**
 * Creates and encrypts a new note
 */
async function createNote() {
  const note = document.getElementById('note').value;
  const password = document.getElementById('password').value;
  const outputDiv = document.getElementById('createOutput');

  // Validation
  if (!note.trim()) {
    outputDiv.innerHTML = '<div class="error">❌ Please enter a note</div>';
    return;
  }

  if (!password.trim()) {
    outputDiv.innerHTML = '<div class="error">❌ Please enter a password</div>';
    return;
  }

  if (password.length < 8) {
    outputDiv.innerHTML = '<div class="error">❌ Password must be at least 8 characters</div>';
    return;
  }

  try {
    outputDiv.innerHTML = '<div class="info">🔐 Encrypting your note...</div>';

    // Encrypt the note in the browser
    const encrypted = await encrypt(note, password);

    // Send encrypted data to server
    const res = await fetch(`${API_BASE}/note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(encrypted)
    });

    if (!res.ok) {
      throw new Error('Failed to save note');
    }

    const data = await res.json();
    
    outputDiv.innerHTML = `
      <div class="success">
        ✅ Note encrypted and saved!<br><br>
        <strong>Note ID:</strong> ${data.id}
        <button class="copy-btn" onclick="copyToClipboard('${data.id}')">📋 Copy ID</button>
        <br><br>
        <small>⚠️ Save this ID! You'll need it and your password to read the note.</small>
      </div>
    `;

    // Clear form
    document.getElementById('note').value = '';
    document.getElementById('password').value = '';

  } catch (error) {
    outputDiv.innerHTML = `<div class="error">❌ Error: ${error.message}</div>`;
    console.error('Create note error:', error);
  }
}

/**
 * Fetches and decrypts a note
 */
async function readNote() {
  const id = document.getElementById('noteId').value;
  const password = document.getElementById('readPassword').value;
  const outputDiv = document.getElementById('output');

  // Validation
  if (!id.trim()) {
    outputDiv.innerHTML = '<div class="error">❌ Please enter a Note ID</div>';
    return;
  }

  if (!password.trim()) {
    outputDiv.innerHTML = '<div class="error">❌ Please enter the password</div>';
    return;
  }

  try {
    outputDiv.innerHTML = '<div class="info">🔍 Fetching encrypted note...</div>';

    // Fetch encrypted note from server
    const res = await fetch(`${API_BASE}/note/${id}`);

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Note not found');
      }
      throw new Error('Failed to fetch note');
    }

    const data = await res.json();

    outputDiv.innerHTML = '<div class="info">🔓 Decrypting note...</div>';

    // Decrypt the note in the browser
    const text = await decrypt(data, password);
    
    outputDiv.innerHTML = `
      <div class="success">✅ Note decrypted successfully!</div>
      <div class="decrypted-content">
        ${escapeHtml(text)}
      </div>
    `;

  } catch (error) {
    if (error.name === 'OperationError' || error.message.includes('operation-specific')) {
      outputDiv.innerHTML = '<div class="error">❌ Invalid password - cannot decrypt note</div>';
    } else {
      outputDiv.innerHTML = `<div class="error">❌ Error: ${error.message}</div>`;
    }
    console.error('Read note error:', error);
  }
}

/**
 * Copies text to clipboard
 */
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('✅ Note ID copied to clipboard!');
  }).catch(err => {
    console.error('Copy failed:', err);
    alert('❌ Failed to copy');
  });
}

/**
 * Escapes HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Add keyboard shortcuts
document.addEventListener('DOMContentLoaded', () => {
  // Enter to submit in password fields
  document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') createNote();
  });

  document.getElementById('readPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') readNote();
  });
});
