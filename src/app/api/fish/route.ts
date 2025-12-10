import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MarineSpecies, FishSpeciesCard } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('occurrences');

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const habitat = searchParams.get('habitat');
    const locality = searchParams.get('locality');
    const scientificName = searchParams.get('scientificName');

    // Build query
    const query: any = {};
    if (habitat) query.habitat = new RegExp(habitat, 'i');
    if (locality) query.locality = new RegExp(locality, 'i');
    if (scientificName) query.scientificName = new RegExp(scientificName, 'i');

    // Get aggregated species data
    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: '$scientificName',
          scientificName: { $first: '$scientificName' },
          occurrenceCount: { $sum: 1 },
          habitats: { $addToSet: '$habitat' },
          localities: { $addToSet: '$locality' },
          waterBodies: { $addToSet: '$waterBody' },
          minDepth: { $min: { $convert: { input: '$minimumDepthInMeters', to: 'double', onError: null, onNull: null } } },
          maxDepth: { $max: { $convert: { input: '$maximumDepthInMeters', to: 'double', onError: null, onNull: null } } },
          lastEventDate: { $max: '$eventDate' },
          avgLatitude: { $avg: { $convert: { input: '$decimalLatitude', to: 'double', onError: null, onNull: null } } },
          avgLongitude: { $avg: { $convert: { input: '$decimalLongitude', to: 'double', onError: null, onNull: null } } },
          identifiedBy: { $addToSet: '$identifiedBy' },
          image_links: { $first: '$image_links' }
        }
      },
      { $sort: { occurrenceCount: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ];

    const species = await collection.aggregate(pipeline).toArray();

    // Transform to FishSpeciesCard format
    const fishSpecies: FishSpeciesCard[] = species.map((spec, index) => {
      const commonName = spec.scientificName?.split(' ')[0] || 'Unknown Species';
      const depthRange = spec.minDepth && spec.maxDepth 
        ? `${spec.minDepth}m - ${spec.maxDepth}m`
        : 'Unknown depth';
      
      // Simple stock trend calculation based on occurrence count
      let stockTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (spec.occurrenceCount > 50) stockTrend = 'increasing';
      else if (spec.occurrenceCount < 10) stockTrend = 'decreasing';

      return {
        id: spec._id || `species-${index}`,
        name: commonName,
        scientificName: spec.scientificName || 'Unknown',
        description: `Marine species found in ${spec.waterBodies?.join(', ') || 'various water bodies'}. Commonly observed in ${spec.habitats?.join(', ') || 'marine environments'}.`,
        habitat: spec.habitats?.[0] || 'Marine',
        population: Math.min(100, Math.max(10, spec.occurrenceCount * 2)), // Normalize to 10-100 scale
        stockTrend,
        imageId: `fish${(index % 4) + 1}`, // Cycle through available fish images
        occurrenceCount: spec.occurrenceCount,
        locations: spec.localities?.filter(Boolean).slice(0, 3) || [],
        depthRange,
        lastSeen: spec.lastEventDate || 'Unknown',
        image_links: spec.image_links
      };
    });

    // Get total count for pagination
    const totalPipeline = [
      { $match: query },
      { $group: { _id: '$scientificName' } },
      { $count: 'total' }
    ];
    const totalResult = await collection.aggregate(totalPipeline).toArray();
    const total = totalResult[0]?.total || 0;

    return NextResponse.json({
      species: fishSpecies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching fish species:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fish species' },
      { status: 500 }
    );
  }
}