const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

// In-memory storage for demo purposes
// In production, you should use a proper database like MongoDB, PostgreSQL, or Supabase
let clipboards = [];
let nextId = 1;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Generate unique codes
function generateShareCode() {
    const digits = Math.floor(1000 + Math.random() * 9000); // 4 digits
    const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '?'];
    const specialChar = specialChars[Math.floor(Math.random() * specialChars.length)];
    return `${digits}${specialChar}`;
}

function generateViewCode() {
    return Math.floor(10000 + Math.random() * 90000).toString(); // 5 digits
}

// Cleanup expired clipboards
function cleanupExpiredClipboards() {
    const now = new Date();
    clipboards = clipboards.filter(clipboard => {
        if (!clipboard.expiryAt) return true;
        return new Date(clipboard.expiryAt) > now;
    });
}

// Run cleanup every time we access the data
cleanupExpiredClipboards();

// Create new clipboard
app.post('/', (req, res) => {
    const { content, accessType, expiryHours } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    const shareCode = generateShareCode();
    const viewCode = generateViewCode();
    
    // Calculate expiry time
    let expiryAt = null;
    if (accessType === 'edit' && expiryHours) {
        expiryAt = new Date(Date.now() + (expiryHours * 60 * 60 * 1000)).toISOString();
    } else if (accessType === 'edit') {
        // Default 30 minutes for edit mode
        expiryAt = new Date(Date.now() + (30 * 60 * 1000)).toISOString();
    }

    const clipboard = {
        id: nextId++,
        shareCode,
        viewCode,
        content,
        accessType: accessType || 'edit',
        expiryAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastEditAt: new Date().toISOString(),
        isEditable: true
    };

    clipboards.push(clipboard);
    
    res.json({
        id: clipboard.id,
        shareCode: accessType === 'private' ? null : shareCode,
        viewCode: accessType === 'view' ? viewCode : null,
        accessType: accessType || 'edit',
        expiryAt,
        message: 'Clipboard created successfully'
    });
});

// Get clipboard by share code (edit mode)
app.get('/share/:code', (req, res) => {
    const { code } = req.params;
    
    const clipboard = clipboards.find(c => c.shareCode === code);
    
    if (!clipboard) {
        return res.status(404).json({ error: 'Clipboard not found' });
    }

    // Check if expired
    if (clipboard.expiryAt && new Date(clipboard.expiryAt) <= new Date()) {
        return res.status(410).json({ error: 'Clipboard has expired' });
    }

    res.json({
        id: clipboard.id,
        content: clipboard.content,
        shareCode: clipboard.shareCode,
        createdAt: clipboard.createdAt,
        updatedAt: clipboard.updatedAt,
        lastEditAt: clipboard.lastEditAt,
        isEditable: true
    });
});

// Get clipboard by view code (view mode)
app.get('/view/:code', (req, res) => {
    const { code } = req.params;
    
    const clipboard = clipboards.find(c => c.viewCode === code);
    
    if (!clipboard) {
        return res.status(404).json({ error: 'Clipboard not found' });
    }

    // Check if expired
    if (clipboard.expiryAt && new Date(clipboard.expiryAt) <= new Date()) {
        return res.status(410).json({ error: 'Clipboard has expired' });
    }

    res.json({
        id: clipboard.id,
        content: clipboard.content,
        viewCode: clipboard.viewCode,
        createdAt: clipboard.createdAt,
        updatedAt: clipboard.updatedAt,
        lastEditAt: clipboard.lastEditAt,
        accessType: clipboard.accessType,
        isEditable: false
    });
});

// Update clipboard
app.put('/:id', (req, res) => {
    const { id } = req.params;
    const { content, shareCode } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    const clipboard = clipboards.find(c => c.id == id && c.shareCode === shareCode);
    
    if (!clipboard) {
        return res.status(404).json({ error: 'Clipboard not found or access denied' });
    }

    // Check if expired
    if (clipboard.expiryAt && new Date(clipboard.expiryAt) <= new Date()) {
        return res.status(410).json({ error: 'Clipboard has expired' });
    }

    clipboard.content = content;
    clipboard.updatedAt = new Date().toISOString();
    clipboard.lastEditAt = new Date().toISOString();
    
    res.json({
        message: 'Clipboard updated successfully',
        content: clipboard.content,
        updatedAt: clipboard.updatedAt,
        lastEditAt: clipboard.lastEditAt
    });
});

// Delete clipboard
app.delete('/:id', (req, res) => {
    const { id } = req.params;
    const { shareCode } = req.body;
    
    const clipboardIndex = clipboards.findIndex(c => c.id == id && c.shareCode === shareCode);
    
    if (clipboardIndex === -1) {
        return res.status(404).json({ error: 'Clipboard not found or access denied' });
    }

    clipboards.splice(clipboardIndex, 1);
    
    res.json({ message: 'Clipboard deleted successfully' });
});

module.exports = app; 