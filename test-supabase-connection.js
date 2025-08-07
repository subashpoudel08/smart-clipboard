const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials (same as in config-local.js)
const supabaseUrl = 'https://dfvkktzzwqdizhqoooij.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmdmtrdHp6d3FkaXpocW9vb2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDE0NzcsImV4cCI6MjA3MDA3NzQ3N30.oAcWA14Stlc6Fer0Mt250wr6RwjFzg_WSvvqlTMzQsA';

console.log('🔍 Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseKey.length);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('\n📡 Testing database connection...');
        
        // Test 1: Check if table exists
        const { data: tableTest, error: tableError } = await supabase
            .from('clipboards')
            .select('count')
            .limit(1);
        
        if (tableError) {
            console.log('❌ Table test failed:', tableError.message);
            if (tableError.message.includes('relation "clipboards" does not exist')) {
                console.log('💡 Solution: Run supabase-setup.sql in Supabase SQL Editor');
            }
            return false;
        }
        
        console.log('✅ Table exists and is accessible');
        
        // Test 2: Try to insert a test record
        console.log('\n📝 Testing insert operation...');
        const testData = {
            share_code: 'TEST' + Date.now() + '!',
            view_code: '12345',
            content: 'Test connection content',
            access_type: 'edit',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_edit_at: new Date().toISOString(),
            is_editable: true
        };
        
        const { data: insertData, error: insertError } = await supabase
            .from('clipboards')
            .insert(testData)
            .select()
            .single();
        
        if (insertError) {
            console.log('❌ Insert test failed:', insertError.message);
            if (insertError.message.includes('permission denied')) {
                console.log('💡 Solution: Check RLS policies in Supabase');
            }
            return false;
        }
        
        console.log('✅ Insert operation successful');
        console.log('📊 Inserted record ID:', insertData.id);
        
        // Test 3: Try to read the record
        console.log('\n📖 Testing read operation...');
        const { data: readData, error: readError } = await supabase
            .from('clipboards')
            .select('*')
            .eq('id', insertData.id)
            .single();
        
        if (readError) {
            console.log('❌ Read test failed:', readError.message);
            return false;
        }
        
        console.log('✅ Read operation successful');
        console.log('📄 Read content:', readData.content);
        
        // Test 4: Clean up test record
        console.log('\n🧹 Cleaning up test record...');
        const { error: deleteError } = await supabase
            .from('clipboards')
            .delete()
            .eq('id', insertData.id);
        
        if (deleteError) {
            console.log('⚠️ Cleanup failed (not critical):', deleteError.message);
        } else {
            console.log('✅ Cleanup successful');
        }
        
        console.log('\n🎉 All tests passed! Supabase connection is working correctly.');
        console.log('💡 Your Vercel app should work with these credentials.');
        
        return true;
        
    } catch (error) {
        console.log('❌ Connection test failed:', error.message);
        console.log('💡 Check your Supabase project status and credentials.');
        return false;
    }
}

// Run the test
testConnection().then(success => {
    if (success) {
        console.log('\n🚀 Ready to deploy to Vercel!');
        console.log('📋 Make sure to set these environment variables in Vercel:');
        console.log('   SUPABASE_URL =', supabaseUrl);
        console.log('   SUPABASE_ANON_KEY =', supabaseKey.substring(0, 20) + '...');
    } else {
        console.log('\n🔧 Please fix the issues above before deploying to Vercel.');
    }
    process.exit(success ? 0 : 1);
}); 