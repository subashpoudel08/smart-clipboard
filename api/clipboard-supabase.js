const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

// Create new clipboard
app.post('/', async (req, res) => {
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

    try {
        const { data, error } = await supabase
            .from('clipboards')
            .insert({
                share_code: shareCode,
                view_code: viewCode,
                content: content,
                access_type: accessType || 'edit',
                expiry_at: expiryAt,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_edit_at: new Date().toISOString(),
                is_editable: true
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === '23505') { // Unique constraint violation
                return res.status(500).json({ error: 'Code collision, please try again' });
            }
            return res.status(500).json({ error: 'Database error: ' + error.message });
        }
        
        res.json({
            id: data.id,
            shareCode: accessType === 'private' ? null : shareCode,
            viewCode: accessType === 'view' ? viewCode : null,
            accessType: accessType || 'edit',
            expiryAt,
            message: 'Clipboard created successfully'
        });
    } catch (error) {
        console.error('Error creating clipboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get clipboard by share code (edit mode)
app.get('/share/:code', async (req, res) => {
    const { code } = req.params;
    
    try {
        const { data, error } = await supabase
            .from('clipboards')
            .select('*')
            .eq('share_code', code)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Clipboard not found' });
        }

        // Check if expired
        if (data.expiry_at && new Date(data.expiry_at) <= new Date()) {
            return res.status(410).json({ error: 'Clipboard has expired' });
        }

        res.json({
            id: data.id,
            content: data.content,
            shareCode: data.share_code,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            lastEditAt: data.last_edit_at,
            isEditable: true
        });
    } catch (error) {
        console.error('Error fetching clipboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get clipboard by view code (view mode)
app.get('/view/:code', async (req, res) => {
    const { code } = req.params;
    
    try {
        const { data, error } = await supabase
            .from('clipboards')
            .select('*')
            .eq('view_code', code)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Clipboard not found' });
        }

        // Check if expired
        if (data.expiry_at && new Date(data.expiry_at) <= new Date()) {
            return res.status(410).json({ error: 'Clipboard has expired' });
        }

        res.json({
            id: data.id,
            content: data.content,
            viewCode: data.view_code,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            lastEditAt: data.last_edit_at,
            accessType: data.access_type,
            isEditable: false
        });
    } catch (error) {
        console.error('Error fetching clipboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update clipboard
app.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { content, shareCode } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    try {
        // First check if clipboard exists and user has access
        const { data: existingClipboard, error: fetchError } = await supabase
            .from('clipboards')
            .select('*')
            .eq('id', id)
            .eq('share_code', shareCode)
            .single();

        if (fetchError || !existingClipboard) {
            return res.status(404).json({ error: 'Clipboard not found or access denied' });
        }

        // Check if expired
        if (existingClipboard.expiry_at && new Date(existingClipboard.expiry_at) <= new Date()) {
            return res.status(410).json({ error: 'Clipboard has expired' });
        }

        // Update the clipboard
        const { data, error } = await supabase
            .from('clipboards')
            .update({
                content: content,
                updated_at: new Date().toISOString(),
                last_edit_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('share_code', shareCode)
            .select()
            .single();

        if (error) {
            console.error('Supabase update error:', error);
            return res.status(500).json({ error: 'Failed to update clipboard' });
        }
        
        res.json({
            message: 'Clipboard updated successfully',
            content: data.content,
            updatedAt: data.updated_at,
            lastEditAt: data.last_edit_at
        });
    } catch (error) {
        console.error('Error updating clipboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete clipboard
app.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { shareCode } = req.body;
    
    try {
        const { error } = await supabase
            .from('clipboards')
            .delete()
            .eq('id', id)
            .eq('share_code', shareCode);

        if (error) {
            console.error('Supabase delete error:', error);
            return res.status(404).json({ error: 'Clipboard not found or access denied' });
        }
        
        res.json({ message: 'Clipboard deleted successfully' });
    } catch (error) {
        console.error('Error deleting clipboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = app; 