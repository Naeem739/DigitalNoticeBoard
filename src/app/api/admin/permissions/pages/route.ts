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
  { route: '/noticeboard/settings', label: 'Notice Board Settings' },
  { route: '/category', label: 'Notice Categories Panel' },
  // Manage Notices
  { route: '/create/notice', label: 'Create Notice' },
  { route: '/notices/all', label: 'All Notices' },
  { route: '/notices/images', label: 'Image-Based Notices' },
  { route: '/notices/pdfs', label: 'PDF Notices' },
  // Interface Management
  { route: '/create-layout', label: 'Create New Dashboard' },
  { route: '/layouts/all', label: 'All Interfaces' },
  // User Management (moderator scope)
  { route: '/dashboard/admin/make-user', label: 'Create User' },
  { route: '/dashboard/admin/showAllUsers', label: 'Show All Users' },
]

export async function GET() {
  return NextResponse.json({ success: true, pages: MODERATOR_MANAGEABLE_PAGES })
}


