# Next Steps After Migration

## ✅ Completed
- [x] Database migration applied successfully
- [x] Schema updated (removed pdfData/imageData fields)
- [x] Environment variables configured

## 📋 Current Status

Your database migration has been applied. The following changes were made:

### Notice Table
- ❌ Removed: `pdfData`, `imageData`, `pdfimage` columns
- ✅ Kept: `pdfUrl`, `imageUrl`, `pdfFileName`, `imageFileName`

### Pdf Table
- ❌ Removed: `pdfData` column
- ✅ Added: `pdfUrl` column (NOT NULL)

## 🔴 CRITICAL: Next Steps (Do These Now!)

### 1. Create Storage Buckets in Supabase ⚠️

**This is required before uploading any files!**

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ewjqnxmklxqpxdwluazh
2. Click **"Storage"** in the left sidebar
3. Click **"New bucket"**
4. Create bucket 1:
   - **Name**: `notices-pdfs`
   - **Public bucket**: ✅ Check this box
   - Click **"Create bucket"**
5. Create bucket 2:
   - **Name**: `notices-images`
   - **Public bucket**: ✅ Check this box
   - Click **"Create bucket"**

**Without these buckets, file uploads will fail!**

### 2. View Your Tables in Supabase

1. In Supabase Dashboard, click **"Table Editor"** in the left sidebar
2. You should see all your tables:
   - User
   - Notice (updated schema)
   - Container
   - Category
   - Dashboard
   - Template
   - PublicNoticeSettings
   - PublicNoticeTemplate
   - Pdf (updated schema)
   - ModeratorPermission

### 3. Handle Existing Data (If Applicable)

⚠️ **If you had existing PDF records in the `Pdf` table:**
- The migration added `pdfUrl` as NOT NULL
- Existing records without URLs will cause errors
- **Options:**
  - Option A: Delete existing PDF records (if you're starting fresh)
  - Option B: Update existing records with placeholder URLs (for testing)
  - Option C: Migrate existing PDFs to Supabase Storage first

To check if you have existing PDF records:
```sql
SELECT COUNT(*) FROM "Pdf";
```

### 4. Test the Setup

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test PDF upload:**
   - Go to notice creation page
   - Upload a PDF file
   - Check Supabase Storage → `notices-pdfs` bucket to verify upload
   - Check database → Notice table to see the `pdfUrl` field populated

3. **Test Image upload:**
   - Upload an image file
   - Check Supabase Storage → `notices-images` bucket
   - Verify `imageUrl` in database

4. **Test file download:**
   - Try downloading/viewing uploaded files
   - Verify files load correctly from Supabase URLs

## 🐛 Troubleshooting

### If file uploads fail:
1. Check that storage buckets are created and public
2. Verify environment variables are set correctly
3. Check browser console and server logs for errors
4. Verify Service Role Key has correct permissions

### If database errors occur:
1. Check if `Pdf` table has records without `pdfUrl`
2. If so, either delete them or add placeholder URLs
3. Check Prisma client is regenerated: `npx prisma generate`

## 📊 Viewing Data in Supabase

### Table Editor
- Click "Table Editor" → Select any table
- View, edit, filter, and search records
- See schema changes (removed columns)

### SQL Editor
- Click "SQL Editor" to run custom queries
- Example: `SELECT * FROM "Notice" WHERE "pdfUrl" IS NOT NULL;`

### Storage Browser
- Click "Storage" → Select a bucket
- View uploaded files
- See file metadata (size, uploaded date, URL)

## ✅ Checklist

- [ ] Storage buckets created (`notices-pdfs` and `notices-images`)
- [ ] Buckets set to public
- [ ] Tables visible in Supabase Table Editor
- [ ] Existing data handled (if applicable)
- [ ] Development server starts without errors
- [ ] Test file upload works
- [ ] Test file download works
- [ ] Files appear in Supabase Storage
- [ ] URLs stored correctly in database

---

**Next**: Create the storage buckets, then test file uploads!


