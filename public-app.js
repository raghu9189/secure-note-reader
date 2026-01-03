/**
 * Secure Notes Application Logic
 * Handles UI interactions and API calls
 */

const API_BASE = window.location.origin;

// Store uploaded images
let uploadedImages = [];

// Store global session key
let globalSessionKey = null;

/**
 * Set global session key
 */
function setSessionKey() {
  const keyInput = document.getElementById('sessionKey');
  const statusDiv = document.getElementById('sessionStatus');
  const password = keyInput.value.trim();
  
  if (!password) {
    statusDiv.innerHTML = '<div class="error" style="margin: 0;">❌ Please enter a password</div>';
    return;
  }
  
  if (password.length < 8) {
    statusDiv.innerHTML = '<div class="error" style="margin: 0;">❌ Password must be at least 8 characters</div>';
    return;
  }
  
  globalSessionKey = password;
  keyInput.value = '';
  keyInput.type = 'password';
  
  statusDiv.innerHTML = '<div class="success" style="margin: 0;">✅ Session key set! You can now encrypt & decrypt notes without entering password each time.</div>';
  
  // Show hints in both sections
  document.getElementById('sessionKeyHint').style.display = 'block';
  document.getElementById('createSessionKeyHint').style.display = 'block';
  
  // Make password fields optional
  document.getElementById('readPassword').placeholder = 'Optional - using session key';
  document.getElementById('password').placeholder = 'Optional - using session key';
}

/**
 * Clear global session key
 */
function clearSessionKey() {
  globalSessionKey = null;
  
  const statusDiv = document.getElementById('sessionStatus');
  statusDiv.innerHTML = '<div class="info" style="margin: 0;">🔒 Session key cleared</div>';
  
  // Hide hints in both sections
  document.getElementById('sessionKeyHint').style.display = 'none';
  document.getElementById('createSessionKeyHint').style.display = 'none';
  
  // Reset password field placeholders
  document.getElementById('readPassword').placeholder = 'Enter secret key to decrypt';
  document.getElementById('password').placeholder = 'Enter a strong secret key (password)';
  
  // Clear the input
  document.getElementById('sessionKey').value = '';
}

/**
 * Handle image file selection
 */
document.addEventListener('DOMContentLoaded', () => {
  const imageUpload = document.getElementById('imageUpload');
  if (imageUpload) {
    imageUpload.addEventListener('change', handleImageUpload);
  }
  
  // Handle compression toggle
  const compressCheckbox = document.getElementById('compressImages');
  const compressionSettings = document.getElementById('compressionSettings');
  
  if (compressCheckbox && compressionSettings) {
    compressCheckbox.addEventListener('change', (e) => {
      compressionSettings.style.display = e.target.checked ? 'block' : 'none';
    });
  }
});

/**
 * Compress image using canvas
 */
function compressImage(base64Data, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image on canvas
      ctx.drawImage(img, 0, 0);
      
      // Convert to compressed base64
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      
      resolve(compressedBase64);
    };
    img.onerror = reject;
    img.src = base64Data;
  });
}

/**
 * Get file size from base64
 */
function getBase64Size(base64) {
  const stringLength = base64.length - 'data:image/png;base64,'.length;
  const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812;
  return sizeInBytes;
}

/**
 * Convert image file to base64
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Handle image upload
 */
async function handleImageUpload(event) {
  const files = event.target.files;
  const shouldCompress = document.getElementById('compressImages').checked;
  const quality = document.getElementById('compressionQuality').value / 100;
  
  for (let file of files) {
    if (file.type.startsWith('image/')) {
      try {
        let base64 = await fileToBase64(file);
        const originalSize = getBase64Size(base64);
        
        // Compress if enabled
        if (shouldCompress) {
          const compressedBase64 = await compressImage(base64, quality);
          const compressedSize = getBase64Size(compressedBase64);
          const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);
          
          console.log(`📊 ${file.name}: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${savings}% smaller)`);
          base64 = compressedBase64;
        }
        
        // Check file size after compression (warn if > 5MB)
        const finalSize = getBase64Size(base64);
        if (finalSize > 5 * 1024 * 1024) {
          const proceed = confirm(`${file.name} is ${(finalSize / 1024 / 1024).toFixed(2)}MB after compression. Large images may take longer to encrypt. Continue?`);
          if (!proceed) continue;
        }
        
        uploadedImages.push({
          name: file.name,
          data: base64
        });
        displayImagePreview();
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image: ' + file.name);
      }
    }
  }
  event.target.value = ''; // Reset input
}

/**
 * Paste image from clipboard
 */
async function pasteImage() {
  try {
    const shouldCompress = document.getElementById('compressImages').checked;
    const quality = document.getElementById('compressionQuality').value / 100;
    
    const clipboardItems = await navigator.clipboard.read();
    for (const item of clipboardItems) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type);
          let base64 = await fileToBase64(blob);
          
          // Compress if enabled
          if (shouldCompress) {
            const originalSize = getBase64Size(base64);
            const compressedBase64 = await compressImage(base64, quality);
            const compressedSize = getBase64Size(compressedBase64);
            const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);
            
            console.log(`📊 Pasted image: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${savings}% smaller)`);
            base64 = compressedBase64;
          }
          
          uploadedImages.push({
            name: 'pasted-image-' + Date.now() + '.jpg',
            data: base64
          });
          displayImagePreview();
          return;
        }
      }
    }
    alert('No image found in clipboard');
  } catch (error) {
    console.error('Paste error:', error);
    alert('Failed to paste image. Try using Ctrl+V in the textarea instead.');
  }
}

/**
 * Display image previews
 */
function displayImagePreview() {
  const container = document.getElementById('imagePreview');
  container.innerHTML = '';
  
  uploadedImages.forEach((img, index) => {
    const preview = document.createElement('div');
    preview.className = 'image-preview';
    preview.innerHTML = `
      <img src="${img.data}" alt="${img.name}">
      <button class="remove-btn" onclick="removeImage(${index})" title="Remove image">×</button>
    `;
    container.appendChild(preview);
  });
}

/**
 * Remove image from upload list
 */
function removeImage(index) {
  uploadedImages.splice(index, 1);
  displayImagePreview();
}

/**
 * Creates and encrypts a new note with images
 */
/**
 * Creates and encrypts a new note with images
 */
async function createNote() {
  const noteTitle = document.getElementById('noteTitle').value;
  const note = document.getElementById('note').value;
  let password = document.getElementById('password').value;
  const outputDiv = document.getElementById('createOutput');

  // Validation
  if (!note.trim() && uploadedImages.length === 0) {
    outputDiv.innerHTML = '<div class="error">❌ Please enter a note or add images</div>';
    return;
  }

  // Use session key if available and no password provided
  if (!password.trim() && globalSessionKey) {
    password = globalSessionKey;
  }

  if (!password.trim()) {
    outputDiv.innerHTML = '<div class="error">❌ Please enter a password or set a session key</div>';
    return;
  }

  if (password.length < 8) {
    outputDiv.innerHTML = '<div class="error">❌ Password must be at least 8 characters</div>';
    return;
  }

  try {
    outputDiv.innerHTML = '<div class="info">🔐 Encrypting your note and images...</div>';

    // Combine title, text and images into a single content
    let content = '';
    
    // Add title if provided
    if (noteTitle.trim()) {
      content = `[TITLE]${noteTitle.trim()}[/TITLE]\n\n`;
    }
    
    content += note;
    
    // Append images with special markers
    if (uploadedImages.length > 0) {
      content += '\n\n[ENCRYPTED_IMAGES_START]\n';
      uploadedImages.forEach((img, index) => {
        content += `[IMG:${img.name}]${img.data}[/IMG]\n`;
      });
      content += '[ENCRYPTED_IMAGES_END]';
    }

    // Encrypt the combined content
    const encrypted = await encrypt(content, password);

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
        ✅ Note ${uploadedImages.length > 0 ? 'and ' + uploadedImages.length + ' image(s)' : ''} encrypted and saved!<br><br>
        <strong>Note ID:</strong> ${data.id}
        <button class="copy-btn" onclick="copyToClipboard('${data.id}')">📋 Copy ID</button>
        <br><br>
        <small>⚠️ Save this ID! You'll need it and your password to read the note.</small>
      </div>
    `;

    // Clear form
    document.getElementById('noteTitle').value = '';
    document.getElementById('note').value = '';
    document.getElementById('password').value = '';
    uploadedImages = [];
    displayImagePreview();
    
    // Refresh notes list
    loadNotesList();

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
  let password = document.getElementById('readPassword').value;
  const outputDiv = document.getElementById('output');

  // Validation
  if (!id.trim()) {
    outputDiv.innerHTML = '<div class="error">❌ Please enter a Note ID</div>';
    return;
  }

  // Use session key if available and no password provided
  if (!password.trim() && globalSessionKey) {
    password = globalSessionKey;
  }

  if (!password.trim()) {
    outputDiv.innerHTML = '<div class="error">❌ Please enter the password or set a session key</div>';
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
    
    // Parse title, text and images
    const parsed = parseContentWithImages(text);
    
    // Build HTML output
    let outputHTML = '<div class="success">✅ Note decrypted successfully!</div><div class="decrypted-content">';
    
    // Display title if present
    if (parsed.title) {
      outputHTML += `<h3 style="margin-top: 0; margin-bottom: 15px; color: var(--primary-color); font-size: 1.5em; border-bottom: 2px solid var(--primary-color); padding-bottom: 10px;">${escapeHtml(parsed.title)}</h3>`;
    }
    
    if (parsed.text) {
      outputHTML += escapeHtml(parsed.text);
    }
    
    if (parsed.images.length > 0) {
      outputHTML += '<br><br><strong>📷 Images:</strong><br>';
      parsed.images.forEach(img => {
        outputHTML += `<img src="${img.data}" alt="${img.name}" title="${img.name}"><br>`;
      });
    }
    
    outputHTML += '</div>';
    outputDiv.innerHTML = outputHTML;

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

/**
 * Parse decrypted content to extract title, text and images
 */
function parseContentWithImages(content) {
  const result = {
    title: '',
    text: '',
    images: []
  };

  // Extract title if present
  const titleMatch = content.match(/\[TITLE\](.*?)\[\/TITLE\]/s);
  if (titleMatch) {
    result.title = titleMatch[1].trim();
    // Remove title from content
    content = content.replace(/\[TITLE\].*?\[\/TITLE\]\s*/, '');
  }

  // Check if content has images
  const imageStartMarker = '[ENCRYPTED_IMAGES_START]';
  const imageEndMarker = '[ENCRYPTED_IMAGES_END]';
  
  if (content.includes(imageStartMarker) && content.includes(imageEndMarker)) {
    const parts = content.split(imageStartMarker);
    result.text = parts[0].trim();
    
    const imageSection = parts[1].split(imageEndMarker)[0];
    const imageRegex = /\[IMG:(.*?)\](data:image\/.*?)\[\/IMG\]/g;
    let match;
    
    while ((match = imageRegex.exec(imageSection)) !== null) {
      result.images.push({
        name: match[1],
        data: match[2]
      });
    }
  } else {
    result.text = content;
  }

  return result;
}

/**
 * Load and display all saved notes
 */
async function loadNotesList() {
  const listContainer = document.getElementById('notesList');
  
  try {
    const res = await fetch(`${API_BASE}/notes`);
    if (!res.ok) {
      throw new Error('Failed to load notes');
    }
    
    const notes = await res.json();
    
    if (notes.length === 0) {
      listContainer.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--text-color); opacity: 0.6;">
          📝 No notes saved yet. Create your first secure note above!
        </div>
      `;
      return;
    }
    
    // Sort by date, newest first
    notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    listContainer.innerHTML = notes.map(note => {
      const date = new Date(note.createdAt);
      const formattedDate = date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Format size
      const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      };
      
      return `
        <div class="note-item">
          <div class="note-item-id" title="${note.id}">${note.id}</div>
          <div class="note-item-date">${formattedDate} • ${formatSize(note.size)}</div>
          <div class="note-item-actions">
            <button class="note-item-btn" onclick="copyToClipboard('${note.id}')" title="Copy ID">📋</button>
            <button class="note-item-btn" onclick="fillNoteId('${note.id}')" title="Load to read">📖</button>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    listContainer.innerHTML = `
      <div style="padding: 20px; text-align: center; color: var(--error-text);">
        ❌ Failed to load notes list
      </div>
    `;
    console.error('Load notes list error:', error);
  }
}

/**
 * Fill note ID in the read section
 */
function fillNoteId(id) {
  document.getElementById('noteId').value = id;
  
  // If session key is set, auto-decrypt
  if (globalSessionKey) {
    readNote();
  } else {
    // Scroll to read section
    document.getElementById('noteId').scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Focus on password field
    setTimeout(() => {
      document.getElementById('readPassword').focus();
    }, 500);
  }
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
  
  // Load notes list on page load
  loadNotesList();
});
