A modern, responsive digital notice board system built with **Next.js 15**, featuring real-time updates, drag-and-drop layouts, and comprehensive content management.

![Next.js](https://img.shields.io/badge/Next.js-15.1.3-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-blue?style=for-the-badge&logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css)

---

## ✨ Features

# Role-Based Access Control (RBAC) System

## Overview
SmartNoticeBoard implements a four-tier role system with automatic Super Admin assignment for the first user. Each role has specific permissions and route access restrictions.

## Role Hierarchy

### Super Admin (First User)
- **Automatic Assignment:** First signup becomes Super Admin  
- **Full Access:** Complete system control and user management  
- **Can Create:** All user types (Super Admin, Admin, Moderator, User)  

### Admin
- **User Management:** Can create Moderators and Users only  
- **Full System Access:** All dashboard features except Super Admin pages  
- **Content Control:** Full CRUD operations on notices, categories, templates  

### Moderator
- **Content Management:** CRUD operations on notices  
- **User Creation:** Can create Users only  
- **Limited Access:** Cannot create templates or access admin pages  

### User (Default Role)
- **Read-Only Access:** View notices, images, and PDFs  
- **No Administrative Functions:** Cannot create, edit, or manage content  

## Route Protection

### Public Routes
- `/`  
- `/login`  
- `/signup`  

### Protected Routes by Role
- **Super Admin:** All routes  
- **Admin:** Most routes (except Super Admin management)  
- **Moderator:** Content viewing and basic management  
- **User:** View-only routes only  

## Security Features
- **NextAuth.js:** Secure session management  
- **Middleware Protection:** Automatic route access control  
- **Password Hashing:** Bcrypt encryption  
- **Role Validation:** Server-side permission checks  

## User Creation Flow
- **First User:** Automatically becomes Super Admin  
- **Regular Signup:** Defaults to User role  
- **Admin Creation:** Existing admins can assign specific roles  

### 🎨 Dashboard Management
- **Drag-and-Drop Layout**: Customizable widget positioning with React Grid Layout
- **Real-time Updates**: Live content synchronization across devices
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Template System**: Save and reuse dashboard layouts
- **Multi-aspect Ratio Support**: 16:9, 4:3, 21:9, and custom ratios
- **Auto-rotation**: Automatic dashboard switching with configurable intervals

### �� Content Management
- **Rich Text Editor**: Advanced content creation with TipTap
- **Category Management**: Organize notices with custom categories and icons
- **Image Upload**: Preview-supported image upload with multiple formats
- **PDF Support**: Upload and display PDF documents
- **Content Truncation**: Prevent layout overflow with smart text truncation
- **File Management**: Base64 encoding for secure file storage

### 🔐 Authentication & Security
- **NextAuth.js Integration**: Secure user authentication
- **Role-based Access**: Admin and user permission levels
- **Session Management**: Persistent login states
- **Password Encryption**: Bcrypt hashing for security
- **Protected Routes**: Middleware-based route protection

### �� Widget System
- **Notice Widgets**: Display text content with rich formatting
- **Image Widgets**: Show images with customizable fit options
- **Statistics Widgets**: Real-time analytics and metrics
- **Customizable Settings**: Fonts, colors, borders, spacing, opacity
- **Category Styling**: Custom category appearance and positioning

### 📊 Analytics & Monitoring
- **Dashboard Statistics**: Track user activity and content metrics
- **Real-time Charts**: Visual representation with Recharts
- **Performance Monitoring**: Optimized rendering and loading
- **Usage Analytics**: Monitor dashboard and content usage

### 🌐 Public Display Features
- **QR Code Integration**: Easy access to notices via QR codes
- **Auto-refresh**: Automatic content updates every 30 minutes
- **Background Customization**: Solid colors, gradients, or custom images
- **Branding Options**: Custom logos, titles, and contact information
- **Emergency Information**: Display emergency contacts and numbers

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** (App Router) - React framework with server-side rendering
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation and motion library
- **React Grid Layout** - Drag-and-drop grid system
- **TipTap Editor** - Rich text editing capabilities
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Form state management
- **Zod** - Schema validation

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database client
- **PostgreSQL** - Primary relational database
- **NextAuth.js** - Authentication framework
- **Socket.IO** - Real-time communication
- **Bcrypt** - Password hashing

### File Handling & Media
- **@react-pdf/renderer** - PDF generation and manipulation
- **pdf-lib** - PDF document processing
- **Sharp** - Image processing and optimization
- **html2canvas** - HTML to canvas conversion
- **jsPDF** - PDF generation from HTML content

### Development Tools
- **ESLint** - Code linting and quality
- **PostCSS** - CSS processing and optimization
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

---

## 📁 Detailed Project Structure
 ```SmartNoticeBoard/
├── 📁 src/
│ ├── 📁 app/ # Next.js App Router
│ │ ├── 📁 (WithCommonLayout)/ # Public-facing pages
│ │ │ ├── 📁 components/ # Landing page components
│ │ │ │ ├── about.tsx # About section component
│ │ │ │ ├── animated-sentences.tsx # Animated text component
│ │ │ │ ├── cause-section.tsx # Cause/feature section
│ │ │ │ ├── contact-form.tsx # Contact form component
│ │ │ │ ├── footer.tsx # Footer component
│ │ │ │ ├── gallery.tsx # Image gallery component
│ │ │ │ ├── header.tsx # Header navigation
│ │ │ │ ├── hero-component.tsx # Hero section component
│ │ │ │ ├── services.tsx # Services section
│ │ │ │ ├── success-stories.tsx # Success stories section
│ │ │ │ ├── team-section.tsx # Team member section
│ │ │ │ ├── testimonial-slider.tsx # Testimonial carousel
│ │ │ │ ├── time-line.tsx # Timeline component
│ │ │ │ └── top-banner.tsx # Top banner component
│ │ │ ├── 📁 notice/ # Public notice board
│ │ │ │ ├── �� components/ # Notice board components
│ │ │ │ │ ├── FluidNoticeBoard.tsx # Main notice board display
│ │ │ │ │ ├── NoticeHeader.tsx # Notice board header
│ │ │ │ │ ├── NoticeFooter.tsx # Notice board footer
│ │ │ │ │ ├── PublicNoticeBoardView.tsx # Public view component
│ │ │ │ │ ├── TemplateSelector.tsx # Template selection
│ │ │ │ │ └── edit-dashboard-demo-two.tsx # Dashboard editor
│ │ │ │ └── page.tsx # Public notice page
│ │ │ ├── layout.tsx # Common layout wrapper
│ │ │ └── page.tsx # Landing page
│ │ │
│ │ ├── 📁 (WithDashboardLayout)/ # Admin dashboard pages
│ │ │ ├── 📁 dashboard/ # Dashboard management
│ │ │ │ ├── �� admin/ # Admin management
│ │ │ │ │ ├── 📁 make-admin/ # Admin creation
│ │ │ │ │ └── 📁 showAllAdmin/ # Admin listing
│ │ │ │ ├── �� category/ # Category management
│ │ │ │ │ └── �� showAllCategory/ # Category listing
│ │ │ │ ├── �� components/ # Dashboard components
│ │ │ │ │ ├── Header.tsx # Dashboard header
│ │ │ │ │ ├── Overview.tsx # Overview statistics
│ │ │ │ │ ├── RecentSales.tsx # Recent activity
│ │ │ │ │ ├── Sidebar.tsx # Navigation sidebar
│ │ │ │ │ └── SidebarOverlay.tsx # Mobile sidebar overlay
│ │ │ │ ├── �� create-notice/ # Notice creation
│ │ │ │ ├── �� layout/ # Layout management
│ │ │ │ │ ├── 📁 edit-dashboard/ # Dashboard editor
│ │ │ │ │ │ ├── edit-dashboard-demo.tsx # Editor component
│ │ │ │ │ │ ├── edit-dashboard.css # Editor styles
│ │ │ │ │ │ └── image-widget-demo.tsx # Image widget demo
│ │ │ │ │ └── page.tsx # Layout editor page
│ │ │ │ ├── 📁 manage-public-notice/ # Public notice settings
│ │ │ │ │ ├── 📁 components/ # Settings components
│ │ │ │ │ │ └── TemplateManager.tsx # Template management
│ │ │ │ │ └── page.tsx # Settings page
│ │ │ │ ├── 📁 noticeInterfaces/ # Notice interface management
│ │ │ │ ├── 📁 showImageNotices/ # Image notice display
│ │ │ │ ├── �� showNotices/ # Text notice display
│ │ │ │ │ ├── 📁 components/ # Notice display components
│ │ │ │ │ └── page.tsx # Notice listing page
│ │ │ │ ├── �� showPDFNotices/ # PDF notice display
│ │ │ │ ├── �� view-dashboard/ # Dashboard viewing
│ │ │ │ │ └── 📁 [id]/ # Dynamic dashboard routes
│ │ │ │ └── page.tsx # Main dashboard page
│ │ │ └── layout.tsx # Dashboard layout wrapper
│ │ │
│ │ ├── 📁 actions/ # Server Actions
│ │ │ ├── category.action.ts # Category CRUD operations
│ │ │ ├── dashboard.action.ts # Dashboard management
│ │ │ ├── image.action.ts # Image handling
│ │ │ ├── notice.action.ts # Notice CRUD operations
│ │ │ ├── public-notice-settings.action.ts # Public settings
│ │ │ └── template.action.ts # Template management
│ │ │
│ │ ├── 📁 api/ # API Routes
│ │ │ ├── 📁 admin/ # Admin management APIs
│ │ │ │ ├── �� allAdmins/ # Admin listing
│ │ │ │ ├── �� delete/ # Admin deletion
│ │ │ │ │ └── 📁 [id]/ # Dynamic admin routes
│ │ │ │ └── route.ts # Admin CRUD operations
│ │ │ ├── 📁 auth/ # Authentication APIs
│ │ │ │ ├── �� [...nextauth]/ # NextAuth.js routes
│ │ │ │ └── �� signup/ # User registration
│ │ │ ├── 📁 category/ # Category APIs
│ │ │ │ ├── �� delete/ # Category deletion
│ │ │ │ │ └── 📁 [id]/ # Dynamic category routes
│ │ │ │ ├── �� get-all/ # Category listing
│ │ │ │ └── �� update/ # Category updates
│ │ │ ├── 📁 dashboard/ # Dashboard APIs
│ │ │ │ ├── �� get-all/ # Dashboard listing
│ │ │ │ ├── �� get-by-id/ # Single dashboard
│ │ │ │ │ └── 📁 [id]/ # Dynamic dashboard routes
│ │ │ │ ├── �� get-default/ # Default dashboard
│ │ │ │ └── �� update/ # Dashboard updates
│ │ │ │ └── 📁 [id]/ # Dynamic update routes
│ │ │ ├── 📁 image/ # Image management APIs
│ │ │ │ └── �� get-all/ # Image listing
│ │ │ ├── 📁 init-settings/ # Initialization APIs
│ │ │ ├── 📁 notice/ # Notice management APIs
│ │ │ │ ├── �� delete/ # Notice deletion
│ │ │ │ ├── �� download/ # File download
│ │ │ │ │ └── 📁 [id]/ # Dynamic download routes
│ │ │ │ ├── �� download-image/ # Image download
│ │ │ │ │ └── 📁 [id]/ # Dynamic image routes
│ │ │ │ ├── �� get-all/ # Notice listing
│ │ │ │ ├── �� update/ # Notice updates
│ │ │ │ └── �� update-icon/ # Icon updates
│ │ │ ├── 📁 public-notice-settings/ # Public settings APIs
│ │ │ └── 📁 templates/ # Template management APIs
│ │ │ ├── �� [id]/ # Dynamic template routes
│ │ │ └── route.ts # Template CRUD operations
│ │ │
│ │ ├── 📁 login/ # Login page
│ │ │ ├── login-form.tsx # Login form component
│ │ │ └── page.tsx # Login page
│ │ ├── 📁 signup/ # Registration page
│ │ │ ├── signup-form.tsx # Registration form
│ │ │ └── page.tsx # Signup page
│ │ ├── favicon.ico # Site favicon
│ │ ├── globals.css # Global styles
│ │ ├── layout.tsx # Root layout
│ │ ├── loading.tsx # Loading component
│ │ └── page.tsx # Root page
│ │
│ ├── 📁 assets/ # Static assets
│ │ ├── headerImg_1.jpg # Header images
│ │ ├── headerImg_2.jpg
│ │ ├── headerImg_3.jpg
│ │ ├── headerImg_4.jpg
│ │ └── login.jpg # Login background
│ │
│ ├── 📁 components/ # Reusable UI components
│ │ └── 📁 ui/ # Base UI components
│ │ ├── avatar.tsx # User avatar component
│ │ ├── badge.tsx # Status badge component
│ │ ├── button.tsx # Button component
│ │ ├── card.tsx # Card container component
│ │ ├── dialog.tsx # Modal dialog component
│ │ ├── dropdown-menu.tsx # Dropdown menu component
│ │ ├── form.tsx # Form components
│ │ ├── input.tsx # Input field component
│ │ ├── label.tsx # Form label component
│ │ ├── loader.tsx # Loading spinner component
│ │ ├── popover.tsx # Popover component
│ │ ├── qr-code.tsx # QR code generator
│ │ ├── select.tsx # Select dropdown component
│ │ ├── sheet.tsx # Side sheet component
│ │ ├── tabs.tsx # Tab navigation component
│ │ ├── textarea.tsx # Textarea component
│ │ ├── toast.tsx # Toast notification component
│ │ ├── toaster.tsx # Toast container
│ │ └── tooltip.tsx # Tooltip component
│ │
│ ├── 📁 contexts/ # React contexts (if any)
│ │
│ ├── 📁 db/ # Database configuration
│ │ └── prisma.ts # Prisma client setup
│ │
│ ├── 📁 hooks/ # Custom React hooks
│ │ ├── useAnimatedSentences.tsx # Animated text hook
│ │ ├── usePublicNoticeSettings.ts # Public settings hook
│ │ └── use-toast.ts # Toast notification hook
│ │
│ ├── 📁 lib/ # Utility libraries
│ │ ├── providers.tsx # Context providers
│ │ └── utils.ts # Utility functions
│ │
│ ├── 📁 middleware.ts # Next.js middleware
│ │
│ ├── 📁 types/ # TypeScript type definitions
│ │ ├── next-auth.d.ts # NextAuth.js types
│ │ ├── template-types.ts # Template-related types
│ │ └── types.ts # Core type definitions
│ │
│ └── 📁 utils/ # Utility functions
│ └── authOptions.ts # NextAuth.js configuration
│
├── 📁 prisma/ # Database schema and migrations
│ ├── 📁 migrations/ # Database migration files
│ │ ├── 20250115000000_add_public_notice_templates/
│ │ ├── 20250306074250_first_migration/
│ │ ├── 20250306080922_connecting_tables/
│ │ ├── 20250308093215_making_category_unique/
│ │ ├── 20250308221303_dashboard_table_added/
│ │ ├── 20250309092247_updated/
│ │ ├── 20250312124754_added_created_at_field_in_dashboard/
│ │ ├── 20250514123554_adding_template/
│ │ ├── 20250514131025_template_add2/
│ │ ├── 20250729063051_add_displayname_and_icon/
│ │ ├── 20250729065435_add_icon_to_notice/
│ │ ├── 20250729070714_add_edited_name_to_category/
│ │ ├── 20250729151602_add_icon_and_edited_name_to_category/
│ │ ├── 20250801062421_add_icon_to_notice/
│ │ ├── 20250801124833_make_password_optional/
│ │ ├── 20250801131002_add_nextauth_tables/
│ │ ├── 20250802075430_add_image_tables/
│ │ ├── 20250802105748_add_timestamps_to_category/
│ │ ├── 20250802105907_h/
│ │ ├── 20250804004534_add_pdf_fields_to_notice/
│ │ ├── 20250804051750_add_image_fields_to_notice/
│ │ ├── 20250804120902_add_notice_type_and_nullable_content/
│ │ ├── 20250804182119_add_public_notice_settings/
│ │ └── 20250804205658_add_pdf_support_to_image/
│ ├── migration_lock.toml # Migration lock file
│ └── schema.prisma # Database schema definition
│
├── 📁 public/ # Static files
│ ├── file.svg # File icon
│ ├── globe.svg # Globe icon
│ ├── next.svg # Next.js logo
│ └── 📁 videos/ # Video assets
│ └── demo-video.mp4 # Demo video
│
├── 📁 migrations/ # Additional migration files
│
├── components.json # Component configuration
├── docker-compose.yml # Docker Compose configuration
├── Dockerfile # Docker container definition
├── eslint.config.mjs # ESLint configuration
├── global.d.ts # Global TypeScript declarations
├── next.config.ts # Next.js configuration
├── package-lock.json # NPM lock file
├── package.json # Project dependencies and scripts
├── postcss.config.mjs # PostCSS configuration
├── tailwind.config.ts # Tailwind CSS configuration
└── tsconfig.json # TypeScript configuration
 ```

## 🗄️ Database Schema Overview

### Core Models

#### **User Model**
```typescript
model User {
  id        String   @id @default(cuid())
  name      String?
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### **Notice Model**
```typescript
model Notice {
  id          String @id @default(uuid()) 
  title       String
  content     String
  category    String
  categoryId   String 
  pdfUrl      String?           // PDF file URL
  pdfFileName String?           // Original PDF filename
  pdfData     String?           // Base64 encoded PDF data
  imageUrl    String?           // Image file URL
  imageFileName String?         // Original image filename
  imageData   String?           // Base64 encoded image data
  createdAt   DateTime? @default(now())
  categoryRelation  Category @relation(fields: [categoryId], references: [id])
  container   Container?
}
```

#### **Category Model**
```typescript
model Category {
  id      String @id @default(uuid())
  name    String @unique
  notices Notice[]
  icon    String?              // Category icon
  editedName String?           // Custom category name
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### **Dashboard Model**
```typescript
model Dashboard {
  id           String @id @default(uuid())
  aspectRatio  String
  containers   Json              // Layout configuration
  createdAt   DateTime? @default(now())
}
```

#### **Template Model**
```typescript
model Template {
  id             String   @id @default(cuid())
  name           String
  description    String?
  widgets        Json              // Widget configurations
  layout         Json              // Layout settings
  widgetSettings Json              // Widget-specific settings
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

#### **PublicNoticeSettings Model**
```typescript
model PublicNoticeSettings {
  id                String   @id @default(cuid())
  logo              String?  // Base64 encoded logo
  logoFileName      String?  // Original logo filename
  title             String   @default("Smart Notice Board")
  subtitle          String   @default("Information Technology Department")
  emergencyNumber   String   @default("01734528367")
  emergencyContact  String   @default("Md. Rashid Al Asif")
  departmentName    String   @default("Information Technology Department")
  
  // Background settings
  backgroundType    String   @default("gradient")
  backgroundColor   String?
  gradientColors    Json?
  backgroundImage   String?
  backgroundImageFileName String?
  
  // Styling
  headerBackgroundColor String @default("#1e293b")
  footerBackgroundColor String @default("#1e293b")
  accentColor         String @default("#3b82f6")
  
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/SmartNoticeBoard.git
   cd SmartNoticeBoard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/smartnoticeboard"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Access the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 Key Features Explained

### **Dashboard Layout System**
The dashboard uses React Grid Layout for creating customizable, responsive layouts. Users can:
- Drag and drop widgets to reposition them
- Resize widgets by dragging corners
- Save layouts as templates
- Switch between different aspect ratios
- Auto-rotate between multiple dashboards

### **Widget Management**
Each widget type has specific features:

**Notice Widgets:**
- Rich text editing with TipTap
- Category assignment
- Custom styling options
- Content truncation for layout consistency
- PDF and image support

**Image Widgets:**
- Multiple image format support
- Customizable fit options (cover, contain, fill)
- Border radius and shadow settings
- Hover effects and animations

### **Category System**
- Create and manage notice categories
- Assign icons to categories
- Edit category names
- Filter notices by category
- Uncategorized notices handling

### **Public Display Features**
- Real-time content updates
- QR code integration for mobile access
- Customizable branding and styling
- Emergency contact information display
- Auto-refresh capabilities

## �� API Endpoints

### **Authentication**
- `POST /api/auth/signin` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/session` - Get current session

### **Notices**
- `GET /api/notice/get-all` - Fetch all notices
- `POST /api/notice/create` - Create new notice
- `PUT /api/notice/update` - Update notice
- `DELETE /api/notice/delete` - Delete notice
- `GET /api/notice/download/[id]` - Download notice file
- `GET /api/notice/download-image/[id]` - Download notice image

### **Categories**
- `GET /api/category/get-all` - Fetch all categories
- `POST /api/category/create` - Create category
- `PUT /api/category/update` - Update category
- `DELETE /api/category/delete/[id]` - Delete category

### **Dashboard**
- `GET /api/dashboard/get-all` - Fetch all dashboards
- `GET /api/dashboard/get-by-id/[id]` - Fetch specific dashboard
- `GET /api/dashboard/get-default` - Fetch default dashboard
- `PUT /api/dashboard/update/[id]` - Update dashboard

### **Templates**
- `GET /api/templates` - Fetch all templates
- `POST /api/templates` - Create template
- `GET /api/templates/[id]` - Fetch specific template
- `PUT /api/templates/[id]` - Update template
- `DELETE /api/templates/[id]` - Delete template

### **Public Notice Settings**
- `GET /api/public-notice-settings` - Fetch settings
- `PUT /api/public-notice-settings` - Update settings

### **Admin Management**
- `GET /api/admin/allAdmins` - Fetch all admins
- `POST /api/admin` - Create admin
- `DELETE /api/admin/delete/[id]` - Delete admin

## 🎯 Usage Examples

### **Creating a Notice**
1. Navigate to Dashboard → Create Notice
2. Use the rich text editor to create content
3. Select a category or create a new one
4. Upload PDF or image files if needed
5. Save the notice

### **Customizing Dashboard Layout**
1. Go to Dashboard → Layout Editor
2. Drag widgets to desired positions
3. Resize widgets as needed
4. Configure widget settings
5. Save the layout

### **Managing Categories**
1. Access Dashboard → Category
2. Create new categories with custom names
3. Assign icons to categories
4. Assign categories to notices
5. Filter and organize content

### **Setting Up Public Display**
1. Go to Dashboard → Manage Public Notice
2. Configure branding (logo, title, subtitle)
3. Set background (solid, gradient, or image)
4. Add emergency contact information
5. Save settings

## 🔒 Security Features

- **Password Hashing**: Bcrypt encryption for user passwords
- **Session Management**: Secure session handling with NextAuth.js
- **Input Validation**: Zod schema validation for all inputs
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **XSS Protection**: Content sanitization and CSP headers
- **Protected Routes**: Middleware-based authentication
- **File Upload Security**: Base64 encoding and validation

## �� Deployment

### **Vercel Deployment**
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### **Docker Deployment**
1. Build the Docker image
2. Configure environment variables
3. Run with Docker Compose

### **Traditional Server**
1. Build the production version: `npm run build`
2. Start the production server: `npm start`
3. Configure reverse proxy (nginx/Apache)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Next.js Team** - For the amazing React framework
- **Vercel** - For hosting and deployment platform
- **Prisma Team** - For the excellent database toolkit
- **Tailwind CSS** - For the utility-first CSS framework
- **Radix UI** - For accessible component primitives

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the documentation
- Contact the development team

---

**Made with ❤️ by the SmartNoticeBoard Team**
