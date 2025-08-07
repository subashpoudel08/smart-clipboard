# 🔧 Supabase-Vercel Connection Troubleshooting

## 🚨 **Common Issues & Solutions**

### **Issue 1: Environment Variables Not Set in Vercel**

**Symptoms:**
- "Server configuration error" message
- API calls failing with 500 errors
- No data being saved

**Solution:**
1. **Go to Vercel Dashboard:**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click on your project

2. **Check Environment Variables:**
   - Go to **"Settings"** tab
   - Click **"Environment Variables"**
   - Verify these are set:
     - `SUPABASE_URL` = `https://dfvkktzzwqdizhqoooij.supabase.co`
     - `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmdmtrdHp6d3FkaXpocW9vb2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDE0NzcsImV4cCI6MjA3MDA3NzQ3N30.oAcWA14Stlc6Fer0Mt250wr6RwjFzg_WSvvqlTMzQsA`

3. **Redeploy After Setting Variables:**
   - Go to **"Deployments"** tab
   - Click **"Redeploy"** on the latest deployment

### **Issue 2: Wrong Environment Variable Names**

**Symptoms:**
- Variables not being read
- "Missing Supabase credentials" error

**Solution:**
- **Exact names required:** `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- **Case sensitive** - must be exactly as shown
- **No spaces** before or after the values

### **Issue 3: Supabase Project Not Active**

**Symptoms:**
- Connection timeouts
- "Database connection failed" errors

**Solution:**
1. **Check Supabase Project Status:**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Verify your project is **active** (not paused)
   - Check if you're within free tier limits

2. **Verify Project URL:**
   - Go to **Settings** → **API**
   - Copy the **Project URL** again
   - Make sure it matches what you have in Vercel

### **Issue 4: Database Table Not Created**

**Symptoms:**
- "relation 'clipboards' does not exist" error
- Data not being saved

**Solution:**
1. **Run SQL Setup:**
   - Go to Supabase Dashboard → **SQL Editor**
   - Create **New Query**
   - Copy and paste the content from `supabase-setup.sql`
   - Click **"Run"**

2. **Verify Table Exists:**
   - Go to **Table Editor**
   - You should see `clipboards` table
   - Check that all columns exist

### **Issue 5: RLS (Row Level Security) Blocking Access**

**Symptoms:**
- "permission denied" errors
- Data not accessible

**Solution:**
1. **Check RLS Settings:**
   - Go to Supabase Dashboard → **Table Editor**
   - Click on `clipboards` table
   - Go to **"RLS"** tab
   - Make sure RLS is **enabled** but **policies allow access**

2. **Verify RLS Policy:**
   ```sql
   -- This should be in your supabase-setup.sql
   CREATE POLICY "Enable all access for demo" ON clipboards
   FOR ALL USING (true);
   ```

## 🔍 **Step-by-Step Verification**

### **Step 1: Test Supabase Connection Locally**

```bash
cd online-clipboard
node server-supabase-local.js
```

**Expected Output:**
```
🚀 Starting Smart Clipboard server with Supabase...
📍 Server will run on: http://localhost:3002
✅ Connected to Supabase successfully!
✅ Server running on http://localhost:3002
```

### **Step 2: Check Vercel Function Logs**

1. **Go to Vercel Dashboard:**
   - Click on your project
   - Go to **"Functions"** tab
   - Click on **"clipboard-supabase.js"**

2. **Look for these logs:**
   ```
   [timestamp] Initializing Supabase client...
   [timestamp] Testing Supabase connection...
   [timestamp] ✅ Supabase connection test successful
   ```

### **Step 3: Test API Endpoints**

**Test with curl or browser:**
```bash
# Test your Vercel app URL
curl -X POST https://your-app.vercel.app/api/clipboard \
  -H "Content-Type: application/json" \
  -d '{"content":"test","accessType":"edit"}'
```

**Expected Response:**
```json
{
  "id": 1,
  "shareCode": "1234!",
  "viewCode": "12345",
  "accessType": "edit",
  "message": "Clipboard created successfully"
}
```

## 🛠️ **Quick Fix Commands**

### **1. Update Environment Variables in Vercel:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. **Delete** existing `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. **Add them again** with correct values
4. **Redeploy** the project

### **2. Verify Supabase Setup:**
```sql
-- Run this in Supabase SQL Editor
SELECT * FROM clipboards LIMIT 1;
```

### **3. Test Database Connection:**
```sql
-- Run this in Supabase SQL Editor
INSERT INTO clipboards (share_code, view_code, content, access_type, created_at, updated_at, last_edit_at, is_editable)
VALUES ('TEST1!', '12345', 'Test content', 'edit', NOW(), NOW(), NOW(), true);
```

## 🎯 **Common Error Messages & Solutions**

| Error Message | Solution |
|---------------|----------|
| "Missing Supabase environment variables" | Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel |
| "Database connection failed" | Check Supabase project status and credentials |
| "relation 'clipboards' does not exist" | Run supabase-setup.sql in Supabase SQL Editor |
| "permission denied" | Check RLS policies in Supabase |
| "Network error" | Check Vercel function logs for details |

## 🚀 **Final Verification Checklist**

- [ ] Supabase project is active
- [ ] Environment variables set in Vercel
- [ ] Database table created
- [ ] RLS policies configured
- [ ] Local testing works
- [ ] Vercel function logs show successful connection
- [ ] API endpoints respond correctly

## 📞 **Still Having Issues?**

If you're still experiencing problems:

1. **Check Vercel Function Logs** for specific error messages
2. **Verify Supabase Dashboard** shows your project is active
3. **Test with a simple curl command** to isolate the issue
4. **Compare local vs Vercel** behavior to identify differences

The most common issue is **environment variables not being set correctly** in Vercel or **not redeploying** after setting them. 