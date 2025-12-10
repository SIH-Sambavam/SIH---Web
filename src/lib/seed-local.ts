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
      const dataToInsert = results.data.map((row: any) => ({
        id: row.id,
        institutionCode: row.institutionCode,
        collectionCode: row.collectionCode,
        basisOfRecord: row.basisOfRecord,
        occurrenceID: row.occurrenceID,
        catalogNumber: row.catalogNumber,
        individualCount: parseInt(row.individualCount) || 0,
        sex: row.sex,
        lifeStage: row.lifeStage,
        occurrenceStatus: row.occurrenceStatus,
        eventDate: row.eventDate,
        eventTime: row.eventTime,
        habitat: row.habitat,
        samplingProtocol: row.samplingProtocol,
        waterBody: row.waterBody,
        country: row.country,
        locality: row.locality,
        minimumDepthInMeters: parseFloat(row.minimumDepthInMeters) || 0,
        maximumDepthInMeters: parseFloat(row.maximumDepthInMeters) || 0,
        decimalLatitude: parseFloat(row.decimalLatitude) || 0,
        decimalLongitude: parseFloat(row.decimalLongitude) || 0,
        identificationQualifier: row.identificationQualifier,
        typeStatus: row.typeStatus,
        identifiedBy: row.identifiedBy,
        dateIdentified: row.dateIdentified,
        identificationReferences: row.identificationReferences,
        scientificNameID: row.scientificNameID,
        scientificName: row.scientificName,
        image_links: [], // Added new field
      }));

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
    error: (error: any) => {
      console.error('❌ Error parsing CSV:', error);
      process.exit(1);
    }
  });
}

seedDataLocal().catch((error) => {
  console.error('❌ Error seeding data locally:', error);
  process.exit(1);
});