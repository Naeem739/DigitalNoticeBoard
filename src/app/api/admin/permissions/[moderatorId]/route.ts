import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ moderatorId: string }> }
) {
  try {
    const { moderatorId } = await params
    const permission = await prisma.moderatorPermission.findUnique({
      where: { moderatorId },
      select: { allowedRoutes: true }
    })
    // Default permission: Home ('/') and Dashboard ('/dashboard') when no record exists yet
    const allowedRoutes = permission ? (permission.allowedRoutes ?? []) : ['/', '/dashboard']
    return NextResponse.json({ success: true, allowedRoutes })
  } catch (error) {
    console.error('Error fetching moderator permissions:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch permissions' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ moderatorId: string }> }
) {
  try {
    const { moderatorId } = await params
    const body = await request.json()
    const routes: string[] = Array.isArray(body?.allowedRoutes) ? body.allowedRoutes : []
    
    // Ensure dashboard route is always included for moderators
    const routesWithDashboard = Array.from(new Set<string>(['/', '/dashboard', ...routes.filter(route => route !== '/' && route !== '/dashboard')]))

    // Upsert permissions
    const updated = await prisma.moderatorPermission.upsert({
      where: { moderatorId },
      create: { moderatorId, allowedRoutes: routesWithDashboard },
      update: { allowedRoutes: routesWithDashboard }
    })

    return NextResponse.json({ success: true, allowedRoutes: updated.allowedRoutes })
  } catch (error) {
    console.error('Error updating moderator permissions:', error)
    return NextResponse.json({ success: false, message: 'Failed to update permissions' }, { status: 500 })
  }
}