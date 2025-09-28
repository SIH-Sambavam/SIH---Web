import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// Export marine species data for Tableau consumption
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const dateRange = searchParams.get('dateRange');
    const species = searchParams.get('species');
    
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    
    const db = client.db();
    const collection = db.collection('marine_species');
    
    // Build query based on parameters
    const query: any = {};
    if (dateRange) {
      const [startDate, endDate] = dateRange.split(',');
      query.eventDate = {
        $gte: startDate,
        $lte: endDate
      };
    }
    if (species) {
      query.scientificName = { $regex: species, $options: 'i' };
    }
    
    const data = await collection.find(query).toArray();
    
    await client.close();
    
    // Format data for Tableau
    const tableauData = data.map(item => ({
      id: item._id,
      scientificName: item.scientificName,
      commonName: item.vernacularName || 'Unknown',
      latitude: item.decimalLatitude,
      longitude: item.decimalLongitude,
      depth: item.minimumDepthInMeters,
      habitat: item.habitat,
      country: item.country,
      locality: item.locality,
      eventDate: item.eventDate,
      individualCount: item.individualCount || 1,
      conservationStatus: getConservationStatus(item.scientificName),
      waterBody: item.waterBody,
      samplingProtocol: item.samplingProtocol
    }));
    
    if (format === 'csv') {
      const csv = convertToCSV(tableauData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="marine_species_data.csv"'
        }
      });
    }
    
    return NextResponse.json({
      data: tableauData,
      count: tableauData.length,
      exportedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' }, 
      { status: 500 }
    );
  }
}

function getConservationStatus(scientificName: string): string {
  // Mock conservation status - replace with actual data lookup
  const statuses = ['Least Concern', 'Near Threatened', 'Vulnerable', 'Endangered', 'Critically Endangered'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}