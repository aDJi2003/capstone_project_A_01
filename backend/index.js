import express from 'express';
import mongoose from 'mongoose';
import mqtt from 'mqtt';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import Reading from './models/Reading.js';
import User from './models/User.js';
import { protect } from './middleware/authMiddleware.js';

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

app.get('/api/latest-data', async (req, res) => {
  try {
    const latestReadings = await Reading.find()
      .sort({ timestamp: -1 })
      .limit(20);
    
    res.json(latestReadings.reverse());
  } catch (error) {
    console.error('Failed to fetch latest data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No user found with that email address.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;

    await user.save();

    const resetLink = `http://localhost:3000/reset-password/${token}`;
    
    console.log('--------------------');
    console.log('PASSWORD RESET LINK (COPY TO BROWSER):');
    console.log(resetLink);
    console.log('--------------------');

    res.json({ message: 'A password reset link has been generated. Check the backend console.' });

  } catch (error) {
    res.status(500).send('Server Error');
  }
});

app.post('/api/auth/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Password has been updated successfully.' });

  } catch (error) {
    res.status(500).send('Server Error');
  }
});

app.get('/api/users/me', protect, (req, res) => {
  res.json(req.user);
});

app.post('/api/users/change-password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully.' });

  } catch (error) {
    res.status(500).send('Server Error');
  }
});

app.get('/', (req, res) => {
  res.send('Backend Server is running.');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});