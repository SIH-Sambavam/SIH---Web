// src/lib/seed-local.ts
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

async function seedDataLocal() {
  console.log('Starting local data seeding...');

  const csvFilePath = path.resolve(process.cwd(), 'occurrence.csv');
  const csvFile = fs.readFileSync(csvFilePath, 'utf8');

  Papa.parse(csvFile, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      const dataToInsert = results.data.map((row: unknown) => {
        const r = row as Record<string, string>;
        return {
          id: r.id,
          institutionCode: r.institutionCode,
          collectionCode: r.collectionCode,
          basisOfRecord: r.basisOfRecord,
          occurrenceID: r.occurrenceID,
          catalogNumber: r.catalogNumber,
          individualCount: parseInt(r.individualCount) || 0,
          sex: r.sex,
          lifeStage: r.lifeStage,
          occurrenceStatus: r.occurrenceStatus,
          eventDate: r.eventDate,
          eventTime: r.eventTime,
          habitat: r.habitat,
          samplingProtocol: r.samplingProtocol,
          waterBody: r.waterBody,
          country: r.country,
          locality: r.locality,
          minimumDepthInMeters: parseFloat(r.minimumDepthInMeters) || 0,
          maximumDepthInMeters: parseFloat(r.maximumDepthInMeters) || 0,
          decimalLatitude: parseFloat(r.decimalLatitude) || 0,
          decimalLongitude: parseFloat(r.decimalLongitude) || 0,
          identificationQualifier: r.identificationQualifier,
          typeStatus: r.typeStatus,
          identifiedBy: r.identifiedBy,
          dateIdentified: r.dateIdentified,
          identificationReferences: r.identificationReferences,
          scientificNameID: r.scientificNameID,
          scientificName: r.scientificName,
          image_links: [], // Added new field
        }
      });

      // Save to JSON file
      const outputPath = path.resolve(process.cwd(), 'data', 'occurrences.json');

      // Create data directory if it doesn't exist
      const dataDir = path.dirname(outputPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, JSON.stringify(dataToInsert, null, 2));

      console.log(`✅ Successfully processed ${dataToInsert.length} records`);
      console.log(`📁 Data saved to: ${outputPath}`);
      console.log('🎉 Local seeding completed!');

      process.exit(0);
    },
    error: (error: unknown) => {
      console.error('❌ Error parsing CSV:', error);
      process.exit(1);
    }
  });
}

seedDataLocal().catch((error) => {
  console.error('❌ Error seeding data locally:', error);
  process.exit(1);
});