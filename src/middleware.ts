import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Skip authentication for notice page and public routes
  if (url.pathname.startsWith('/notice') && !url.pathname.startsWith('/noticeboard')) {
    return NextResponse.next()
  }

  // Get token - explicitly set secureCookie based on environment
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  });

  console.log("Middleware Token:", {
    path: url.pathname,
    hasToken: !!token,
    tokenEmail: token?.email,
    tokenRole: token?.role,
    cookies: request.cookies.getAll().map(c => c.name),
    origin: url.origin,
  });

  // Map short URLs to their actual routes for middleware checks
  const routeMap: Record<string, string> = {
    '/category': '/dashboard/category',
    '/noticeboard/settings': '/dashboard/manage-public-notice',
    '/layouts/all': '/dashboard/noticeInterfaces',
    '/create/notice': '/dashboard/create-notice',
    '/notices/all': '/dashboard/showNotices',
    '/notices/images': '/dashboard/showImageNotices',
    '/notices/pdfs': '/dashboard/showPDFNotices',
    '/create-layout': '/dashboard/layout/edit-dashboard',
    '/admin': '/dashboard/admin/showAllAdmin',
    '/admin/make': '/dashboard/admin/make-admin',
  }
  
  // Check if current path is a short URL that needs authentication
  const actualPath = routeMap[url.pathname] || url.pathname
  const isShortUrl = routeMap[url.pathname] !== undefined
  
  if (!token && (url.pathname.startsWith('/dashboard') || isShortUrl)) {
    console.log("No token - redirecting to login");
    return NextResponse.redirect(new URL('/login', request.nextUrl))
  }

  if (token && url.pathname.startsWith('/login')) {
    console.log("Has token - redirecting from login");
    // Check user role and redirect accordingly
    const userRole = token.role;
    if (userRole === 'USER') {
      return NextResponse.redirect(new URL('/', request.nextUrl))
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
    }
  }

  // Role-based access control for dashboard routes and short URLs
  if (token && (url.pathname.startsWith('/dashboard') || isShortUrl)) {
    const userRole = token.role;
    
    // Define restricted routes for USER role (both short and long URLs)
    const userRestrictedRoutes = [
      '/dashboard/admin',
      '/dashboard/category',
      '/category',
      '/dashboard/manage-public-notice',
      '/noticeboard/settings',
      '/dashboard/layout',
      '/create-layout',
      '/dashboard/noticeInterfaces',
      '/layouts/all',
      '/dashboard/create-notice',
      '/create/notice'
    ];
    
    // Admin-only and Super Admin-only areas are always restricted for moderators
    const adminOnlyRoutes = [
      '/dashboard/admin/make-admin',
      '/admin/make',
      '/dashboard/admin/showAllAdmin',
      '/admin',
      '/dashboard/admin/delete'
    ];
    
    // If USER role tries to access restricted routes, redirect to showNotices
    if (userRole === 'USER') {
      const isRestrictedRoute = userRestrictedRoutes.some(route => 
        url.pathname.startsWith(route) || actualPath.startsWith(route)
      );
      
      if (isRestrictedRoute) {
        return NextResponse.redirect(new URL('/notices/all', request.nextUrl))
      }
    }
    
    // If MODERATOR role, enforce allowed routes fresh from API so updates apply immediately
    if (userRole === 'MODERATOR') {
      // Always block admin-only routes for moderators
      const hitsAdminOnly = adminOnlyRoutes.some(route => url.pathname.startsWith(route));
      if (hitsAdminOnly) {
        return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
      }
      let allowedRoutes: string[] = []
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const moderatorId = ((token as any).id as string) || (token.sub as string)
        const origin = request.nextUrl.origin
        const apiUrl = `${origin}/api/admin/permissions/${moderatorId}`
        const res = await fetch(apiUrl, { 
          headers: { 'x-internal-permission-check': '1' },
          signal: AbortSignal.timeout(5000)
        })
        if (res.ok) {
          const json = await res.json()
          allowedRoutes = Array.isArray(json.allowedRoutes) ? json.allowedRoutes : ['/']
        } else {
          allowedRoutes = ['/']
        }
      } catch (e) {
        console.error("Error fetching moderator permissions:", e);
        allowedRoutes = ['/']
      }
      // Ignore '/' when enforcing dashboard access, otherwise it would match everything
      const enforceableRoutes = allowedRoutes.filter(r => r && r !== '/');
      // Dashboard route is always accessible for moderators
      if (url.pathname === '/dashboard') {
        // Allow access to dashboard root
      } else {
        // Only explicitly granted routes are allowed for other dashboard pages
        // Map short URLs back to their original routes for permission checking
        const checkPath = actualPath || url.pathname
        const canAccess = enforceableRoutes.some(route => {
          if (route === '/dashboard') {
            return url.pathname === '/dashboard';
          }
          // Check both the current path and the mapped path
          return url.pathname.startsWith(route) || checkPath.startsWith(route);
        });
        if (!canAccess) {
          return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
        }
      }
    }
    
    // ADMIN role restrictions - can't access super-admin management pages
    if (userRole === 'ADMIN') {
      const adminOnlySuperAdminRoutes = [
        '/dashboard/admin/make-admin',
        '/admin/make',
        '/dashboard/admin/showAllAdmin',
        '/admin'
      ];
      const isAdminOnlyRoute = adminOnlySuperAdminRoutes.some(route => 
        url.pathname.startsWith(route) || actualPath.startsWith(route)
      );
      
      if (isAdminOnlyRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/profile',
    '/login',
    '/signup',
    '/verifyemail',
    '/dashboard/:path*',
    '/category',
    '/noticeboard/:path*',
    '/layouts/:path*',
    '/create/:path*',
    '/notices/:path*',
    '/create-layout',
    '/admin/:path*',
  ]
}