const sqlite3 = require('sqlite3').verbose();

// Create a new database connection
const db = new sqlite3.Database('clipboard.db');

console.log('Initializing database...');

// Create tables with the correct schema
db.serialize(() => {
    // Drop the table if it exists to ensure clean slate
    db.run(`DROP TABLE IF EXISTS clipboards`, (err) => {
        if (err) {
            console.error('Error dropping table:', err);
        } else {
            console.log('Dropped existing table');
        }
    });

    // Create the table with the correct schema - each column on its own line
    const createTableSQL = `
        CREATE TABLE clipboards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            share_code TEXT UNIQUE NOT NULL,
            view_code TEXT UNIQUE NOT NULL,
            content TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_edit_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expiry_at DATETIME,
            access_type TEXT DEFAULT 'edit',
            is_editable INTEGER DEFAULT 1
        )
    `;
    
    console.log('Creating table with SQL:', createTableSQL);
    
    db.run(createTableSQL, (err) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('Table created successfully with correct schema');
            
            // Verify the schema
            db.all(`PRAGMA table_info(clipboards)`, (err, rows) => {
                if (err) {
                    console.error('Error checking schema:', err);
                } else {
                    console.log('Database schema:');
                    rows.forEach(row => {
                        console.log(`  ${row.name}: ${row.type} (${row.notnull ? 'NOT NULL' : 'NULL'})`);
                    });
                    
                    // Check if all required columns exist
                    const requiredColumns = ['id', 'share_code', 'view_code', 'content', 'created_at', 'updated_at', 'last_edit_at', 'expiry_at', 'access_type', 'is_editable'];
                    const existingColumns = rows.map(row => row.name);
                    
                    console.log('\nChecking required columns:');
                    requiredColumns.forEach(col => {
                        if (existingColumns.includes(col)) {
                            console.log(`  ✓ ${col}`);
                        } else {
                            console.log(`  ✗ ${col} - MISSING!`);
                        }
                    });
                }
                
                // Close the database
                db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                    } else {
                        console.log('\nDatabase initialized successfully!');
                    }
                });
            });
        }
    });
}); 