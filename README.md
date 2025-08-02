# 📌 SmartNoticeBoard

A modern, responsive digital notice board system built with **Next.js 15**, featuring real-time updates, drag-and-drop layouts, and comprehensive content management.

![Next.js](https://img.shields.io/badge/Next.js-15.1.3-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-blue?style=for-the-badge&logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css)

---

## ✨ Features

### 🎨 Dashboard Management
- **Drag-and-Drop Layout**: Customizable widget positioning with React Grid Layout
- **Real-time Updates**: Live content synchronization across devices
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Template System**: Save and reuse dashboard layouts

### 📝 Content Management
- **Rich Text Editor**: Advanced content creation with TipTap
- **Category Management**: Organize notices with custom categories
- **Image Upload**: Preview-supported image upload
- **Content Truncation**: Prevent layout overflow with smart text truncation

### 🔐 Authentication & Security
- **NextAuth.js Integration**: Secure user authentication
- **Role-based Access**: Admin and user permission levels
- **Session Management**: Persistent login states
- **Password Encryption**: Bcrypt hashing for security

### 🧩 Widget System
- **Notice Widgets**: Display text content with formatting
- **Image Widgets**: Show images with customizable options
- **Statistics Widgets**: Real-time analytics
- **Customizable Settings**: Fonts, colors, borders, spacing

### 📊 Analytics & Monitoring
- **Dashboard Statistics**: Track user activity and content metrics
- **Real-time Charts**: Visual representation with Recharts
- **Performance Monitoring**: Optimized rendering and loading

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- **React Grid Layout**
- **TipTap Editor**
- **Radix UI**

### Backend
- **Next.js API Routes**
- **Prisma ORM**
- **PostgreSQL**
- **NextAuth.js**
- **Socket.IO**

### Development Tools
- **ESLint**
- **PostCSS**
- **Docker**
- **Docker Compose**

---


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

## 📁 Project Structure
   ```
SmartNoticeBoard/
├── src/
│ ├── app/ # Next.js App Router
│ │ ├── (WithDashboardLayout)/ # Dashboard pages (protected)
│ │ ├── (WithCommonLayout)/ # Public-facing pages
│ │ ├── api/ # API routes (Next.js backend)
│ │ ├── login/ # Login page
│ │ └── signup/ # Signup page
│ ├── components/ # Reusable UI components
│ ├── lib/ # Utility libraries and helpers
│ ├── types/ # TypeScript type definitions
│ ├── hooks/ # Custom React hooks
│ └── utils/ # Utility/helper functions
├── prisma/ # Database schema and migration files
├── public/ # Static files (images, icons, etc.)
└── docker-compose.yml # Docker configuration file
   ```

## 🎨 Key Features Explained

### **Dashboard Layout System**
The dashboard uses React Grid Layout for creating customizable, responsive layouts. Users can:
- Drag and drop widgets to reposition them
- Resize widgets by dragging corners
- Save layouts as templates
- Switch between different aspect ratios

### **Widget Management**
Each widget type has specific features:

**Notice Widgets:**
- Rich text editing with TipTap
- Category assignment
- Custom styling options
- Content truncation for layout consistency

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

##  API Endpoints

### **Authentication**
- `POST /api/auth/signin` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/session` - Get current session

### **Notices**
- `GET /api/notice/get-all` - Fetch all notices
- `POST /api/notice/create` - Create new notice
- `PUT /api/notice/update` - Update notice
- `DELETE /api/notice/delete` - Delete notice

### **Categories**
- `GET /api/category/get-all` - Fetch all categories
- `POST /api/category/create` - Create category
- `PUT /api/category/update` - Update category
- `DELETE /api/category/delete` - Delete category

### **Dashboard**
- `GET /api/dashboard/get` - Fetch dashboard layout
- `POST /api/dashboard/save` - Save dashboard layout
- `GET /api/templates/get-all` - Fetch saved templates

## 🎯 Usage Examples

### **Creating a Notice**
1. Navigate to Dashboard → Create Notice
2. Use the rich text editor to create content
3. Select a category or create a new one
4. Save the notice

### **Customizing Dashboard Layout**
1. Go to Dashboard → Layout Editor
2. Drag widgets to desired positions
3. Resize widgets as needed
4. Save the layout

### **Managing Categories**
1. Access Dashboard → Category
2. Create new categories with custom names
3. Assign categories to notices
4. Filter and organize content

## 🔒 Security Features

- **Password Hashing**: Bcrypt encryption for user passwords
- **Session Management**: Secure session handling with NextAuth.js
- **Input Validation**: Zod schema validation for all inputs
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **XSS Protection**: Content sanitization and CSP headers

##  Deployment

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

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the documentation
- Contact the development team

---

**Made with ❤️ by the SmartNoticeBoard Team**

