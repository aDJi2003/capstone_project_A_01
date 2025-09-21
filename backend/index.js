import express from 'express';
import mongoose from 'mongoose';
import mqtt from 'mqtt';
import dotenv from 'dotenv';
import Reading from './models/Reading.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB!'))
  .catch(err => console.error('DB Connection Error:', err));

const BROKER_URL = 'mqtt://localhost:1883';
const TOPIC = 'building/room/data';

const client = mqtt.connect(BROKER_URL, {
  clientId: `mqtt_backend_subscriber_${Math.random().toString(16).slice(3)}`,
});

client.on('connect', () => {
  console.log('MQTT Backend connected to Broker!');
  client.subscribe([TOPIC], (err) => {
    if (!err) {
      console.log(`Subscribed to topic: [${TOPIC}]`);
    } else {
      console.error('Subscription error:', err);
    }
  });
});

client.on('message', async (topic, payload) => {
  console.log(`Message received from topic [${topic}]: ${payload.toString()}`);

  try {
    const data = JSON.parse(payload.toString());

    const newReading = new Reading({
      suhu: data.suhu,
      kelembapan: data.kelembapan,
      cahaya: data.cahaya,
      gas: data.gas,
      arus: data.arus,
    });

    await newReading.save();
    console.log('Data saved to MongoDB!');
  } catch (error) {
    console.error('Failed to parse or save data:', error);
  }
});

client.on('error', (err) => {
  console.error('MQTT Connection Error:', err);
});

app.get('/', (req, res) => {
  res.send('Backend Server is running.');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});