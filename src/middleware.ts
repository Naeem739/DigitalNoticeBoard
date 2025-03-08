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
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
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