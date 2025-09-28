// src/app/api/copernicus/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Mock data function to generate slightly varied data for different locations
const generateMockData = (location: string) => {
  const baseTemp = 28;
  const baseSalinity = 35;
  return {
    temperature: parseFloat((baseTemp + Math.random() * 2 - 1).toFixed(1)),
    salinity: parseFloat((baseSalinity + Math.random() * 1 - 0.5).toFixed(1)),
    currentSpeed: parseFloat((Math.random() * 1.5).toFixed(1)),
    location: location,
    timestamp: new Date().toISOString(),
  };
};

export async function GET(request: NextRequest) {
  try {
    const username = process.env.COPERNICUS_MARINE_USERNAME;
    const password = process.env.COPERNICUS_MARINE_PASSWORD;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Copernicus Marine credentials not configured' },
        { status: 500 }
      );
    }

    const locations = [
      'Lakshadweep Sea',
      'Andaman Sea',
      'Gulf of Mannar',
      'Bay of Bengal',
    ];

    const marineData = locations.map(generateMockData);

    return NextResponse.json(marineData);
  } catch (error) {
    console.error('Error fetching Copernicus data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marine data' },
      { status: 500 }
    );
  }
}
