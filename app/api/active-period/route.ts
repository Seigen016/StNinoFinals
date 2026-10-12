import { getActivePeriod } from '@/lib/academic-period';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const period = await getActivePeriod();
    if (!period) return NextResponse.json({ success: false, error: 'No active period' }, { status: 404 });
    return NextResponse.json({
      success: true,
      schoolYear: period.schoolYear,
      quarter: period.quarter,
      label: period.label,
      status: period.status,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message ?? 'Internal server error' }, { status: 500 });
  }
}
