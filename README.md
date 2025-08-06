# Online Clipboard - Share & Edit

A modern web application that allows users to create, share, and edit content using unique codes. Perfect for sharing text snippets, notes, or any content that needs to be accessed across different devices.

## Features

### 🔐 **Dual Code System**
- **Share Code**: 4 digits + 1 special character (e.g., `1234!`) - Full edit access
- **View Code**: 5 digits (e.g., `12345`) - Read-only access

### ✨ **Key Features**
- **Create**: Generate new clipboards with unique codes
- **Share**: Share codes with others for easy access
- **Edit**: Full editing capabilities with share codes
- **View**: Read-only access with view codes
- **Copy**: One-click content copying
- **Auto-save**: Automatic saving every 30 seconds
- **Delete**: Remove clipboards when no longer needed
- **Responsive**: Works on desktop, tablet, and mobile

### 🎨 **Modern UI**
- Beautiful gradient design
- Smooth animations and transitions
- Bootstrap 5 for responsive layout
- Font Awesome icons
- Loading indicators and success/error messages

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Styling**: Bootstrap 5, Custom CSS
- **Icons**: Font Awesome

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Steps

1. **Clone or download the project**
   ```bash
   cd online-clipboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Access the application**
   Open your browser and go to: `http://localhost:3000`

## Usage

### Creating a New Clipboard
1. Enter your content in the text area
2. Click "Create Clipboard"
3. You'll receive two codes:
   - **Share Code** (4 digits + special char) - for editing
   - **View Code** (5 digits) - for viewing only

### Accessing an Existing Clipboard
1. Enter either the share code or view code
2. Click "Access Clipboard"
3. The content will be displayed with appropriate permissions

### Editing Content
- Use the **Share Code** to access edit mode
- Make changes in the text area
- Click "Save Changes" or use Ctrl+S
- Auto-save occurs every 30 seconds

### Sharing
- Share the **Share Code** with people who need to edit
- Share the **View Code** with people who only need to view
- Both codes can be copied with one click

## API Endpoints

### Create Clipboard
```
POST /api/clipboard
Body: { "content": "your content here" }
```

### Access by Share Code (Edit Mode)
```
GET /api/clipboard/share/:code
```

### Access by View Code (View Mode)
```
GET /api/clipboard/view/:code
```

### Update Clipboard
```
PUT /api/clipboard/:id
Body: { "content": "new content", "shareCode": "1234!" }
```

### Delete Clipboard
```
DELETE /api/clipboard/:id
Body: { "shareCode": "1234!" }
```

## Code Format

### Share Code Format
- **Pattern**: `DDDD!` (4 digits + 1 special character)
- **Examples**: `1234!`, `5678@`, `9012#`
- **Special Characters**: `!`, `@`, `#`, `$`, `%`, `^`, `&`, `*`, `?`

### View Code Format
- **Pattern**: `DDDDD` (5 digits)
- **Examples**: `12345`, `67890`, `11111`

## Security Features

- **Input Validation**: All codes are validated before processing
- **SQL Injection Protection**: Parameterized queries
- **CORS Enabled**: Cross-origin requests supported
- **Error Handling**: Comprehensive error messages
- **Rate Limiting**: Built-in protection against abuse

## Keyboard Shortcuts

- **Ctrl+S**: Save changes (in edit mode)
- **Ctrl+C**: Copy all content (when no text is selected)

## File Structure

```
online-clipboard/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── clipboard.db       # SQLite database (created automatically)
├── public/            # Frontend files
│   ├── index.html     # Main HTML file
│   ├── styles.css     # Custom styles
│   └── script.js      # Frontend JavaScript
└── README.md          # This file
```

## Database Schema

```sql
CREATE TABLE clipboards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    share_code TEXT UNIQUE NOT NULL,
    view_code TEXT UNIQUE NOT NULL,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_editable BOOLEAN DEFAULT 1
);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions:
1. Check the console for error messages
2. Ensure all dependencies are installed
3. Verify the server is running on the correct port
4. Check that the database file has proper write permissions

## Future Enhancements

- [ ] User authentication system
- [ ] Clipboard expiration dates
- [ ] File upload support
- [ ] Rich text editing
- [ ] Clipboard categories/tags
- [ ] Search functionality
- [ ] Export to various formats
- [ ] Real-time collaboration
- [ ] Mobile app version 