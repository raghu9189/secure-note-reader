# 📷 Image Encryption Feature

## ✨ NEW: Encrypted Images Support!

You can now add images to your secure notes! Images are converted to base64 and encrypted along with your text using the same AES-256-CBC encryption.

---

## 🎯 How It Works

### Encryption Process:
1. **Upload/Paste Image** → Image converted to base64 data URL
2. **Combine with Text** → Images embedded in text with special markers
3. **Encrypt Everything** → AES-256-CBC encrypts the entire content
4. **Store** → Server stores only the encrypted data

### Decryption Process:
1. **Fetch Encrypted Data** → Get encrypted content from server
2. **Decrypt** → Use your password to decrypt
3. **Parse** → Extract text and images from decrypted content
4. **Display** → Show text and render images

---

## 📝 How to Use Images

### Method 1: Upload Files
1. Click the **"📁 Upload Images"** button
2. Select one or multiple image files
3. See previews appear below
4. Remove any image by clicking the × button

### Method 2: Paste from Clipboard
1. Copy an image (from screenshot, browser, etc.)
2. Click **"📋 Paste from Clipboard"** button
3. Image appears in preview
4. Continue adding more images if needed

### Supported Formats:
- ✅ PNG
- ✅ JPG/JPEG
- ✅ GIF
- ✅ WebP
- ✅ SVG
- ✅ Any browser-supported image format

---

## 🔐 Security Details

### Image Encryption:
```
Original Image → Base64 Data URL → Combined with Text → 
AES-256-CBC Encryption → Encrypted Blob → Stored on Server
```

### Image Format in Encrypted Content:
```
[Your text content here]

[ENCRYPTED_IMAGES_START]
[IMG:filename.png]data:image/png;base64,iVBORw0KG...[/IMG]
[IMG:another.jpg]data:image/jpeg;base64,/9j/4AAQ...[/IMG]
[ENCRYPTED_IMAGES_END]
```

**Note:** The entire structure above gets encrypted, so the server never sees:
- Your images
- Image filenames
- Number of images
- Any content

---

## 💡 Use Cases

### 1. Secure Photo Sharing
- Share private photos with friends
- Only people with the password can see them
- No cloud storage of unencrypted images

### 2. Document Storage
- Screenshots of sensitive documents
- Encrypted diagrams
- Private photos

### 3. Visual Notes
- Add illustrations to your notes
- Combine text explanations with images
- Create visual guides

### 4. Backup Important Images
- Store important images securely
- Access from anywhere
- Zero-knowledge backup

---

## 📊 Technical Specifications

### Image Processing:
- **Conversion**: FileReader API (client-side)
- **Format**: Base64 Data URL
- **Storage**: Embedded in encrypted text
- **Size Limit**: Browser memory limit (typically several MB)

### Performance:
- ✅ All processing happens in browser
- ✅ No server-side image processing
- ✅ Fast encryption/decryption
- ⚠️ Large images increase encrypted data size

### Browser Compatibility:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Any modern browser with Web Crypto API

---

## ⚠️ Important Notes

### File Size Considerations:
- Large images = larger encrypted data
- Consider compressing images before upload
- Recommended: Keep total size under 10MB for best performance

### Image Quality:
- Original quality is preserved
- No compression during encryption
- Images displayed at original resolution
- CSS constrains display size for readability

### Privacy:
- ✅ Images never leave your browser unencrypted
- ✅ Server only sees encrypted blob
- ✅ No metadata extraction
- ✅ Filenames are encrypted too

---

## 🎨 UI Features

### Image Preview:
- Thumbnail previews before encryption
- Remove individual images
- See how many images you're adding
- Responsive design

### Decrypted Display:
- Full-size image rendering
- Responsive sizing (max 100% width)
- Rounded corners and borders
- Dark mode compatible
- Shows all images in order

---

## 🔧 Developer Details

### Image Encoding Function:
```javascript
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### Image Parsing Function:
```javascript
function parseContentWithImages(content) {
  // Extract text and images using regex
  const imageRegex = /\[IMG:(.*?)\](data:image\/.*?)\[\/IMG\]/g;
  // Returns: { text, images: [{name, data}] }
}
```

### Storage Format:
- Text and images combined before encryption
- Special markers for image boundaries
- Regex-based extraction on decryption
- Preserves image order

---

## 🚀 Future Enhancements

Possible improvements:
- [ ] Image compression option
- [ ] Drag and drop support
- [ ] Multiple image formats preview
- [ ] Image editing (crop, resize)
- [ ] Video support
- [ ] File attachments (PDFs, etc.)

---

## 📖 Example Usage

### Example 1: Secret Recipe with Photos
```
Text: "My grandmother's secret recipe..."
Images: 
  - recipe-ingredients.jpg
  - cooking-steps.png
  - final-dish.jpg

Result: All encrypted together!
```

### Example 2: Travel Notes
```
Text: "Amazing trip to Paris..."
Images:
  - eiffel-tower.jpg
  - louvre-museum.jpg
  - street-cafe.jpg

Result: Private travel diary with photos!
```

### Example 3: Work Notes
```
Text: "Meeting notes from Q4 review..."
Images:
  - quarterly-chart.png
  - team-structure.png

Result: Confidential work notes secured!
```

---

## ✅ Benefits

1. **All-in-One Encryption** - Text and images encrypted together
2. **Easy to Use** - Upload or paste images
3. **Secure** - Zero-knowledge architecture maintained
4. **Private** - No cloud storage of original images
5. **Flexible** - Multiple images per note
6. **Fast** - Client-side processing

---

**Your images are now as secure as your text!** 🔒📷✨
