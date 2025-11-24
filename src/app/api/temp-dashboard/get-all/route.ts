/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server'
import { getAllTempDashboards } from '@/app/actions/dashboard.action'

export async function GET() {
  try {
    const result = await getAllTempDashboards()
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch temp dashboards' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error fetching temp dashboards:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
