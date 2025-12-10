import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('occurrences');

    const searchParams = request.nextUrl.searchParams;
    const scientificName = searchParams.get('scientificName');
    const habitat = searchParams.get('habitat');
    const locality = searchParams.get('locality');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build query
    const query: any = {};
    if (scientificName) query.scientificName = new RegExp(scientificName, 'i');
    if (habitat) query.habitat = new RegExp(habitat, 'i');
    if (locality) query.locality = new RegExp(locality, 'i');

    // Add coordinate filters to ensure we only get records with valid coordinates
    query.decimalLatitude = { $exists: true, $nin: [null, ''], $type: 'string' };
    query.decimalLongitude = { $exists: true, $nin: [null, ''], $type: 'string' };

    const coordinates = await collection
      .find(query)
      .limit(limit)
      .toArray();

    // Transform and filter coordinates
    const validCoordinates = coordinates
      .map(record => {
        const lat = parseFloat(record.decimalLatitude);
        const lng = parseFloat(record.decimalLongitude);

        // Validate coordinates
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
          return null;
        }

        // Basic coordinate validation (rough world bounds)
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return null;
        }

        return {
          id: record._id.toString(),
          latitude: lat,
          longitude: lng,
          title: record.locality || 'Unknown Location',
          description: `${record.scientificName || 'Unknown Species'} observed here`,
          scientificName: record.scientificName,
          habitat: record.habitat,
          depth: record.minimumDepthInMeters && record.maximumDepthInMeters
            ? `${record.minimumDepthInMeters}m - ${record.maximumDepthInMeters}m`
            : undefined,
          date: record.eventDate,
          occurrenceCount: 1,
          individualCount: record.individualCount ? parseInt(record.individualCount) : 1
        };
      })
      .filter(coord => coord !== null);

    // Group by location to reduce clutter
    const groupedCoordinates = validCoordinates.reduce((acc, coord) => {
      const key = `${coord.latitude.toFixed(4)},${coord.longitude.toFixed(4)}`;

      if (acc[key]) {
        acc[key].occurrenceCount += 1;
        acc[key].individualCount += coord.individualCount;
        acc[key].description = `${acc[key].occurrenceCount} occurrences at this location`;

        // Add species to title if different
        if (!acc[key].title.includes(coord.scientificName) && coord.scientificName) {
          acc[key].title += ` & others`;
        }
      } else {
        acc[key] = { ...coord };
      }

      return acc;
    }, {} as Record<string, any>);

    const result = Object.values(groupedCoordinates);

    return NextResponse.json({
      coordinates: result,
      total: result.length,
      query: {
        scientificName,
        habitat,
        locality,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching coordinates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coordinates' },
      { status: 500 }
    );
  }
}