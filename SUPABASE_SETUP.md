# Supabase Setup Guide for Smart Clipboard

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `smart-clipboard` (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose the closest region to your users
5. Click "Create new project"
6. Wait for the project to be set up (this may take a few minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## Step 3: Set Up the Database Table

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the contents of `supabase-setup.sql`
4. Click "Run" to execute the SQL

This will create:
- The `clipboards` table with all necessary columns
- Indexes for better performance
- Row Level Security (RLS) policies
- Automatic timestamp updates
- A cleanup function for expired clipboards

## Step 4: Configure Vercel Environment Variables

### Option A: Using Vercel CLI
```bash
vercel env add SUPABASE_URL
# Enter your Supabase Project URL

vercel env add SUPABASE_ANON_KEY
# Enter your Supabase anon public key
```

### Option B: Using Vercel Dashboard
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - **Name**: `SUPABASE_URL`
   - **Value**: Your Supabase Project URL
   - **Environment**: Production, Preview, Development
4. Add another variable:
   - **Name**: `SUPABASE_ANON_KEY`
   - **Value**: Your Supabase anon public key
   - **Environment**: Production, Preview, Development

## Step 5: Deploy to Vercel

1. Install Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the application:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Link to existing project: No
   - Project name: `smart-clipboard` (or your preferred name)
   - Directory: `./` (current directory)
   - Override settings: No

## Step 6: Test Your Deployment

1. Visit your deployed URL (e.g., `https://your-project.vercel.app`)
2. Create a new clipboard
3. Test sharing and editing functionality
4. Verify that data persists in your Supabase database

## Database Schema

The `clipboards` table has the following structure:

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key, auto-incrementing |
| `share_code` | TEXT | Unique 4-digit + special character code for edit access |
| `view_code` | TEXT | Unique 5-digit code for view-only access |
| `content` | TEXT | The clipboard content |
| `created_at` | TIMESTAMP | When the clipboard was created |
| `updated_at` | TIMESTAMP | When the clipboard was last updated |
| `last_edit_at` | TIMESTAMP | When the clipboard was last edited |
| `expiry_at` | TIMESTAMP | When the clipboard expires (optional) |
| `access_type` | TEXT | 'edit', 'view', or 'private' |
| `is_editable` | BOOLEAN | Whether the clipboard can be edited |

## Security Features

- **Row Level Security (RLS)**: Enabled on the clipboards table
- **Unique Constraints**: Share codes and view codes are unique
- **Access Control**: Users can only edit clipboards with the correct share code
- **Expiry Management**: Automatic cleanup of expired clipboards

## Monitoring and Maintenance

### View Your Data
1. Go to your Supabase dashboard
2. Navigate to **Table Editor**
3. Click on the `clipboards` table to view all data

### Clean Up Expired Clipboards
You can manually clean up expired clipboards by running:
```sql
SELECT cleanup_expired_clipboards();
```

### Set Up Automatic Cleanup (Optional)
You can set up a cron job or use Supabase's Edge Functions to automatically clean up expired clipboards.

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Ensure you've set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel
   - Redeploy after adding environment variables

2. **"Table does not exist"**
   - Run the SQL setup script in Supabase SQL Editor
   - Check that the table was created successfully

3. **"Permission denied"**
   - Verify RLS policies are set up correctly
   - Check that the anon key has the right permissions

4. **"Code collision"**
   - This is normal and handled automatically
   - The app will retry with a new code

### Getting Help

- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Project Issues**: Check the main README.md for application-specific help

## Production Considerations

1. **Backup Strategy**: Set up regular database backups in Supabase
2. **Monitoring**: Use Supabase's built-in monitoring tools
3. **Rate Limiting**: Consider implementing API rate limiting
4. **Custom Domain**: Set up a custom domain in Vercel
5. **SSL**: Vercel provides automatic SSL certificates
6. **CDN**: Vercel's global CDN ensures fast loading worldwide 