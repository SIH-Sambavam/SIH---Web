import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('occurrences');
    const { id } = await params;

    // Get detailed information for a specific species
    const pipeline = [
      { $match: { scientificName: id } },
      {
        $group: {
          _id: '$scientificName',
          scientificName: { $first: '$scientificName' },
          occurrenceCount: { $sum: 1 },
          habitats: { $addToSet: '$habitat' },
          localities: { $addToSet: '$locality' },
          waterBodies: { $addToSet: '$waterBody' },
          countries: { $addToSet: '$country' },
          minDepth: { $min: { $toDouble: '$minimumDepthInMeters' } },
          maxDepth: { $max: { $toDouble: '$maximumDepthInMeters' } },
          avgDepth: { $avg: { $toDouble: '$minimumDepthInMeters' } },
          lastEventDate: { $max: '$eventDate' },
          firstEventDate: { $min: '$eventDate' },
          coordinates: {
            $push: {
              lat: { $toDouble: '$decimalLatitude' },
              lng: { $toDouble: '$decimalLongitude' },
              locality: '$locality',
              date: '$eventDate'
            }
          },
          identifiedBy: { $addToSet: '$identifiedBy' },
          samplingProtocols: { $addToSet: '$samplingProtocol' },
          lifeStages: { $addToSet: '$lifeStage' },
          sexes: { $addToSet: '$sex' },
          individualCounts: { $push: { $toInt: '$individualCount' } },
          image_links: { $addToSet: '$image_links' }
        }
      }
    ];

    const result = await collection.aggregate(pipeline).toArray();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Species not found' },
        { status: 404 }
      );
    }

    const species = result[0];

    // Get recent occurrences for timeline
    const recentOccurrences = await collection
      .find({ scientificName: id })
      .sort({ eventDate: -1 })
      .limit(10)
      .toArray();

    // Calculate some statistics
    const totalIndividuals = species.individualCounts
      .filter((count: number) => !isNaN(count) && count > 0)
      .reduce((sum: number, count: number) => sum + count, 0);

    const avgIndividualsPerOccurrence = totalIndividuals / species.occurrenceCount;

    const detailedSpecies = {
      id: species._id,
      scientificName: species.scientificName,
      name: species.scientificName?.split(' ')[0] || 'Unknown Species',
      occurrenceCount: species.occurrenceCount,
      totalIndividuals,
      avgIndividualsPerOccurrence: Math.round(avgIndividualsPerOccurrence * 100) / 100,
      habitats: species.habitats?.filter(Boolean) || [],
      localities: species.localities?.filter(Boolean) || [],
      waterBodies: species.waterBodies?.filter(Boolean) || [],
      countries: species.countries?.filter(Boolean) || [],
      images: species.image_links?.filter(Boolean) || [],
      depthRange: {
        min: species.minDepth || 0,
        max: species.maxDepth || 0,
        avg: Math.round((species.avgDepth || 0) * 100) / 100
      },
      dateRange: {
        first: species.firstEventDate,
        last: species.lastEventDate
      },
      coordinates: species.coordinates?.filter((coord: any) =>
        !isNaN(coord.lat) && !isNaN(coord.lng) && coord.lat !== 0 && coord.lng !== 0
      ) || [],
      identifiedBy: species.identifiedBy?.filter(Boolean) || [],
      samplingProtocols: species.samplingProtocols?.filter(Boolean) || [],
      lifeStages: species.lifeStages?.filter(Boolean) || [],
      sexes: species.sexes?.filter(Boolean) || [],
      recentOccurrences: recentOccurrences.map(occ => ({
        id: occ._id,
        date: occ.eventDate,
        locality: occ.locality,
        habitat: occ.habitat,
        depth: `${occ.minimumDepthInMeters || 0}m - ${occ.maximumDepthInMeters || 0}m`,
        individualCount: occ.individualCount,
        identifiedBy: occ.identifiedBy
      }))
    };

    return NextResponse.json(detailedSpecies);

  } catch (error) {
    console.error('Error fetching species details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch species details' },
      { status: 500 }
    );
  }
}