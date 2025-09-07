import { NextRequest, NextResponse } from 'next/server'
import { createTempDashboard } from '@/app/actions/dashboard.action'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await createTempDashboard(body)
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to create temp dashboard' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error creating temp dashboard:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
