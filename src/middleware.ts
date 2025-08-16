import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 

export  async function middleware(request: NextRequest) {
//   const path = request.nextUrl.pathname

//   const isPublicPath = path === '/login' || path === '/signup' || path === '/verifyemail'

//   const token = request.cookies.get('token')?.value || ''
const token = await getToken({req:request});
const url = request.nextUrl;
// console.log("From middleware______________________________");
// console.log("TOKEN " ,token);
// console.log("______________________________________");
// console.log("URL ", url);
// console.log("______________________________________");

//   if(isPublicPath && token) {
//     return NextResponse.redirect(new URL('/', request.nextUrl))
//   }

//   if (!isPublicPath && !token) {
//     return NextResponse.redirect(new URL('/login', request.nextUrl))
//   }
if(!token && (url.pathname.startsWith('/dashboard')) ){
    return NextResponse.redirect(new URL('/login', request.nextUrl))
}
if(token && (url.pathname.startsWith('/login'))){
    // Check user role and redirect accordingly
    const userRole = token.role;
    if (userRole === 'USER') {
        return NextResponse.redirect(new URL('/', request.nextUrl))
    } else {
        return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
    }
}

// Role-based access control for dashboard routes
if(token && url.pathname.startsWith('/dashboard')) {
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
    
    // Define restricted routes for MODERATOR role
    const moderatorRestrictedRoutes = [
        '/dashboard/admin/make-admin',
        '/dashboard/admin/showAllAdmin',
        '/dashboard/admin/delete',
        '/dashboard/manage-public-notice',
        '/dashboard/category'
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
    
    // If MODERATOR role tries to access restricted routes, redirect to dashboard
    if (userRole === 'MODERATOR') {
        const isRestrictedRoute = moderatorRestrictedRoutes.some(route => 
            url.pathname.startsWith(route)
        );
        
        if (isRestrictedRoute) {
            return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
        }
    }
    
    // ADMIN role restrictions - can't access admin management pages
    if (userRole === 'ADMIN') {
        const adminOnlyRoutes = [
            '/dashboard/admin/make-admin',
            '/dashboard/admin/showAllAdmin'
        ];
        
        const isAdminOnlyRoute = adminOnlyRoutes.some(route => 
            url.pathname.startsWith(route)
        );
        
        if (isAdminOnlyRoute) {
            return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
        }
    }
}

return NextResponse.next()
    
}

 
// See "Matching Paths" below to learn more
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