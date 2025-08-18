# Dashboard Widget Features

This document describes the three types of widgets available in the Smart Notice Board dashboard editor.

## Widget Types

### 1. Notice Widget (Blue)
- **Purpose**: Displays notices from selected categories
- **Features**:
  - Auto-scrolling notice list
  - Configurable notice count
  - Category-based content filtering
  - Drag & drop category assignment
  - Customizable typography and styling

### 2. Image Widget (Green)
- **Purpose**: Displays a single image with optional title overlay
- **Features**:
  - Single image per widget
  - Drag & drop image upload
  - Hover overlay for image replacement
  - Configurable image fit modes (cover, contain, fill, scale-down)
  - Customizable border radius and title styling
  - Responsive sizing that adapts to widget dimensions

### 3. PDF Widget (Purple)
- **Purpose**: Displays PDF documents with embedded viewer
- **Features**:
  - PDF file upload and display
  - Embedded iframe viewer
  - "Open in new tab" fallback option
  - Configurable title display
  - Customizable viewer height
  - Error handling for PDF display issues

## How to Use

### Creating Widgets
1. Select a display ratio (4:3, 16:9, or 16:10)
2. Click the appropriate widget creation button:
   - **Create Notice Widget** - for displaying notices
   - **Create Image Widget** - for displaying images
   - **Create PDF Widget** - for displaying PDFs

### Configuring Widgets
1. Click the settings icon (⚙️) on any widget
2. Customize appearance, typography, content, and category settings
3. Settings are specific to each widget type

### Adding Content
- **Notice Widgets**: Drag a category from the right panel onto the widget
- **Image Widgets**: Click the upload area or use the hover overlay to replace images
- **PDF Widgets**: Click the upload area to select a PDF file

### Widget Management
- **Resize**: Drag the corners of any widget to resize
- **Move**: Drag the header area to reposition widgets
- **Delete**: Click the X button to remove widgets
- **Settings**: Click the settings icon to customize widget appearance

## Technical Details

### File Handling
- Images and PDFs are stored as base64 data URLs in the browser
- File validation ensures only appropriate file types are accepted
- Maximum file sizes are limited by browser memory constraints

### Responsive Design
- All widgets automatically adapt to their container dimensions
- Images maintain aspect ratio based on selected fit mode
- PDF viewers scale appropriately with widget size

### Performance Considerations
- Large files may impact performance due to base64 encoding
- Consider file size limits for production use
- Images and PDFs are stored in memory, not persisted to server

## Customization Options

### Appearance Settings
- Background color and opacity
- Border color and width
- Card opacity

### Typography Settings
- Font family, size, and weight
- Text color
- Category styling options

### Content Settings
- Notice count and auto-scroll
- Image fit and border radius
- PDF viewer height
- Title display options

## Best Practices

1. **Image Widgets**: Use high-quality images with appropriate aspect ratios
2. **PDF Widgets**: Keep PDF files reasonably sized for better performance
3. **Notice Widgets**: Organize content into logical categories
4. **Layout**: Use the grid system to create balanced, visually appealing dashboards
5. **Templates**: Save successful layouts as templates for reuse

## Troubleshooting

### Common Issues
- **Images not displaying**: Check file format and size
- **PDFs not loading**: Use "Open in new tab" option as fallback
- **Widgets not saving**: Ensure all required fields are filled
- **Performance issues**: Reduce file sizes or number of widgets

### Browser Compatibility
- Modern browsers with ES6+ support required
- File API support needed for uploads
- Grid layout requires CSS Grid support
