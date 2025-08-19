# Moderator Permission System

## Overview

The Smart Notice Board application implements a comprehensive permission system for moderator users that controls their access to different pages and features based on permissions set by administrators.

## How It Works

### 1. Permission Management
- **Admin Access**: Only administrators can set permissions for moderators
- **Permission Page**: `/dashboard/admin/set-permission` - where admins configure moderator access
- **Real-time Updates**: Permission changes take effect immediately without requiring logout/login

### 2. Permission Structure
The system manages permissions for the following routes:

#### Top-level Routes
- `/` - Home page
- `/notice` - Public notices page
- `/dashboard` - Dashboard (always accessible for moderators)

#### Dashboard Routes
- `/dashboard/manage-public-notice` - Notice board settings
- `/dashboard/category` - Notice categories management
- `/dashboard/create-notice` - Create new notices
- `/dashboard/showNotices` - View all notices
- `/dashboard/showImageNotices` - View image-based notices
- `/dashboard/showPDFNotices` - View PDF notices
- `/dashboard/layout/edit-dashboard` - Create/edit dashboards
- `/dashboard/noticeInterfaces` - Manage notice interfaces
- `/dashboard/admin/make-user` - Create users (moderator scope)
- `/dashboard/admin/showAllUsers` - View all users (moderator scope)

### 3. Implementation Details

#### Sidebar Filtering
The sidebar (`src/app/(WithDashboardLayout)/dashboard/components/Sidebar.tsx`) dynamically shows only the menu items that the moderator has permission to access:

```typescript
const isAllowed = (href: string) => {
  if (userRole !== 'MODERATOR') return true
  
  // Dashboard route is always allowed for moderators
  if (href === '/dashboard') {
    return true
  }
  
  // Home visibility depends only on explicit '/'
  if (href === '/') {
    return allowedRoutes.includes('/')
  }
  
  // For other routes, check if the href starts with any allowed route
  const enforceable = allowedRoutes.filter(r => r && r !== '/' && r !== '/dashboard')
  return enforceable.some(route => href.startsWith(route))
}
```

#### Dashboard Page Filtering
The main dashboard page (`src/app/(WithDashboardLayout)/dashboard/page.tsx`) also respects moderator permissions:

- **Stats Cards**: Only shows statistics for accessible sections
- **Quick Actions**: Only displays action buttons for permitted features
- **Recent Activity**: Only shows content from accessible sections
- **Dynamic Layout**: Grid columns adjust based on available permissions

#### Middleware Protection
The application middleware (`src/middleware.ts`) enforces route-level access control:

```typescript
// If MODERATOR role, enforce allowed routes fresh from API
if (userRole === 'MODERATOR') {
  // Always block admin-only routes for moderators
  const hitsAdminOnly = adminOnlyRoutes.some(route => url.pathname.startsWith(route));
  if (hitsAdminOnly) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
  }
  
  // Check moderator permissions
  const enforceableRoutes = allowedRoutes.filter(r => r && r !== '/');
  const canAccess = enforceableRoutes.some(route => url.pathname.startsWith(route));
  if (!canAccess) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
  }
}
```

### 4. Permission Flow

1. **Admin sets permissions** via the set-permission page
2. **Permissions are stored** in the database (ModeratorPermission table)
3. **Session is updated** with allowed routes via NextAuth callbacks
4. **UI components check permissions** using the `isAllowed` function
5. **Middleware enforces access** at the route level
6. **Real-time updates** are fetched fresh from the API for immediate effect

### 5. Default Behavior

- **Home (`/`)**: Must be explicitly granted
- **Dashboard (`/dashboard`)**: Always accessible for moderators
- **Admin-only routes**: Never accessible to moderators
- **No permissions set**: Moderator can only access dashboard

### 6. User Experience

#### For Moderators
- Clean, filtered interface showing only accessible features
- Clear indication of limited access status
- Seamless navigation within permitted areas
- Automatic redirects if trying to access restricted areas

#### For Administrators
- Easy-to-use permission management interface
- Real-time permission updates
- Clear visual feedback on permission changes
- Comprehensive control over moderator capabilities

## Technical Implementation

### Database Schema
```sql
model ModeratorPermission {
  id            String   @id @default(cuid())
  moderatorId   String   @unique
  allowedRoutes String[] @default([])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### API Endpoints
- `GET /api/admin/permissions/{moderatorId}` - Get moderator permissions
- `PUT /api/admin/permissions/{moderatorId}` - Update moderator permissions
- `GET /api/admin/permissions/pages` - Get manageable pages list

### Key Components
- **Sidebar**: Dynamic menu filtering
- **Dashboard**: Conditional content rendering
- **Middleware**: Route-level access control
- **Permission Manager**: Admin interface for setting permissions

This permission system ensures that moderators have appropriate access levels while maintaining security and providing a clean user experience.
