require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const databaseName = process.env.MONGODB_DB || 'dental_clinic';
const client = new MongoClient(uri);
let appointments;

async function initDb() {
  await client.connect();
  appointments = client.db(databaseName).collection('appointments');
  await appointments.createIndex({
    status: 1,
    reminder_sent: 1,
    appointment_date: 1,
    appointment_time: 1,
  });
  console.log(`[db] connected to MongoDB database "${databaseName}"`);
}

function getAppointmentsCollection() {
  if (!appointments) throw new Error('MongoDB has not been initialized');
  return appointments;
}

module.exports = { getAppointmentsCollection, initDb };
