require('dotenv').config();
const mongoose = require('mongoose');
const TaxiTera = require('../models/TaxiTeraModels.js');
const Route = require('../models/RouteModel.js');
const fs = require('fs');
const path = require('path');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/taxitera';

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log('Connected to MongoDB');

  const terasPath = path.join(__dirname, 'teras.json');
  const routesPath = path.join(__dirname, 'routes.json');

  const teras = JSON.parse(fs.readFileSync(terasPath));
  const routes = JSON.parse(fs.readFileSync(routesPath));

  // Insert or update teras (upsert by name)
  const teraMap = {}; // name -> doc
  for (const t of teras) {
    const doc = await TaxiTera.findOneAndUpdate(
      { name: t.name },
      {
        $set: {
          name: t.name,
          location: { type: 'Point', coordinates: [t.lng, t.lat] },
          address: t.address || '',
          notes: t.notes || ''
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    teraMap[doc.name] = doc;
    console.log(`Upserted Tera: ${doc.name} ${doc.location} (${doc._id})`);
  }

  // Insert routes (skip if from/to not in teras)
  for (const r of routes) {
    const fromDoc = teraMap[r.fromName];
    const toDoc = teraMap[r.toName];
    if (!fromDoc || !toDoc) {
      console.warn(`Skipping route ${r.fromName} -> ${r.toName}: missing teras`);
      continue;
    }

    // upsert route by from/to to avoid duplicates
    const routeDoc = await Route.findOneAndUpdate(
      { fromTera: fromDoc._id, toTera: toDoc._id },
      {
        $set: {
          fare: r.fare,
          estimatedTimeMin: r.estimatedTimeMin,
          roadCondition: r.roadCondition,
          availabilityMin: r.availabilityMin,
          status: 'approved'
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Upserted Route: ${r.fromName} -> ${r.toName} (${routeDoc._id})`);
  }

  console.log('Seeding complete.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});