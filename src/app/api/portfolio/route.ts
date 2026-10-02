import { NextResponse } from 'next/server';
import { buildPortfolioSummary } from '@/services/portfolio';
import { PortfolioApiResponse } from '@/types/portfolio';

export async function GET(): Promise<NextResponse<PortfolioApiResponse>> {
  try {
    const summary = await buildPortfolioSummary();
    
    return NextResponse.json({
      data: summary,
      error: null,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Portfolio API error:', error);
    return NextResponse.json(
      {
        data: null,
        error: 'Failed to fetch portfolio data',
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}