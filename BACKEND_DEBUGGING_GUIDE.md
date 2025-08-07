# 🔍 Backend Debugging Guide

## 🚨 **How to Debug Backend Issues Step by Step**

### **1. Frontend Network Debugging**

#### **Open Browser Developer Tools:**
1. Press `F12` or `Ctrl+Shift+I`
2. Go to **Network** tab
3. Go to **Console** tab
4. Clear the console: `console.clear()`

#### **Test API Calls:**
1. Try to create a clipboard
2. Watch the Network tab for API calls
3. Check Console for debug logs

#### **What to Look For:**

**✅ Good Response:**
```
Status: 200 OK
Response: {"id": 1, "shareCode": "1234!", "message": "Clipboard created successfully"}
```

**❌ Bad Responses:**
```
Status: 404 Not Found
Status: 500 Internal Server Error
Status: 502 Bad Gateway
Status: 503 Service Unavailable
```

### **2. Common Error Patterns & Solutions**

#### **Network Error (TypeError: fetch failed)**
**Problem:** Frontend can't reach backend
**Debug Steps:**
1. Check if API URL is correct
2. Verify Vercel deployment is live
3. Check if Supabase environment variables are set

**Solution:**
```javascript
// Check your API_BASE URL
console.log('API_BASE:', API_BASE);
// Should be: https://your-app.vercel.app/api/clipboard
```

#### **404 Not Found**
**Problem:** API endpoint doesn't exist
**Debug Steps:**
1. Check `vercel.json` routing
2. Verify `api/clipboard-supabase.js` exists
3. Check Vercel function logs

**Solution:**
```json
// vercel.json should have:
{
  "src": "/api/clipboard/(.*)",
  "dest": "/api/clipboard-supabase.js"
}
```

#### **500 Internal Server Error**
**Problem:** Backend code has an error
**Debug Steps:**
1. Check Vercel function logs
2. Verify Supabase credentials
3. Check database table exists

**Solution:**
```bash
# Check Vercel logs
vercel logs your-app-name
```

#### **502 Bad Gateway**
**Problem:** Vercel can't reach your function
**Debug Steps:**
1. Check function syntax
2. Verify dependencies are installed
3. Check environment variables

### **3. Vercel Function Debugging**

#### **Check Vercel Logs:**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Functions** tab
4. Click on your function
5. Check **Logs** section

#### **Common Vercel Issues:**

**Missing Environment Variables:**
```
Error: Missing Supabase environment variables
```
**Fix:** Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel dashboard

**Function Not Found:**
```
Error: Function not found
```
**Fix:** Check `vercel.json` routing configuration

**Dependency Issues:**
```
Error: Cannot find module '@supabase/supabase-js'
```
**Fix:** Ensure `package.json` includes the dependency

### **4. Supabase Debugging**

#### **Check Supabase Connection:**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Test connection:

```sql
-- Test if table exists
SELECT * FROM clipboards LIMIT 1;

-- Check table structure
\d clipboards;
```

#### **Common Supabase Issues:**

**Table Doesn't Exist:**
```
Error: relation "clipboards" does not exist
```
**Fix:** Run the SQL from `supabase-setup.sql`

**Permission Denied:**
```
Error: permission denied for table clipboards
```
**Fix:** Check RLS policies in Supabase

**Connection Failed:**
```
Error: connection to database failed
```
**Fix:** Check Supabase project status and credentials

### **5. Local Testing vs Production**

#### **Test Locally First:**
```bash
# Test your API locally
curl -X POST http://localhost:3002/api/clipboard \
  -H "Content-Type: application/json" \
  -d '{"content":"test","accessType":"edit"}'
```

#### **Compare Environments:**
- **Local:** Uses SQLite database
- **Production:** Uses Supabase PostgreSQL
- **Local:** Runs on Express server
- **Production:** Runs on Vercel serverless

### **6. Debugging Checklist**

#### **When You Get "Network Error":**

1. **Check Browser Console:**
   ```javascript
   // Look for these logs:
   [timestamp] Making API request to create clipboard: {url: "...", method: "POST", data: {...}}
   [timestamp] API Response received: {status: 200, ok: true, ...}
   ```

2. **Check Network Tab:**
   - Is the request being made?
   - What's the response status?
   - What's the response body?

3. **Check Vercel Logs:**
   - Go to Vercel dashboard
   - Check function logs
   - Look for error messages

4. **Check Supabase:**
   - Verify project is active
   - Check database connection
   - Verify table exists

### **7. Quick Debug Commands**

#### **Test API Endpoint:**
```bash
# Test if your API is reachable
curl -I https://your-app.vercel.app/api/clipboard
```

#### **Check Environment Variables:**
```javascript
// Add this to your frontend temporarily
console.log('Current URL:', window.location.origin);
console.log('API Base:', API_BASE);
```

#### **Test Supabase Connection:**
```javascript
// Add this to your backend temporarily
console.log('Supabase URL:', process.env.SUPABASE_URL);
console.log('Supabase Key exists:', !!process.env.SUPABASE_ANON_KEY);
```

### **8. Common Solutions**

#### **If API calls fail:**
1. Check `vercel.json` routing
2. Verify function file exists
3. Check environment variables
4. Test Supabase connection

#### **If database operations fail:**
1. Run Supabase setup SQL
2. Check RLS policies
3. Verify credentials
4. Test connection

#### **If frontend can't reach backend:**
1. Check API_BASE URL
2. Verify Vercel deployment
3. Check CORS settings
4. Test network connectivity

## 🎯 **Pro Tips**

1. **Always check browser console first** - most errors show up there
2. **Use Network tab** to see actual HTTP requests/responses
3. **Check Vercel logs** for server-side errors
4. **Test Supabase connection** separately
5. **Compare local vs production** behavior
6. **Use debug logging** to trace execution flow

## 🚀 **Emergency Debug Mode**

Add this to your frontend temporarily:
```javascript
// Add to script.js for emergency debugging
window.debugMode = true;
console.log('=== DEBUG MODE ENABLED ===');
console.log('API_BASE:', API_BASE);
console.log('Current URL:', window.location.href);
console.log('User Agent:', navigator.userAgent);
``` 