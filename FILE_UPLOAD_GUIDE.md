# File and Image Upload Feature Guide

## Overview
Your LangChain application now supports sending images and files to the LLM for analysis. The Gemini model can process images and text files together with your messages.

## Features

### Supported File Types
- **Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp` (any image format)
- **Text Files**: `.txt`, `.pdf`, `.doc`, `.docx`, `.json`, `.csv`
- **File Size Limit**: 10MB per file
- **Multiple Files**: Upload up to 10 files at once

### How to Use

#### 1. **Attach Files**
- Click the 📎 (paperclip) button in the input area
- Select one or multiple files from your device
- Preview will appear above the input box

#### 2. **Remove Files**
- Click the `×` button on any file preview to remove it
- You can remove individual files before sending

#### 3. **Send with Message**
- Type your message (e.g., "What's in this image?" or "Analyze this document")
- Click Send
- The LLM will receive both your message and the files

#### 4. **View Uploaded Files**
- Sent files appear in the message history with previews
- Images show thumbnails
- Other files show a document icon with filename

### Example Use Cases

#### Image Analysis
```
1. Upload: photo.jpg
2. Message: "What objects can you see in this image?"
3. The AI will analyze and describe the image content
```

#### Document Analysis
```
1. Upload: data.csv
2. Message: "Summarize the key trends in this data"
3. The AI will read and analyze the file content
```

#### Multiple Files
```
1. Upload: screenshot1.png, screenshot2.png
2. Message: "Compare these two screenshots"
3. The AI will analyze both images together
```

## Technical Implementation

### Backend Changes
- **Multer**: Handles multipart/form-data file uploads
- **Base64 Encoding**: Images are converted to base64 for Gemini API
- **Text Extraction**: Non-image files are read as UTF-8 text
- **Multimodal Messages**: Uses LangChain's message content array format

### Frontend Changes
- **File Input**: Hidden input with custom button trigger
- **Preview System**: Shows image previews and file names
- **FormData**: Sends files via multipart/form-data
- **File Management**: Add/remove files before sending

### API Changes
Both `/api/chat/stream` and `/api/graph/stream` endpoints now:
- Accept `multipart/form-data` instead of JSON
- Support `files` array parameter (up to 10 files)
- Process images as base64 inline data
- Include text file contents in the prompt

## Model Capabilities

The Google Gemini 2.0 Flash model supports:
- ✅ Image understanding and description
- ✅ Text extraction from images (OCR)
- ✅ Object detection and counting
- ✅ Scene understanding
- ✅ Visual question answering
- ✅ Document analysis
- ✅ Multi-image comparison

## Tips for Best Results

1. **Clear Questions**: Be specific about what you want to know
2. **Image Quality**: Higher quality images give better results
3. **File Size**: Keep files under 10MB for faster processing
4. **Context**: Provide context in your message about the files
5. **Multiple Files**: You can upload multiple images for comparison

## Troubleshooting

### Files Not Uploading
- Check file size (must be under 10MB)
- Verify file type is supported
- Ensure you have internet connection

### Poor Image Analysis
- Try higher resolution images
- Ensure good lighting in photos
- Crop to focus on relevant content

### Error Messages
- "Message is required" - Enter text along with files
- "Failed to process" - Try with smaller files or fewer files

## Code Examples

### Frontend Usage
```typescript
const formData = new FormData();
formData.append('message', 'Describe this image');
formData.append('files', imageFile);

fetch('/api/chat/stream', {
  method: 'POST',
  body: formData,
});
```

### Backend Processing
```typescript
// Files are received via multer
const files = req.files as Express.Multer.File[];

// Images converted to base64
const imageContent = {
  type: 'image_url',
  image_url: {
    url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
  },
};
```

## Next Steps

Consider enhancing with:
- PDF text extraction library
- Image compression before upload
- Progress indicators for large files
- File type validation on frontend
- Cloud storage integration for large files
