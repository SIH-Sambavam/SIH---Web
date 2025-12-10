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
      const dataToInsert = results.data.map((row: unknown) => {
        const r = row as Record<string, string>;
        return {
          waterBody: r.waterBody,
          locality: r.locality,
          minimumDepthInMeters: r.minimumDepthInMeters,
          maximumDepthInMeters: r.maximumDepthInMeters,
          decimalLatitude: r.decimalLatitude,
          decimalLongitude: r.decimalLongitude,
          scientificName: r.scientificName,
          habitat: r.habitat,
          individualCount: r.individualCount,
          identifiedBy: r.identifiedBy,
          image_links: r.ImageLinks
        }
      });

      if (dataToInsert.length > 0) {
        await occurrences.insertMany(dataToInsert);
        console.log('Data seeded successfully');
      } else {
        console.log('No data to seed.');
      }
      process.exit(0);
    },
    error: (error: unknown) => {
      console.error('Error parsing CSV:', error);
      process.exit(1);
    }
  });
}

seedData().catch((error) => {
  console.error('Error seeding data:', error);
  process.exit(1);
});
