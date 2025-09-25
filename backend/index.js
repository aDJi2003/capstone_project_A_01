import express from 'express';
import mongoose from 'mongoose';
import mqtt from 'mqtt';
import dotenv from 'dotenv';
import cors from 'cors';

import Reading from './models/Reading.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dataRoutes from './routes/dataRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB!'))
  .catch(err => console.error('DB Connection Error:', err));

const BROKER_URL = 'mqtt://localhost:1883';
const TOPIC = 'building/room/data';
const client = mqtt.connect(BROKER_URL);
client.on('connect', () => {
  console.log('MQTT Backend connected to Broker!');
  client.subscribe([TOPIC]);
});
client.on('message', async (topic, payload) => {
  try {
    const data = JSON.parse(payload.toString());
    const newReading = new Reading(data);
    await newReading.save();
    console.log('Data saved to MongoDB!');
  } catch (error) {
    console.error('Failed to parse or save data:', error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/data', dataRoutes);

app.get('/', (req, res) => {
  res.send('Backend Server is running.');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});