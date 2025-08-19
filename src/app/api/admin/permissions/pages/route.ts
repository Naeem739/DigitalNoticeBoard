import { NextResponse } from 'next/server'

// Static list of manageable pages that can be granted to moderators
// Includes top-level and dashboard routes. Admin-only admin-management
// routes (like make-admin) are excluded.
const MODERATOR_MANAGEABLE_PAGES = [
  // Top-level
  { route: '/', label: 'Home' },
  { route: '/notice', label: 'Public Notices' },
  // Dashboard root and sections
  { route: '/dashboard', label: 'Dashboard' },
  { route: '/dashboard/manage-public-notice', label: 'Notice Board Settings' },
  { route: '/dashboard/category', label: 'Notice Categories Panel' },
  // Manage Notices
  { route: '/dashboard/create-notice', label: 'Create Notice' },
  { route: '/dashboard/showNotices', label: 'All Notices' },
  { route: '/dashboard/showImageNotices', label: 'Image-Based Notices' },
  { route: '/dashboard/showPDFNotices', label: 'PDF Notices' },
  // Interface Management
  { route: '/dashboard/layout/edit-dashboard', label: 'Create New Dashboard' },
  { route: '/dashboard/noticeInterfaces', label: 'All Interfaces' },
  // User Management (moderator scope)
  { route: '/dashboard/admin/make-user', label: 'Create User' },
  { route: '/dashboard/admin/showAllUsers', label: 'Show All Users' },
]

export async function GET() {
  return NextResponse.json({ success: true, pages: MODERATOR_MANAGEABLE_PAGES })
}


