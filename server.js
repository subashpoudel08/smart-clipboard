const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('clipboard.db');

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS clipboards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        share_code TEXT UNIQUE NOT NULL,
        view_code TEXT UNIQUE NOT NULL,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_edit_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiry_at DATETIME,
        access_type TEXT DEFAULT 'edit', -- 'edit', 'view', 'private'
        is_editable BOOLEAN DEFAULT 1
    )`);
});

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

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create new clipboard
app.post('/api/clipboard', (req, res) => {
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

    const query = `INSERT INTO clipboards (share_code, view_code, content, access_type, expiry_at) VALUES (?, ?, ?, ?, ?)`;
    
    db.run(query, [shareCode, viewCode, content, accessType || 'edit', expiryAt], function(err) {
        if (err) {
            console.error('Database error:', err);
            if (err.message.includes('UNIQUE constraint failed')) {
                // Retry with new codes if collision occurs
                return res.status(500).json({ error: 'Code collision, please try again' });
            }
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        
        res.json({
            id: this.lastID,
            shareCode: accessType === 'private' ? null : shareCode,
            viewCode: accessType === 'view' ? viewCode : null,
            accessType: accessType || 'edit',
            expiryAt,
            message: 'Clipboard created successfully'
        });
    });
});

// Get clipboard by share code (edit mode)
app.get('/api/clipboard/share/:code', (req, res) => {
    const { code } = req.params;
    
    const query = `SELECT * FROM clipboards WHERE share_code = ?`;
    
    db.get(query, [code], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Clipboard not found' });
        }
        
        res.json({
            id: row.id,
            content: row.content,
            shareCode: row.share_code,
            viewCode: row.view_code,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            lastEditAt: row.last_edit_at,
            isEditable: true
        });
    });
});

// Get clipboard by view code (view mode)
app.get('/api/clipboard/view/:code', (req, res) => {
    const { code } = req.params;
    
    const query = `SELECT * FROM clipboards WHERE view_code = ?`;
    
    db.get(query, [code], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Clipboard not found' });
        }
        
        res.json({
            id: row.id,
            content: row.content,
            viewCode: row.view_code,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            lastEditAt: row.last_edit_at,
            accessType: row.access_type,
            isEditable: false
        });
    });
});

// Update clipboard content (edit mode only)
app.put('/api/clipboard/:id', (req, res) => {
    const { id } = req.params;
    const { content, shareCode } = req.body;
    
    if (!content || !shareCode) {
        return res.status(400).json({ error: 'Content and share code are required' });
    }
    
    const query = `UPDATE clipboards SET content = ?, updated_at = CURRENT_TIMESTAMP, last_edit_at = CURRENT_TIMESTAMP WHERE id = ? AND share_code = ?`;
    
    db.run(query, [content, id, shareCode], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Clipboard not found or invalid share code' });
        }
        
        res.json({ message: 'Clipboard updated successfully' });
    });
});

// Delete clipboard
app.delete('/api/clipboard/:id', (req, res) => {
    const { id } = req.params;
    const { shareCode } = req.body;
    
    if (!shareCode) {
        return res.status(400).json({ error: 'Share code is required' });
    }
    
    const query = `DELETE FROM clipboards WHERE id = ? AND share_code = ?`;
    
    db.run(query, [id, shareCode], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Clipboard not found or invalid share code' });
        }
        
        res.json({ message: 'Clipboard deleted successfully' });
    });
});

// Cleanup expired clipboards
function cleanupExpiredClipboards() {
    const query = `DELETE FROM clipboards WHERE expiry_at IS NOT NULL AND expiry_at < datetime('now')`;
    db.run(query, (err) => {
        if (err) {
            console.error('Error cleaning up expired clipboards:', err);
            // Don't crash the server, just log the error
        } else {
            console.log('Cleaned up expired clipboards');
        }
    });
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredClipboards, 5 * 60 * 1000);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    cleanupExpiredClipboards(); // Initial cleanup
}); 