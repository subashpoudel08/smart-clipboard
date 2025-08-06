# Smart Clipboard - Vercel Deployment Guide

## Overview
This is a serverless version of the Smart Clipboard application designed to run on Vercel. The application uses in-memory storage for demonstration purposes.

## Important Notes
- **Data Persistence**: This demo version uses in-memory storage, which means data will be lost when the serverless function restarts. For production use, you should integrate with a proper database service.
- **Recommended Database Services**: MongoDB Atlas, Supabase, PlanetScale, or any other cloud database service.


## Deployment Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy the Application
```bash
vercel
```

### 4. Follow the Prompts
- Link to existing project: No
- Project name: smart-clipboard (or your preferred name)
- Directory: ./ (current directory)
- Override settings: No

### 5. Access Your Application
After deployment, Vercel will provide you with a URL like:
`https://your-project-name.vercel.app`

## Project Structure
```
online-clipboard/
├── api/
│   └── clipboard.js          # Serverless API function
├── public/
│   ├── index.html           # Frontend HTML
│   ├── styles.css           # Frontend styles
│   └── script.js            # Frontend JavaScript
├── vercel.json              # Vercel configuration
├── package.json             # Dependencies
└── README.md               # Project documentation
```

## API Endpoints
- `POST /api/clipboard` - Create new clipboard
- `GET /api/clipboard/share/:code` - Get clipboard by share code (edit mode)
- `GET /api/clipboard/view/:code` - Get clipboard by view code (view mode)
- `PUT /api/clipboard/:id` - Update clipboard content
- `DELETE /api/clipboard/:id` - Delete clipboard

## Features
- ✅ Create online clipboards with unique codes
- ✅ Share codes (4 digits + special character) for edit access
- ✅ View codes (5 digits) for view-only access
- ✅ Private mode (no sharing)
- ✅ Automatic expiry (30 minutes default for edit mode)
- ✅ Manual save functionality (no auto-save)
- ✅ Modern dark theme UI
- ✅ Responsive design

## Production Considerations
1. **Database Integration**: Replace in-memory storage with a proper database
2. **Environment Variables**: Add database connection strings and other secrets
3. **Rate Limiting**: Implement API rate limiting
4. **Security**: Add input validation and sanitization
5. **Monitoring**: Set up logging and monitoring

## Troubleshooting
- If you encounter deployment issues, check the Vercel logs
- Ensure all dependencies are properly listed in package.json
- Verify that the vercel.json configuration is correct

## Support
For issues related to:
- Vercel deployment: Check Vercel documentation
- Application functionality: Review the main README.md
- Database integration: Consider using Vercel's database integrations 