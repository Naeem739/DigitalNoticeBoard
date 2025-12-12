import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Skip authentication for notice page
  if (url.pathname.startsWith('/notice')) {
    return NextResponse.next()
  }

  // Get token - let NextAuth determine secureCookie based on environment
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    // Don't manually set secureCookie - let NextAuth detect it
  });

  console.log("Middleware Token:", {
    path: url.pathname,
    hasToken: !!token,
    tokenEmail: token?.email,
    tokenRole: token?.role,
    cookies: request.cookies.getAll().map(c => c.name),
    origin: url.origin,
  });

  if (!token && url.pathname.startsWith('/dashboard')) {
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

  // Role-based access control for dashboard routes
  if (token && url.pathname.startsWith('/dashboard')) {
    const userRole = token.role;
    
    // Define restricted routes for USER role
    const userRestrictedRoutes = [
      '/dashboard/admin',
      '/dashboard/category',
      '/dashboard/manage-public-notice',
      '/dashboard/layout',
      '/dashboard/noticeInterfaces',
      '/dashboard/create-notice'
    ];
    
    // Admin-only and Super Admin-only areas are always restricted for moderators
    const adminOnlyRoutes = [
      '/dashboard/admin/make-admin',
      '/dashboard/admin/showAllAdmin',
      '/dashboard/admin/delete'
    ];
    
    // If USER role tries to access restricted routes, redirect to showNotices
    if (userRole === 'USER') {
      const isRestrictedRoute = userRestrictedRoutes.some(route => 
        url.pathname.startsWith(route)
      );
      
      if (isRestrictedRoute) {
        return NextResponse.redirect(new URL('/dashboard/showNotices', request.nextUrl))
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
        const canAccess = enforceableRoutes.some(route => {
          if (route === '/dashboard') {
            return url.pathname === '/dashboard';
          }
          return url.pathname.startsWith(route);
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
        '/dashboard/admin/showAllAdmin'
      ];
      const isAdminOnlyRoute = adminOnlySuperAdminRoutes.some(route => 
        url.pathname.startsWith(route)
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
  ]
}