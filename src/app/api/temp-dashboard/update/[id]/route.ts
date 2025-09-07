import { NextRequest, NextResponse } from 'next/server'
import { updateTempDashboard } from '@/app/actions/dashboard.action'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id } = await params
    const result = await updateTempDashboard(id, body)
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to update temp dashboard' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error updating temp dashboard:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
