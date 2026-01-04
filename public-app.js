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
  
  // Show hints in all sections
  document.getElementById('sessionKeyHint').style.display = 'block';
  document.getElementById('createSessionKeyHint').style.display = 'block';
  document.getElementById('updateSessionKeyHint').style.display = 'block';
  
  // Make password fields optional
  document.getElementById('readPassword').placeholder = 'Optional - using session key';
  document.getElementById('password').placeholder = 'Optional - using session key';
  document.getElementById('updatePassword').placeholder = 'Optional - using session key';
}

/**
 * Clear global session key
 */
function clearSessionKey() {
  globalSessionKey = null;
  
  const statusDiv = document.getElementById('sessionStatus');
  statusDiv.innerHTML = '<div class="info" style="margin: 0;">🔒 Session key cleared</div>';
  
  // Hide hints in all sections
  document.getElementById('sessionKeyHint').style.display = 'none';
  document.getElementById('createSessionKeyHint').style.display = 'none';
  document.getElementById('updateSessionKeyHint').style.display = 'none';
  
  // Reset password field placeholders
  document.getElementById('readPassword').placeholder = 'Enter secret key to decrypt';
  document.getElementById('password').placeholder = 'Enter a strong secret key (password)';
  document.getElementById('updatePassword').placeholder = 'Enter original secret key';
  
  // Clear the input
  document.getElementById('sessionKey').value = '';
}

/**
 * Toggle session key visibility
 */
function toggleSessionKeyVisibility() {
  const input = document.getElementById('sessionKey');
  const toggle = document.getElementById('sessionKeyToggle');
  
  if (input.type === 'password') {
    input.type = 'text';
    toggle.textContent = '🙈';
    toggle.title = 'Hide password';
  } else {
    input.type = 'password';
    toggle.textContent = '👁️';
    toggle.title = 'Show password';
  }
}

/**
 * Toggle password visibility for any password field
 */
function togglePasswordVisibility(inputId, toggleId) {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  
  if (input.type === 'password') {
    input.type = 'text';
    toggle.textContent = '🙈';
    toggle.title = 'Hide password';
  } else {
    input.type = 'password';
    toggle.textContent = '👁️';
    toggle.title = 'Show password';
  }
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
      
      // Fill white background (for transparent images)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw image on canvas
      ctx.drawImage(img, 0, 0);
      
      // Always convert to JPEG with compression
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
        
        // Always compress and convert to JPEG
        const compressedBase64 = await compressImage(base64, shouldCompress ? quality : 0.95);
        const compressedSize = getBase64Size(compressedBase64);
        const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);
        
        console.log(`📊 ${file.name}: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${savings}% smaller) [Converted to JPEG]`);
        base64 = compressedBase64;
        
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
          
          // Always compress and convert to JPEG
          const originalSize = getBase64Size(base64);
          const compressedBase64 = await compressImage(base64, shouldCompress ? quality : 0.95);
          const compressedSize = getBase64Size(compressedBase64);
          const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);
          
          console.log(`📊 Pasted image: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${savings}% smaller) [Converted to JPEG]`);
          base64 = compressedBase64;
          
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
      <button class="insert-btn" onclick="insertImageMarker(${index})" title="Insert at cursor position">📍 Insert Here</button>
    `;
    container.appendChild(preview);
  });
}

/**
 * Insert image marker at cursor position in textarea
 */
function insertImageMarker(index) {
  const textarea = document.getElementById('note');
  const img = uploadedImages[index];
  const marker = `[IMAGE:${index}:${img.name}]`;
  
  // Get cursor position
  const cursorPos = textarea.selectionStart;
  const textBefore = textarea.value.substring(0, cursorPos);
  const textAfter = textarea.value.substring(textarea.selectionEnd);
  
  // Insert marker at cursor position
  textarea.value = textBefore + marker + textAfter;
  
  // Set cursor position after the marker
  const newCursorPos = cursorPos + marker.length;
  textarea.setSelectionRange(newCursorPos, newCursorPos);
  textarea.focus();
  
  // Visual feedback
  const btn = event.target;
  const originalText = btn.textContent;
  btn.textContent = '✅ Inserted!';
  btn.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = '';
  }, 1500);
}

/**
 * Remove image from upload list
 */
function removeImage(index) {
  uploadedImages.splice(index, 1);
  displayImagePreview();
  
  // Update markers in textarea
  const textarea = document.getElementById('note');
  let text = textarea.value;
  
  // Remove markers for deleted image
  const regex = new RegExp(`\\[IMAGE:${index}:[^\\]]+\\]`, 'g');
  text = text.replace(regex, '');
  
  // Update index numbers for remaining images
  for (let i = index + 1; i < uploadedImages.length + 1; i++) {
    const oldMarker = new RegExp(`\\[IMAGE:${i}:`, 'g');
    text = text.replace(oldMarker, `[IMAGE:${i - 1}:`);
  }
  
  textarea.value = text;
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
    
    // Process text with inline image markers
    let processedNote = note;
    
    // Replace image markers with actual image data inline
    uploadedImages.forEach((img, index) => {
      const marker = `[IMAGE:${index}:${img.name}]`;
      const imageEmbed = `[INLINE_IMG:${img.name}]${img.data}[/INLINE_IMG]`;
      processedNote = processedNote.replace(marker, imageEmbed);
    });
    
    content += processedNote;
    
    // Append remaining images that weren't inserted inline (for backward compatibility)
    const insertedImages = new Set();
    uploadedImages.forEach((img, index) => {
      const marker = `[IMAGE:${index}:${img.name}]`;
      if (note.includes(marker)) {
        insertedImages.add(index);
      }
    });
    
    const remainingImages = uploadedImages.filter((_, index) => !insertedImages.has(index));
    if (remainingImages.length > 0) {
      content += '\n\n[ENCRYPTED_IMAGES_START]\n';
      remainingImages.forEach((img) => {
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
      // Replace inline image placeholders with actual images BEFORE escaping
      let textWithImages = parsed.text;
      
      // Sort placeholders by index to replace in correct order
      parsed.inlineImages.forEach(img => {
        const imgTag = `|||IMAGE_MARKER|||<img src="${img.data}" alt="${escapeHtml(img.name)}" title="${escapeHtml(img.name)}" style="max-width: 100%; border-radius: 8px; margin: 10px 0;">|||IMAGE_MARKER|||`;
        textWithImages = textWithImages.replace(img.placeholder, imgTag);
      });
      
      // Escape HTML for text content but preserve image markers
      const parts = textWithImages.split('|||IMAGE_MARKER|||');
      let finalText = '';
      parts.forEach((part, index) => {
        if (index % 2 === 0) {
          // Text part - escape HTML
          finalText += escapeHtml(part);
        } else {
          // Image tag - keep as is
          finalText += part;
        }
      });
      
      outputHTML += finalText.replace(/\n/g, '<br>');
    }
    
    // Display remaining images at the end (old format)
    if (parsed.images.length > 0) {
      outputHTML += '<br><br><strong>📷 Additional Images:</strong><br>';
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
 * Load note for updating
 */
async function loadNoteForUpdate() {
  const noteId = document.getElementById('updateNoteId').value.trim();
  let password = document.getElementById('updatePassword').value.trim();
  const outputDiv = document.getElementById('updateOutput');
  const formDiv = document.getElementById('updateNoteForm');
  
  // Clear previous new images
  updateNewImages = [];
  document.getElementById('updateImagePreview').innerHTML = '';
  
  if (!noteId) {
    outputDiv.innerHTML = '<div class="error">❌ Please enter a Note ID</div>';
    return;
  }
  
  // Use session key if available and no password provided
  if (!password && globalSessionKey) {
    password = globalSessionKey;
  }
  
  if (!password) {
    outputDiv.innerHTML = '<div class="error">❌ Please enter the password or set a session key</div>';
    return;
  }
  
  try {
    outputDiv.innerHTML = '<div class="info">⏳ Loading note...</div>';
    
    // Fetch encrypted note
    const res = await fetch(`${API_BASE}/note/${noteId}`);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Note not found');
      }
      throw new Error('Failed to fetch note');
    }
    
    const data = await res.json();
    
    outputDiv.innerHTML = '<div class="info">🔓 Decrypting note...</div>';
    
    // Decrypt the note using crypto.js decrypt function
    const text = await decrypt(data, password);
    
    // Parse content
    const parsed = parseContentWithImages(text);
    
    // Fill the form
    document.getElementById('updateTitle').value = parsed.title || '';
    document.getElementById('updateContent').value = parsed.text || '';
    
    // Show the form
    formDiv.style.display = 'block';
    
    // Store note ID and parsed data for update
    formDiv.dataset.noteId = noteId;
    formDiv.dataset.parsedData = JSON.stringify(parsed); // Store parsed data including images
    
    // Display existing images with management controls
    let imagesHTML = '';
    const allImages = [...parsed.inlineImages, ...parsed.images.map(img => ({...img, placeholder: null}))];
    
    if (allImages.length > 0) {
      imagesHTML = '<div id="updateImageManager" style="margin-top: 15px; padding: 15px; background: var(--input-bg); border-radius: 6px; border-left: 3px solid var(--primary-color);">';
      imagesHTML += '<strong>📷 Manage Images:</strong><br>';
      imagesHTML += '<p style="font-size: 12px; margin: 5px 0 10px 0; opacity: 0.8;">Click ❌ to delete an image</p>';
      
      allImages.forEach((img, idx) => {
        const isInline = img.placeholder !== null && img.placeholder !== undefined;
        const imageType = isInline ? 'Inline' : 'Additional';
        imagesHTML += `
          <div class="image-item" data-index="${idx}" style="display: flex; align-items: center; gap: 10px; margin: 10px 0; padding: 10px; background: var(--card-bg); border-radius: 6px; border: 1px solid var(--input-border);">
            <img src="${img.data}" alt="${img.name}" style="max-width: 80px; max-height: 80px; border-radius: 4px; object-fit: cover;">
            <div style="flex: 1;">
              <div style="font-size: 13px; font-weight: 600;">${escapeHtml(img.name)}</div>
              <div style="font-size: 11px; opacity: 0.7;">Type: ${imageType}</div>
              <div style="font-size: 11px; opacity: 0.7;">Size: ${(img.data.length / 1024).toFixed(1)} KB</div>
            </div>
            <button onclick="deleteUpdateImage(${idx})" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 16px;" title="Delete this image">
              ❌
            </button>
          </div>
        `;
      });
      
      imagesHTML += '</div>';
    }
    
    outputDiv.innerHTML = '<div class="success">✅ Note loaded successfully! Edit the content below and click "Update & Save Changes".</div>' + imagesHTML;
    
  } catch (error) {
    formDiv.style.display = 'none';
    if (error.name === 'OperationError' || error.message.includes('operation-specific')) {
      outputDiv.innerHTML = '<div class="error">❌ Invalid password - cannot decrypt note</div>';
    } else {
      outputDiv.innerHTML = `<div class="error">❌ Error: ${error.message}</div>`;
    }
    console.error('Load note for update error:', error);
  }
}

/**
 * Delete image from update note
 */
function deleteUpdateImage(imageIndex) {
  const formDiv = document.getElementById('updateNoteForm');
  const parsed = JSON.parse(formDiv.dataset.parsedData);
  
  // Combine all images
  const allImages = [...parsed.inlineImages, ...parsed.images.map(img => ({...img, placeholder: null}))];
  
  // Confirm deletion
  const img = allImages[imageIndex];
  if (!confirm(`Delete image "${img.name}"?\n\nThis will remove it from the note when you save.`)) {
    return;
  }
  
  // Remove the image
  allImages.splice(imageIndex, 1);
  
  // Separate back into inline and regular images
  parsed.inlineImages = allImages.filter(img => img.placeholder);
  parsed.images = allImages.filter(img => !img.placeholder).map(img => ({name: img.name, data: img.data}));
  
  // Update stored data
  formDiv.dataset.parsedData = JSON.stringify(parsed);
  
  // Re-render the image list
  renderUpdateImages();
  
  // Show feedback
  const outputDiv = document.getElementById('updateOutput');
  const successMsg = document.createElement('div');
  successMsg.className = 'success';
  successMsg.style.margin = '10px 0';
  successMsg.textContent = `✅ Image "${img.name}" removed. Click "Update & Save Changes" to save.`;
  outputDiv.insertBefore(successMsg, outputDiv.firstChild);
  setTimeout(() => successMsg.remove(), 3000);
}

/**
 * Re-render the image management section
 */
function renderUpdateImages() {
  const formDiv = document.getElementById('updateNoteForm');
  const parsed = JSON.parse(formDiv.dataset.parsedData);
  const imageManager = document.getElementById('updateImageManager');
  
  if (!imageManager) return;
  
  const allImages = [...parsed.inlineImages, ...parsed.images.map(img => ({...img, placeholder: null}))];
  
  if (allImages.length === 0) {
    imageManager.innerHTML = '<div style="padding: 20px; text-align: center; opacity: 0.7;">All images removed</div>';
    return;
  }
  
  let imagesHTML = '<strong>📷 Manage Images:</strong><br>';
  imagesHTML += '<p style="font-size: 12px; margin: 5px 0 10px 0; opacity: 0.8;">Click ❌ to delete an image</p>';
  
  allImages.forEach((img, idx) => {
    const isInline = img.placeholder !== null && img.placeholder !== undefined;
    const imageType = isInline ? 'Inline' : 'Additional';
    imagesHTML += `
      <div class="image-item" data-index="${idx}" style="display: flex; align-items: center; gap: 10px; margin: 10px 0; padding: 10px; background: var(--card-bg); border-radius: 6px; border: 1px solid var(--input-border);">
        <img src="${img.data}" alt="${img.name}" style="max-width: 80px; max-height: 80px; border-radius: 4px; object-fit: cover;">
        <div style="flex: 1;">
          <div style="font-size: 13px; font-weight: 600;">${escapeHtml(img.name)}</div>
          <div style="font-size: 11px; opacity: 0.7;">Type: ${imageType}</div>
          <div style="font-size: 11px; opacity: 0.7;">Size: ${(img.data.length / 1024).toFixed(1)} KB</div>
        </div>
        <button onclick="deleteUpdateImage(${idx})" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 16px;" title="Delete this image">
          ❌
        </button>
      </div>
    `;
  });
  
  imageManager.innerHTML = imagesHTML;
}

// Store new images for update
let updateNewImages = [];

/**
 * Handle image upload for update note
 */
async function handleUpdateImageUpload(event) {
  const files = event.target.files;
  const shouldCompress = document.getElementById('updateCompressToggle').checked;
  const quality = document.getElementById('updateQualitySlider').value / 100;
  
  for (let file of files) {
    if (file.type.startsWith('image/')) {
      try {
        let base64 = await fileToBase64(file);
        const originalSize = getBase64Size(base64);
        
        // ALWAYS compress and convert to JPEG (strict rule for all formats)
        const compressedBase64 = await compressImage(base64, shouldCompress ? quality : 0.92);
        const compressedSize = getBase64Size(compressedBase64);
        const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);
        
        if (shouldCompress) {
          console.log(`📊 ${file.name}: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${savings}% smaller) [Converted to JPEG @ ${(quality * 100).toFixed(0)}%]`);
        } else {
          console.log(`📊 ${file.name}: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${savings}% smaller) [Converted to JPEG @ 92%]`);
        }
        base64 = compressedBase64;
        
        updateNewImages.push({
          name: file.name,
          data: base64
        });
        displayUpdateImagePreview();
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image: ' + file.name);
      }
    }
  }
  event.target.value = ''; // Reset input
}

/**
 * Paste image from clipboard for update
 */
async function pasteUpdateImage() {
  try {
    const shouldCompress = document.getElementById('updateCompressToggle').checked;
    const quality = document.getElementById('updateQualitySlider').value / 100;
    
    const clipboardItems = await navigator.clipboard.read();
    for (const item of clipboardItems) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type);
          let base64 = await fileToBase64(blob);
          
          const originalSize = getBase64Size(base64);
          
          // ALWAYS compress and convert to JPEG (strict rule for all formats)
          const compressedBase64 = await compressImage(base64, shouldCompress ? quality : 0.92);
          const compressedSize = getBase64Size(compressedBase64);
          const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);
          
          if (shouldCompress) {
            console.log(`📊 Pasted image: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${savings}% smaller) [Converted to JPEG @ ${(quality * 100).toFixed(0)}%]`);
          } else {
            console.log(`📊 Pasted image: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${savings}% smaller) [Converted to JPEG @ 92%]`);
          }
          base64 = compressedBase64;
          
          updateNewImages.push({
            name: 'pasted-image-' + Date.now() + '.jpg',
            data: base64
          });
          displayUpdateImagePreview();
          return;
        }
      }
    }
    alert('No image found in clipboard');
  } catch (error) {
    console.error('Paste error:', error);
    alert('Failed to paste image. Try using Ctrl+V or Cmd+V.');
  }
}

/**
 * Display preview of new images for update
 */
function displayUpdateImagePreview() {
  const previewContainer = document.getElementById('updateImagePreview');
  
  if (updateNewImages.length === 0) {
    previewContainer.innerHTML = '';
    return;
  }
  
  // Get base index for new images (after existing images)
  const formDiv = document.getElementById('updateNoteForm');
  const parsed = formDiv.dataset.parsedData ? JSON.parse(formDiv.dataset.parsedData) : {images: [], inlineImages: []};
  const baseIndex = parsed.images.length + parsed.inlineImages.length;
  
  let html = '<div style="margin-top: 10px;">';
  updateNewImages.forEach((img, idx) => {
    const globalIdx = baseIndex + idx;
    html += `
      <div style="display: inline-block; margin: 5px; position: relative; border: 2px solid var(--primary-color); border-radius: 8px; padding: 5px; cursor: pointer;" 
           onclick="insertUpdateImageMarker(${globalIdx}, '${img.name.replace(/'/g, "\\'")}')" 
           title="Click to insert at cursor position">
        <img src="${img.data}" alt="${img.name}" style="max-width: 100px; max-height: 100px; display: block; border-radius: 4px;">
        <button onclick="event.stopPropagation(); removeUpdateNewImage(${idx})" style="position: absolute; top: 0; right: 0; background: #dc3545; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px; line-height: 1;" title="Remove">
          ×
        </button>
        <div style="font-size: 10px; margin-top: 3px; text-align: center; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${img.name}
        </div>
      </div>
    `;
  });
  html += '</div>';
  
  previewContainer.innerHTML = html;
}

/**
 * Insert image marker for new update image at cursor position
 */
function insertUpdateImageMarker(index, name) {
  const textarea = document.getElementById('updateContent');
  const marker = `[IMAGE:${index}:${name}]`;
  
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  
  textarea.value = text.substring(0, start) + marker + text.substring(end);
  
  // Move cursor after marker
  textarea.selectionStart = textarea.selectionEnd = start + marker.length;
  textarea.focus();
}

/**
 * Remove a new image from update preview
 */
function removeUpdateNewImage(index) {
  updateNewImages.splice(index, 1);
  displayUpdateImagePreview();
}

/**
 * Update existing note
 */
async function updateNote() {
  const formDiv = document.getElementById('updateNoteForm');
  const noteId = formDiv.dataset.noteId;
  const parsed = JSON.parse(formDiv.dataset.parsedData); // Get parsed data with (possibly modified) images
  let password = document.getElementById('updatePassword').value.trim();
  const title = document.getElementById('updateTitle').value.trim();
  const content = document.getElementById('updateContent').value.trim();
  const outputDiv = document.getElementById('updateOutput');
  
  if (!noteId) {
    outputDiv.innerHTML = '<div class="error">❌ No note loaded. Please load a note first.</div>';
    return;
  }
  
  // Use session key if available and no password provided
  if (!password && globalSessionKey) {
    password = globalSessionKey;
  }
  
  if (!password) {
    outputDiv.innerHTML = '<div class="error">❌ Please enter the password or set a session key</div>';
    return;
  }
  
  if (!content) {
    outputDiv.innerHTML = '<div class="error">❌ Content cannot be empty</div>';
    return;
  }
  
  try {
    outputDiv.innerHTML = '<div class="info">⏳ Updating note...</div>';
    
    // First verify old password by trying to decrypt existing note
    const checkRes = await fetch(`${API_BASE}/note/${noteId}`);
    if (!checkRes.ok) {
      if (checkRes.status === 404) {
        throw new Error('Note not found');
      }
      throw new Error('Failed to fetch note');
    }
    
    const oldData = await checkRes.json();
    
    // This will throw if password is wrong
    await decrypt(oldData, password);
    
    // Use the parsed data (which may have deleted images)
    const originalParsed = parsed;
    
    // Prepare new content with title
    let fullContent = content;
    if (title) {
      fullContent = `[TITLE]${title}[/TITLE]\n\n${content}`;
    }
    
    // Replace inline image placeholders with actual inline image markers
    // Handle cases where images might have been deleted (placeholders may not match indices)
    if (originalParsed.inlineImages.length > 0) {
      originalParsed.inlineImages.forEach((img) => {
        // Find and replace the specific placeholder for this image
        if (img.placeholder) {
          const inlineMarker = `[INLINE_IMG:${img.name}]${img.data}[/INLINE_IMG]`;
          fullContent = fullContent.replace(img.placeholder, inlineMarker);
        }
      });
      
      // Clean up any remaining orphaned placeholders (from deleted images)
      fullContent = fullContent.replace(/__INLINE_IMAGE_\d+__/g, '');
    }
    
    // Process new images - check if they have inline markers [IMAGE:index:name]
    const newInlineImages = [];
    const newAdditionalImages = [];
    
    updateNewImages.forEach((img, idx) => {
      const baseIndex = originalParsed.images.length + originalParsed.inlineImages.length;
      const globalIdx = baseIndex + idx;
      const marker = `[IMAGE:${globalIdx}:${img.name}]`;
      
      if (fullContent.includes(marker)) {
        // This is an inline image
        newInlineImages.push(img);
        const inlineMarker = `[INLINE_IMG:${img.name}]${img.data}[/INLINE_IMG]`;
        fullContent = fullContent.replace(marker, inlineMarker);
      } else {
        // This is an additional image (not positioned inline)
        newAdditionalImages.push(img);
      }
    });
    
    // Combine existing additional images with new additional images
    const allAdditionalImages = [...originalParsed.images, ...newAdditionalImages];
    
    // Append all additional (non-inline) images to the end of content
    if (allAdditionalImages.length > 0) {
      fullContent += '\n\n[ENCRYPTED_IMAGES_START]';
      allAdditionalImages.forEach(img => {
        fullContent += `\n[IMG:${img.name}]${img.data}[/IMG]`;
      });
      fullContent += '\n[ENCRYPTED_IMAGES_END]';
    }
    
    // Encrypt the updated content using crypto.js encrypt function
    const encryptedData = await encrypt(fullContent, password);
    
    // Delete old note
    const deleteRes = await fetch(`${API_BASE}/note/${noteId}`, {
      method: 'DELETE'
    });
    
    if (!deleteRes.ok) {
      throw new Error('Failed to delete old note');
    }
    
    // Create updated note with same ID
    const createRes = await fetch(`${API_BASE}/note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: noteId,
        cipherText: encryptedData.cipherText,
        iv: encryptedData.iv,
        salt: encryptedData.salt,
        createdAt: oldData.createdAt // Preserve original creation time
      })
    });
    
    if (!createRes.ok) {
      throw new Error('Failed to save updated note');
    }
    
    outputDiv.innerHTML = `
      <div class="success">
        ✅ <strong>Note updated successfully!</strong><br>
        Note ID: <code class="mono">${noteId}</code>
        <button class="copy-btn" onclick="copyToClipboard('${noteId}')">📋 Copy ID</button>
      </div>
    `;
    
    // Clear form
    formDiv.style.display = 'none';
    document.getElementById('updateNoteId').value = '';
    document.getElementById('updatePassword').value = '';
    document.getElementById('updateTitle').value = '';
    document.getElementById('updateContent').value = '';
    document.getElementById('updateImagePreview').innerHTML = ''; // Clear preview
    updateNewImages = []; // Clear new images array
    delete formDiv.dataset.parsedData; // Clear stored data
    
    // Reload notes list
    setTimeout(() => {
      loadNotesList();
    }, 500);
    
  } catch (error) {
    if (error.name === 'OperationError' || error.message.includes('operation-specific')) {
      outputDiv.innerHTML = '<div class="error">❌ Invalid password - cannot update note</div>';
    } else {
      outputDiv.innerHTML = `<div class="error">❌ Error: ${error.message}</div>`;
    }
    console.error('Update note error:', error);
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
    images: [],
    inlineImages: [] // For images embedded in text
  };

  // Extract title if present
  const titleMatch = content.match(/\[TITLE\](.*?)\[\/TITLE\]/s);
  if (titleMatch) {
    result.title = titleMatch[1].trim();
    // Remove title from content
    content = content.replace(/\[TITLE\].*?\[\/TITLE\]\s*/, '');
  }

  // Extract inline images first
  const inlineImageRegex = /\[INLINE_IMG:(.*?)\](data:image\/[^[]+)\[\/INLINE_IMG\]/g;
  let match;
  let textWithPlaceholders = content;
  let placeholderIndex = 0;
  
  while ((match = inlineImageRegex.exec(content)) !== null) {
    result.inlineImages.push({
      name: match[1],
      data: match[2],
      placeholder: `__INLINE_IMAGE_${placeholderIndex}__`
    });
    textWithPlaceholders = textWithPlaceholders.replace(match[0], `__INLINE_IMAGE_${placeholderIndex}__`);
    placeholderIndex++;
  }

  // Check if content has images at the end (old format)
  const imageStartMarker = '[ENCRYPTED_IMAGES_START]';
  const imageEndMarker = '[ENCRYPTED_IMAGES_END]';
  
  if (textWithPlaceholders.includes(imageStartMarker) && textWithPlaceholders.includes(imageEndMarker)) {
    const parts = textWithPlaceholders.split(imageStartMarker);
    result.text = parts[0].trim();
    
    const imageSection = parts[1].split(imageEndMarker)[0];
    const imageRegex = /\[IMG:(.*?)\](data:image\/.*?)\[\/IMG\]/g;
    
    while ((match = imageRegex.exec(imageSection)) !== null) {
      result.images.push({
        name: match[1],
        data: match[2]
      });
    }
  } else {
    result.text = textWithPlaceholders.trim();
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
            <button class="note-item-btn" onclick="downloadNote('${note.id}', event)" title="Download encrypted note">💾</button>
            <button class="note-item-btn" onclick="deleteNote('${note.id}', event)" title="Delete note" style="color: var(--error-text);">🗑️</button>
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

/**
 * Download a single encrypted note as JSON file
 */
async function downloadNote(noteId, event) {
  try {
    // Fetch the encrypted note
    const res = await fetch(`${API_BASE}/note/${noteId}`);
    if (!res.ok) {
      throw new Error('Failed to fetch note');
    }
    
    const noteData = await res.json();
    
    // Create download
    const dataStr = JSON.stringify(noteData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `encrypted-note-${noteId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Visual feedback
    if (event && event.target) {
      const btn = event.target;
      const originalText = btn.textContent;
      btn.textContent = '✅';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 1500);
    }
    
  } catch (error) {
    alert('Failed to download note: ' + error.message);
    console.error('Download error:', error);
  }
}

/**
 * Delete a note with password verification
 */
async function deleteNote(noteId, event) {
  try {
    // Get password from user or use global session key
    let password = globalSessionKey;
    
    if (!password) {
      password = prompt(`🔐 Enter the password to delete note ${noteId}:\n\n⚠️ This will permanently delete the note if the password is correct.`);
      
      if (!password) {
        return; // User cancelled
      }
    } else {
      // Confirm deletion when using session key
      const confirmDelete = confirm(`⚠️ Are you sure you want to permanently delete note ${noteId}?\n\nThis action cannot be undone!`);
      if (!confirmDelete) {
        return;
      }
    }
    
    // Fetch the note to verify password
    const fetchRes = await fetch(`${API_BASE}/note/${noteId}`);
    if (!fetchRes.ok) {
      throw new Error('Note not found');
    }
    
    const noteData = await fetchRes.json();
    
    // Try to decrypt the note to verify password is correct
    try {
      const ivArray = base64ToUint8Array(noteData.iv);
      const saltArray = base64ToUint8Array(noteData.salt);
      const cipherArray = base64ToUint8Array(noteData.cipherText);
      
      // Derive key from password
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const key = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltArray,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-CBC', length: 256 },
        false,
        ['decrypt']
      );
      
      // Try to decrypt - this will fail if password is wrong
      await window.crypto.subtle.decrypt(
        { name: 'AES-CBC', iv: ivArray },
        key,
        cipherArray
      );
      
      // Password is correct, proceed with deletion
      const deleteRes = await fetch(`${API_BASE}/note/${noteId}`, {
        method: 'DELETE'
      });
      
      if (!deleteRes.ok) {
        throw new Error('Failed to delete note');
      }
      
      const result = await deleteRes.json();
      
      // Visual feedback
      if (event && event.target) {
        const btn = event.target;
        btn.textContent = '✅';
        btn.style.color = 'var(--success-text)';
      }
      
      // Reload the notes list after a brief delay
      setTimeout(() => {
        loadNotesList();
      }, 500);
      
      // Show success message
      alert('✅ Note deleted successfully!');
      console.log('Note deleted:', result.message);
      
    } catch (decryptError) {
      // Decryption failed - wrong password
      alert('❌ Incorrect password! Note was not deleted.');
      console.error('Password verification failed:', decryptError);
      return;
    }
    
  } catch (error) {
    alert('Failed to delete note: ' + error.message);
    console.error('Delete error:', error);
  }
}

/**
 * Download all encrypted notes as a single JSON file
 */
async function downloadAllNotes() {
  try {
    const res = await fetch(`${API_BASE}/notes/all`);
    if (!res.ok) {
      throw new Error('Failed to fetch notes');
    }
    
    const allNotes = await res.json();
    
    if (allNotes.length === 0) {
      alert('No notes to download');
      return;
    }
    
    // Create download with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const dataStr = JSON.stringify(allNotes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `all-encrypted-notes-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert(`✅ Downloaded ${allNotes.length} encrypted note(s) successfully!`);
    
  } catch (error) {
    alert('Failed to download notes: ' + error.message);
    console.error('Download all error:', error);
  }
}

/**
 * Upload encrypted note files
 */
async function uploadEncryptedNotes(files) {
  const statusDiv = document.getElementById('uploadStatus');
  statusDiv.style.display = 'block';
  statusDiv.style.borderColor = 'var(--primary-color)';
  statusDiv.innerHTML = '⏳ Processing files...';
  
  let successCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;
  const errors = [];
  
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Read file content
        const content = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsText(file);
        });
        
        // Parse JSON
        let noteData;
        try {
          noteData = JSON.parse(content);
        } catch (parseError) {
          throw new Error('Invalid JSON format');
        }
        
        // Check if it's an array (bulk upload) or single note
        const notesToUpload = Array.isArray(noteData) ? noteData : [noteData];
        
        // Validate and upload each note
        for (const note of notesToUpload) {
          // Validate note structure
          if (!note.id || !note.cipherText || !note.iv || !note.salt) {
            throw new Error('Missing required fields (id, cipherText, iv, salt)');
          }
          
          // Check if note already exists
          const checkRes = await fetch(`${API_BASE}/note/${note.id}`);
          if (checkRes.ok) {
            duplicateCount++;
            continue; // Skip duplicate
          }
          
          // Upload note
          const uploadRes = await fetch(`${API_BASE}/note`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: note.id,
              cipherText: note.cipherText,
              iv: note.iv,
              salt: note.salt,
              createdAt: note.createdAt || new Date().toISOString()
            })
          });
          
          if (!uploadRes.ok) {
            throw new Error('Failed to upload note to server');
          }
          
          successCount++;
        }
        
      } catch (error) {
        errorCount++;
        errors.push(`${file.name}: ${error.message}`);
      }
    }
    
    // Show results
    let message = '';
    if (successCount > 0) {
      message += `✅ Successfully uploaded ${successCount} note(s).<br>`;
    }
    if (duplicateCount > 0) {
      message += `⚠️ Skipped ${duplicateCount} duplicate note(s).<br>`;
    }
    if (errorCount > 0) {
      message += `❌ Failed to upload ${errorCount} file(s).<br>`;
      if (errors.length > 0 && errors.length <= 3) {
        message += `<div style="font-size: 11px; margin-top: 5px; opacity: 0.8;">${errors.join('<br>')}</div>`;
      }
    }
    
    if (successCount > 0) {
      statusDiv.style.borderColor = 'var(--success-text)';
      // Reload notes list
      setTimeout(() => {
        loadNotesList();
      }, 500);
    } else if (duplicateCount > 0 && errorCount === 0) {
      statusDiv.style.borderColor = '#FFA500';
    } else {
      statusDiv.style.borderColor = 'var(--error-text)';
    }
    
    statusDiv.innerHTML = message;
    
    // Auto-hide after delay
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
    
  } catch (error) {
    statusDiv.style.borderColor = 'var(--error-text)';
    statusDiv.innerHTML = `❌ Upload failed: ${error.message}`;
    console.error('Upload error:', error);
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
  
  // Handle encrypted file upload
  document.getElementById('encryptedFileUpload').addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      uploadEncryptedNotes(files);
    }
    // Reset input to allow re-uploading same file
    e.target.value = '';
  });
  
  // Load notes list on page load
  loadNotesList();
});
