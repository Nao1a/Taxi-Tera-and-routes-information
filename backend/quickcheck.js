// quick-check.js
const mongoose = require('mongoose');
require('dotenv').config();
const TaxiTera = require('./models/TaxiTeraModels');
const Route = require('./models/RouteModel');

async function check() {
  url = process.env.MONGO_URL || 'mongodb://localhost:27017/taxitera';
  await mongoose.connect(url);
  const teras = await TaxiTera.find({});
  console.log('Teras:', teras.map(t => ({ id: t._id.toString(), name: t.name , location : t.location.coordinates })));

  const routes = await Route.find({}).populate('fromTera toTera').lean();
  console.log('Routes:');
  routes.forEach(r => {
    console.log(`${r.fromTera.name} -> ${r.toTera.name} | fare=${r.fare} | time=${r.estimatedTimeMin}`);
  });

  await mongoose.disconnect();
}
check();
