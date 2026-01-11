# Supabase Storage Setup Guide

This guide will walk you through setting up Supabase Storage for the SmartNoticeBoard project to handle image and PDF file storage.

## Overview

The project has been migrated from storing files as base64 binary data in the database to using Supabase Storage. Files are now uploaded to Supabase Storage buckets, and only their URLs are stored in the database.

## Prerequisites

- A Supabase account (sign up at https://supabase.com if you don't have one)
- Node.js and npm installed
- Access to your project's environment variables

## Step-by-Step Setup

### Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in (or create an account)
2. Click "New Project"
3. Fill in your project details:
   - **Name**: SmartNoticeBoard (or your preferred name)
   - **Database Password**: Create a strong password (save this securely)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Select the free tier if you're just starting
4. Click "Create new project" and wait for the project to be set up (takes 1-2 minutes)

### Step 2: Create Storage Buckets

1. In your Supabase project dashboard, navigate to **Storage** in the left sidebar
2. Click **"New bucket"**
3. Create the first bucket:
   - **Name**: `notices-pdfs`
   - **Public bucket**: ✅ Check this (so files are publicly accessible via URL)
   - Click **"Create bucket"**
4. Create the second bucket:
   - **Name**: `notices-images`
   - **Public bucket**: ✅ Check this
   - Click **"Create bucket"**

### Step 3: Configure Storage Policies (Optional but Recommended)

For production, you may want to set up Row Level Security (RLS) policies. For now, since the buckets are public, files will be accessible. You can configure more restrictive policies later if needed.

### Step 4: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll need the following values:
   - **Project URL**: Found under "Project URL" (looks like `https://xxxxx.supabase.co`)
   - **Service Role Key**: Found under "Project API keys" → "service_role" key (⚠️ Keep this secret!)

### Step 5: Install Dependencies

The Supabase client library has already been added to `package.json`. Install it by running:

```bash
npm install
```

### Step 6: Configure Environment Variables

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add the following environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Replace:
- `https://your-project-id.supabase.co` with your actual Project URL from Step 4
- `your-service-role-key-here` with your actual Service Role Key from Step 4

⚠️ **Important**: 
- Never commit `.env.local` to version control
- The Service Role Key bypasses Row Level Security - keep it secret
- Use `NEXT_PUBLIC_` prefix only for the URL (it's safe to expose in client-side code)

### Step 7: Run Database Migration

Update your Prisma schema and run migrations:

```bash
# Generate Prisma client with updated schema
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name migrate_to_supabase_storage
```

This will:
- Remove `pdfData` and `imageData` fields from the `Notice` model
- Remove `pdfData` field from the `Pdf` model
- Keep only URL fields (`pdfUrl`, `imageUrl`)

⚠️ **Important**: This migration will remove existing binary data fields. If you have existing data:
- **Option A (Recommended)**: Migrate existing files to Supabase Storage first (see Migration Guide below)
- **Option B**: Start fresh with a new database

### Step 8: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test file upload:
   - Go to the notice creation page
   - Try uploading a PDF or image
   - Check your Supabase Storage dashboard to verify the file was uploaded
   - Verify the database record contains a URL instead of base64 data

3. Test file retrieval:
   - Try downloading/viewing an uploaded file
   - Verify it loads correctly

## Migration Guide (For Existing Data)

If you have existing notices with base64 data that you want to migrate:

### Option 1: Manual Migration Script

Create a migration script to upload existing files to Supabase:

```typescript
// scripts/migrate-to-supabase.ts
import { prisma } from '../src/db/prisma'
import { uploadPDF, uploadImage } from '../src/lib/supabase'

async function migrateFiles() {
  // Get all notices with pdfData
  const noticesWithPDFs = await prisma.notice.findMany({
    where: { pdfData: { not: null } }
  })

  for (const notice of noticesWithPDFs) {
    if (notice.pdfData && notice.pdfFileName) {
      try {
        const buffer = Buffer.from(notice.pdfData, 'base64')
        const result = await uploadPDF(buffer, notice.pdfFileName)
        if (result.url) {
          await prisma.notice.update({
            where: { id: notice.id },
            data: { pdfUrl: result.url }
          })
          console.log(`Migrated PDF for notice ${notice.id}`)
        }
      } catch (error) {
        console.error(`Error migrating PDF for notice ${notice.id}:`, error)
      }
    }
  }

  // Similar for images...
  const noticesWithImages = await prisma.notice.findMany({
    where: { imageData: { not: null } }
  })

  for (const notice of noticesWithImages) {
    if (notice.imageData && notice.imageFileName) {
      try {
        const buffer = Buffer.from(notice.imageData, 'base64')
        const result = await uploadImage(buffer, notice.imageFileName)
        if (result.url) {
          await prisma.notice.update({
            where: { id: notice.id },
            data: { imageUrl: result.url }
          })
          console.log(`Migrated image for notice ${notice.id}`)
        }
      } catch (error) {
        console.error(`Error migrating image for notice ${notice.id}:`, error)
      }
    }
  }
}

migrateFiles()
```

### Option 2: Fresh Start

If you're in development and don't need to preserve existing data:
1. Clear your database
2. Run the migration
3. Start using the new system

## File Structure

After setup, files will be organized in Supabase Storage as:

```
notices-pdfs/
  └── notices/
      └── {timestamp}-{random}-{filename}.pdf

notices-images/
  └── notices/
      └── {timestamp}-{random}-{filename}.{jpg|png|gif|webp}
```

## Key Changes in the Codebase

### Backend Changes

1. **Schema (`prisma/schema.prisma`)**:
   - Removed `pdfData` and `imageData` fields
   - Kept `pdfUrl` and `imageUrl` fields

2. **Supabase Utilities (`src/lib/supabase.ts`)**:
   - `uploadPDF()`: Uploads PDF files to Supabase Storage
   - `uploadImage()`: Uploads image files to Supabase Storage
   - `deleteFileFromStorage()`: Deletes files from Supabase Storage

3. **API Routes**:
   - `/api/pdf/upload`: Now uploads to Supabase Storage
   - `/api/notice/download/[id]`: Fetches PDFs from Supabase URLs
   - `/api/notice/download-image/[id]`: Fetches images from Supabase URLs

4. **Server Actions**:
   - `createNotice()`: Uploads files to Supabase before saving
   - `createPdf()`: Uploads PDFs to Supabase before saving

### Frontend Changes (May Need Updates)

Some frontend components may still reference `pdfData` and `imageData`. These should be updated to use `pdfUrl` and `imageUrl` instead. The server actions handle the conversion from base64 to URLs automatically, but components that read from the database should use URLs.

## Troubleshooting

### Files Not Uploading

1. **Check environment variables**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set correctly
2. **Check bucket names**: Ensure buckets are named exactly `notices-pdfs` and `notices-images`
3. **Check bucket permissions**: Ensure buckets are set to "Public"
4. **Check console errors**: Look for error messages in your server logs

### Files Not Downloading

1. **Check URLs in database**: Verify that `pdfUrl` and `imageUrl` fields contain valid Supabase URLs
2. **Check bucket permissions**: Ensure buckets are public
3. **Check file existence**: Verify files exist in Supabase Storage dashboard

### Migration Issues

1. **Database locked**: Ensure no other processes are using the database
2. **Base64 decode errors**: Some old data may be corrupted - handle errors gracefully
3. **Large files**: Supabase free tier has file size limits - consider upgrading for large files

## Production Considerations

1. **File Size Limits**: 
   - Free tier: 50MB per file
   - Paid tiers: Higher limits available

2. **Storage Limits**:
   - Free tier: 1GB storage
   - Monitor usage in Supabase dashboard

3. **CDN**: Supabase Storage uses a CDN for fast global delivery

4. **Backup**: Consider backing up your Supabase Storage bucket regularly

5. **Security**: 
   - Keep Service Role Key secret
   - Consider implementing RLS policies for production
   - Use signed URLs for private files if needed

## Support

For issues with:
- **Supabase**: Check [Supabase Documentation](https://supabase.com/docs)
- **This project**: Check the project's GitHub issues or documentation

## Next Steps

1. ✅ Complete the setup steps above
2. ✅ Test file uploads and downloads
3. ⚠️ Update frontend components to use URLs instead of base64 data (if needed)
4. ✅ Deploy to production with environment variables configured
5. ✅ Monitor storage usage and performance

---

**Last Updated**: January 2025

