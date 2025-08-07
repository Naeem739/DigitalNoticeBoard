# Test Page - Applied Template Testing & Preview

## Overview

The Test page (`/dashboard/test`) provides a focused testing environment for the currently applied PublicNoticeTemplate. It displays the active template with its effects and allows users to apply different templates from available options.

## Features

### 🎯 Applied Template Preview
- **Current Template Display**: Shows only the template that is currently applied
- **Live Background Rendering**: Displays actual background styles (gradient, solid, image)
- **Header & Footer Preview**: Shows how headers and footers will look
- **Content Simulation**: Displays sample notice content to demonstrate the template

### 🔧 Template Testing
- **Apply New Templates**: Test different templates live on the public notice board
- **Instant Feedback**: See changes immediately when applying templates
- **Template Comparison**: Compare current template with available alternatives
- **Live View**: Direct link to view the public notice board

### 📊 Status Monitoring
- **Applied Template Status**: Shows which template is currently active
- **Current Settings**: Displays currently applied settings
- **Available Templates**: Shows count of templates that can be applied
- **Live Preview**: Real-time update status

## How to Use

### 1. Access the Test Page
- Navigate to `/dashboard/test` in the sidebar
- The page will load the currently applied template and available templates

### 2. View Applied Template
- The main preview shows exactly how your currently applied template looks
- Background styles, colors, and layouts are rendered exactly as they appear
- Template details show all configuration options

### 3. Apply Different Templates
- Scroll down to see available templates to apply
- Click "Apply Template" to test a different template live
- The template will be applied to the public notice board immediately
- Use "View Live" to see the changes on the public page

### 4. Create Sample Templates
- Click "Create Sample Templates" to generate test templates
- This creates 4 different sample templates with various styles
- Useful for testing when no templates exist

## Template Types

### Professional Dark
- Dark gradient background
- Professional blue accents
- Suitable for corporate environments

### Corporate Blue
- Blue gradient theme
- Business-focused styling
- Professional appearance

### Modern Purple
- Purple gradient background
- Modern and elegant design
- Creative department suitable

### Clean White
- Solid white background
- Minimal and clean design
- Design-focused approach

## API Integration

The Test page integrates with several API endpoints:

- `GET /api/templates` - Fetch all templates
- `GET /api/public-notice-settings` - Get current settings
- `PATCH /api/templates/[id]` - Apply template to settings
- `POST /api/test/create-sample-templates` - Create sample templates

## Database Models

### PublicNoticeTemplate
```prisma
model PublicNoticeTemplate {
  id                        String   @id @default(cuid())
  name                      String
  description               String?
  logo                      String?
  logoFileName              String?
  title                     String   @default("Smart Notice Board")
  subtitle                  String   @default("Information Technology Department")
  emergencyNumber           String   @default("01734528367")
  emergencyContact          String   @default("Md. Rashid Al Asif")
  departmentName            String   @default("Information Technology Department")
  backgroundType            String   @default("gradient")
  backgroundColor           String?
  gradientColors            Json?
  backgroundImage           String?
  backgroundImageFileName   String?
  headerBackgroundColor     String   @default("#1e293b")
  footerBackgroundColor     String   @default("#1e293b")
  accentColor               String   @default("#3b82f6")
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
}
```

### PublicNoticeSettings
```prisma
model PublicNoticeSettings {
  id                        String   @id @default(cuid())
  logo                      String?
  logoFileName              String?
  title                     String   @default("Smart Notice Board")
  subtitle                  String   @default("Information Technology Department")
  emergencyNumber           String   @default("01734528367")
  emergencyContact          String   @default("Md. Rashid Al Asif")
  departmentName            String   @default("Information Technology Department")
  backgroundType            String   @default("gradient")
  backgroundColor           String?
  gradientColors            Json?
  backgroundImage           String?
  backgroundImageFileName   String?
  headerBackgroundColor     String   @default("#1e293b")
  footerBackgroundColor     String   @default("#1e293b")
  accentColor               String   @default("#3b82f6")
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
}
```

## Technical Implementation

### Components
- **AppliedTemplatePreview**: Renders the currently applied template
- **TestPage**: Main page component with applied template display
- **Status Cards**: Display system status and metrics
- **Available Templates Grid**: Shows templates that can be applied

### State Management
- Current settings from API
- Available templates list from API
- Loading states for operations
- Refresh functionality

### Template Detection
- **findAppliedTemplate()**: Compares current settings with available templates
- **Template Matching**: Matches title, subtitle, background type, colors, etc.
- **Fallback**: Shows "Custom Settings" if no exact template match

### Styling
- Responsive grid layout
- Gradient backgrounds
- Smooth animations with Framer Motion
- Consistent with design system

## Benefits

1. **Focused Testing**: See exactly how your current template looks
2. **Easy Comparison**: Compare current template with alternatives
3. **Quick Switching**: Apply different templates with one click
4. **Live Preview**: See changes immediately on the public page
5. **Template Identification**: Know which template is currently applied

## Key Features

### Applied Template Detection
The system automatically detects which template is currently applied by comparing:
- Template title and subtitle
- Background type and colors
- Header and footer colors
- Accent color
- Other template properties

### Visual Indicators
- **Green Badge**: Shows "Template Applied" or "Custom Settings"
- **Template Name**: Displays the name of the applied template
- **Creation Date**: Shows when the template was created
- **Status Cards**: Indicate current state and available options

### Template Application
- **One-Click Apply**: Apply any available template instantly
- **Loading States**: Visual feedback during template application
- **Success Notifications**: Toast messages confirm successful application
- **Error Handling**: Graceful error handling for failed operations

## Future Enhancements

- Template comparison mode (side-by-side)
- Custom template creation from current settings
- Template categories and filtering
- Bulk template operations
- Template versioning and history
- Template backup and restore functionality 