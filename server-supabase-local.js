const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load local configuration
const config = require('./config-local');

const app = express();
const PORT = config.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Debug logging function
function debugLog(message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    if (data) {
        console.log('Data:', JSON.stringify(data, null, 2));
    }
}

// Initialize Supabase client
const supabaseUrl = config.SUPABASE_URL;
const supabaseKey = config.SUPABASE_ANON_KEY;

debugLog('Initializing Supabase client...', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlLength: supabaseUrl ? supabaseUrl.length : 0,
    keyLength: supabaseKey ? supabaseKey.length : 0
});

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_supabase_project_url_here')) {
    console.error('❌ Missing or invalid Supabase credentials!');
    console.error('Please update config-local.js with your actual Supabase credentials.');
    console.error('1. Go to your Supabase dashboard');
    console.error('2. Settings → API');
    console.error('3. Copy Project URL and anon public key');
    console.error('4. Update config-local.js');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test Supabase connection
async function testSupabaseConnection() {
    try {
        debugLog('Testing Supabase connection...');
        const { data, error } = await supabase
            .from('clipboards')
            .select('count')
            .limit(1);
        
        if (error) {
            debugLog('❌ Supabase connection test failed:', error);
            console.error('❌ Database connection failed!');
            console.error('Make sure:');
            console.error('1. Your Supabase project is active');
            console.error('2. You ran the supabase-setup.sql in SQL Editor');
            console.error('3. Your credentials are correct');
            return false;
        }
        
        debugLog('✅ Supabase connection test successful');
        console.log('✅ Connected to Supabase successfully!');
        return true;
    } catch (error) {
        debugLog('❌ Supabase connection test error:', error);
        return false;
    }
}

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
app.post('/api/clipboard', async (req, res) => {
    const { content, accessType, expiryHours } = req.body;
    
    debugLog('Creating clipboard:', { content: content?.substring(0, 50) + '...', accessType, expiryHours });
    
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
            debugLog('❌ Supabase error:', error);
            if (error.code === '23505') { // Unique constraint violation
                return res.status(500).json({ error: 'Code collision, please try again' });
            }
            return res.status(500).json({ error: 'Database error: ' + error.message });
        }
        
        debugLog('✅ Clipboard created successfully:', { id: data.id, shareCode, viewCode });
        
        res.json({
            id: data.id,
            shareCode: accessType === 'private' ? null : shareCode,
            viewCode: accessType === 'view' ? viewCode : null,
            accessType: accessType || 'edit',
            expiryAt,
            message: 'Clipboard created successfully'
        });
    } catch (error) {
        debugLog('❌ Error creating clipboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get clipboard by share code (edit mode)
app.get('/api/clipboard/share/:code', async (req, res) => {
    const { code } = req.params;
    
    debugLog('Fetching clipboard by share code:', { code });
    
    try {
        const { data, error } = await supabase
            .from('clipboards')
            .select('*')
            .eq('share_code', code)
            .single();

        if (error || !data) {
            debugLog('❌ Clipboard not found:', { code, error });
            return res.status(404).json({ error: 'Clipboard not found' });
        }

        // Check if expired
        if (data.expiry_at && new Date(data.expiry_at) <= new Date()) {
            debugLog('❌ Clipboard expired:', { code, expiryAt: data.expiry_at });
            return res.status(410).json({ error: 'Clipboard has expired' });
        }

        debugLog('✅ Clipboard fetched successfully:', { id: data.id, code });

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
        debugLog('❌ Error fetching clipboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get clipboard by view code (view mode)
app.get('/api/clipboard/view/:code', async (req, res) => {
    const { code } = req.params;
    
    debugLog('Fetching clipboard by view code:', { code });
    
    try {
        const { data, error } = await supabase
            .from('clipboards')
            .select('*')
            .eq('view_code', code)
            .single();

        if (error || !data) {
            debugLog('❌ Clipboard not found:', { code, error });
            return res.status(404).json({ error: 'Clipboard not found' });
        }

        // Check if expired
        if (data.expiry_at && new Date(data.expiry_at) <= new Date()) {
            debugLog('❌ Clipboard expired:', { code, expiryAt: data.expiry_at });
            return res.status(410).json({ error: 'Clipboard has expired' });
        }

        debugLog('✅ Clipboard fetched successfully:', { id: data.id, code });

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
        debugLog('❌ Error fetching clipboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update clipboard
app.put('/api/clipboard/:id', async (req, res) => {
    const { id } = req.params;
    const { content, shareCode } = req.body;
    
    debugLog('Updating clipboard:', { id, content: content?.substring(0, 50) + '...', shareCode });
    
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
            debugLog('❌ Clipboard not found or access denied:', { id, shareCode });
            return res.status(404).json({ error: 'Clipboard not found or access denied' });
        }

        // Check if expired
        if (existingClipboard.expiry_at && new Date(existingClipboard.expiry_at) <= new Date()) {
            debugLog('❌ Clipboard expired:', { id, expiryAt: existingClipboard.expiry_at });
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
            debugLog('❌ Supabase update error:', error);
            return res.status(500).json({ error: 'Failed to update clipboard' });
        }
        
        debugLog('✅ Clipboard updated successfully:', { id });

        res.json({
            message: 'Clipboard updated successfully',
            content: data.content,
            updatedAt: data.updated_at,
            lastEditAt: data.last_edit_at
        });
    } catch (error) {
        debugLog('❌ Error updating clipboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete clipboard
app.delete('/api/clipboard/:id', async (req, res) => {
    const { id } = req.params;
    const { shareCode } = req.body;
    
    debugLog('Deleting clipboard:', { id, shareCode });
    
    try {
        const { error } = await supabase
            .from('clipboards')
            .delete()
            .eq('id', id)
            .eq('share_code', shareCode);

        if (error) {
            debugLog('❌ Supabase delete error:', error);
            return res.status(404).json({ error: 'Clipboard not found or access denied' });
        }
        
        debugLog('✅ Clipboard deleted successfully:', { id });

        res.json({ message: 'Clipboard deleted successfully' });
    } catch (error) {
        debugLog('❌ Error deleting clipboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
async function startServer() {
    console.log('🚀 Starting Smart Clipboard server with Supabase...');
    console.log(`📍 Server will run on: http://localhost:${PORT}`);
    
    // Test Supabase connection first
    const connectionOk = await testSupabaseConnection();
    if (!connectionOk) {
        console.log('❌ Failed to connect to Supabase. Please check your configuration.');
        process.exit(1);
    }
    
    app.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
        console.log('📝 Ready to test your Smart Clipboard app!');
        console.log('🌐 Open your browser and go to: http://localhost:3002');
    });
}

startServer(); 