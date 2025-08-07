# 🔧 Local Supabase Setup Guide

## 🚀 **Step-by-Step Setup for Local Testing**

### **Step 1: Create Supabase Project**

1. **Go to Supabase Dashboard:**
   - Visit [supabase.com/dashboard](https://supabase.com/dashboard)
   - Click **"New Project"**

2. **Configure Project:**
   - **Name:** `smart-clipboard`
   - **Database Password:** Create a strong password
   - **Region:** Choose closest to you
   - Click **"Create new project"**

3. **Wait for Setup:**
   - Project creation takes 2-3 minutes
   - You'll see "Project is ready" when done

### **Step 2: Get Your Credentials**

1. **Go to Settings → API:**
   - In your Supabase dashboard
   - Click **"Settings"** in the left sidebar
   - Click **"API"**

2. **Copy Credentials:**
   - **Project URL:** Copy the URL (looks like `https://your-project-id.supabase.co`)
   - **anon public:** Copy the key (starts with `eyJ...`)

### **Step 3: Set Up Database Table**

1. **Go to SQL Editor:**
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New query"**

2. **Run Setup SQL:**
   - Copy the content from `supabase-setup.sql`
   - Paste it into the SQL Editor
   - Click **"Run"** button

3. **Verify Table Created:**
   - Go to **"Table Editor"**
   - You should see `clipboards` table

### **Step 4: Configure Local Server**

1. **Update `config-local.js`:**
   ```javascript
   module.exports = {
       SUPABASE_URL: 'https://your-project-id.supabase.co', // Your actual URL
       SUPABASE_ANON_KEY: 'eyJ...', // Your actual key
       PORT: 3002,
       NODE_ENV: 'development'
   };
   ```

2. **Replace the placeholder values** with your actual Supabase credentials

### **Step 5: Test Locally**

1. **Start the Local Server:**
   ```bash
   cd online-clipboard
   node server-supabase-local.js
   ```

2. **Check for Success:**
   - You should see: `✅ Connected to Supabase successfully!`
   - Server should start: `✅ Server running on http://localhost:3002`

3. **Open Browser:**
   - Go to: `http://localhost:3002`
   - Test creating a clipboard
   - Test sharing functionality

## 🔍 **Troubleshooting**

### **If you get "Missing Supabase credentials":**
- Check that you updated `config-local.js` with real values
- Make sure you copied the full URL and key

### **If you get "Database connection failed":**
- Verify your Supabase project is active
- Check that you ran the SQL setup script
- Verify your credentials are correct

### **If you get "relation 'clipboards' does not exist":**
- Go to SQL Editor and run the `supabase-setup.sql` script
- Check that the table was created in Table Editor

### **If the server won't start:**
- Make sure you're in the correct directory
- Check that all dependencies are installed: `npm install`
- Verify the Supabase client is installed: `npm install @supabase/supabase-js`

## ✅ **What to Test**

1. **Create Clipboard:**
   - Enter some text
   - Click "Save and share code with edit access"
   - Verify you get a share code

2. **Access Clipboard:**
   - Use the share code to access the clipboard
   - Verify you can edit the content
   - Test saving changes

3. **View Mode:**
   - Create a clipboard with "Share only with no edit"
   - Use the view code to access it
   - Verify you can view but not edit

4. **Delete Clipboard:**
   - Create a clipboard
   - Access it with the share code
   - Test the delete functionality

## 🎯 **Success Indicators**

- ✅ Server starts without errors
- ✅ "Connected to Supabase successfully!" message
- ✅ Can create clipboards and get codes
- ✅ Can access clipboards with codes
- ✅ Can edit and save changes
- ✅ Can delete clipboards

## 🚀 **Next Steps**

Once local testing works:
1. Push to GitHub
2. Deploy to Vercel
3. Set environment variables in Vercel
4. Test production deployment

## 📝 **Debug Logs**

The local server provides detailed logs:
- `[timestamp] Creating clipboard: {...}`
- `[timestamp] ✅ Clipboard created successfully: {...}`
- `[timestamp] ❌ Error: {...}`

Check the console for detailed debugging information! 