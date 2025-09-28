// src/app/api/abnormalities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export async function GET(request: NextRequest) {
  try {
    const csvFilePath = path.resolve(process.cwd(), 'occurrence.csv');
    const csvFile = fs.readFileSync(csvFilePath, 'utf8');

    let abnormalities: any[] = [];

    await new Promise<void>((resolve, reject) => {
      Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const sortedData = results.data
            .map((row: any) => ({
              ...row,
              individualCount: parseInt(row.individualCount, 10) || 0,
            }))
            .sort((a, b) => b.individualCount - a.individualCount);

          abnormalities = sortedData.slice(0, 5).map((row: any) => ({
            scientificName: row.scientificName,
            individualCount: row.individualCount,
            locality: row.locality,
            waterBody: row.waterBody,
            decimalLatitude: row.decimalLatitude,
            decimalLongitude: row.decimalLongitude,
          }));
          resolve();
        },
        error: (error: any) => {
          reject(error);
        },
      });
    });

    return NextResponse.json({ abnormalities });

  } catch (error) {
    console.error('Error fetching abnormalities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch abnormality data' },
      { status: 500 }
    );
  }
}
