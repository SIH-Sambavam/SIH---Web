// src/lib/seed.ts
import dotenv from 'dotenv';
dotenv.config();

import { connectToDatabase } from './mongodb';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

async function seedData() {
  const db = await connectToDatabase();
  const occurrences = db.collection('occurrences');

  // Clear existing data
  await occurrences.deleteMany({});

  const csvFilePath = path.resolve(process.cwd(), 'occurrence.csv');
  const csvFile = fs.readFileSync(csvFilePath, 'utf8');

  Papa.parse(csvFile, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      const dataToInsert = results.data.map((row: any) => ({
        waterBody: row.waterBody,
        locality: row.locality,
        minimumDepthInMeters: row.minimumDepthInMeters,
        maximumDepthInMeters: row.maximumDepthInMeters,
        decimalLatitude: row.decimalLatitude,
        decimalLongitude: row.decimalLongitude,
        scientificName: row.scientificName,
        habitat: row.habitat,
        individualCount: row.individualCount,
        identifiedBy: row.identifiedBy,
        image_links: row.ImageLinks
      }));

      if (dataToInsert.length > 0) {
        await occurrences.insertMany(dataToInsert);
        console.log('Data seeded successfully');
      } else {
        console.log('No data to seed.');
      }
      process.exit(0);
    },
    error: (error: any) => {
      console.error('Error parsing CSV:', error);
      process.exit(1);
    }
  });
}

seedData().catch((error) => {
  console.error('Error seeding data:', error);
  process.exit(1);
});
