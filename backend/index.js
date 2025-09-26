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
import Failure from './models/Failure.js';

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

const zeroTracker = {
  suhu: { sensor1: 0, sensor2: 0 },
  kelembapan: { sensor1: 0, sensor2: 0 },
  cahaya: { sensor1: 0, sensor2: 0 },
  gas: { sensor1: 0, sensor2: 0 },
  arus: { sensor1: 0, sensor2: 0 },
};

client.on('message', async (topic, payload) => {
  try {
    const data = JSON.parse(payload.toString());
    
    const newReading = new Reading(data);
    await newReading.save();
    console.log('Data saved to MongoDB!');

    for (const sensorType in data) {
      for (const sensorIndex in data[sensorType]) {
        if (data[sensorType][sensorIndex] === 0) {
          zeroTracker[sensorType][sensorIndex]++;
        } else {
          zeroTracker[sensorType][sensorIndex] = 0;
        }

        if (zeroTracker[sensorType][sensorIndex] === 3) {
          console.log(`FAILURE DETECTED: ${sensorIndex} ${sensorType} is possibly down!`);
          const message = `Sensor ${sensorType} (${sensorIndex}) reported zero value 3 times in a row.`;
          
          const existingFailure = await Failure.findOne({ sensorType, sensorIndex, resolved: false });
          if (!existingFailure) {
            await Failure.create({ sensorType, sensorIndex, message });
          }
          zeroTracker[sensorType][sensorIndex] = 0;
        }
      }
    }
  } catch (error) {
    console.error('Failed to process message:', error);
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

app.get('/api/history/stats', protect, async (req, res) => {
  const { startTime, endTime, sensorType } = req.query;
  if (!startTime || !endTime || !sensorType) {
    return res.status(400).json({ message: 'startTime, endTime, and sensorType are required' });
  }

  const field1 = `$${sensorType}.sensor1`;
  const field2 = `$${sensorType}.sensor2`;

  try {
    const stats = await Reading.aggregate([
      { $match: { timestamp: { $gte: new Date(startTime), $lte: new Date(endTime) } } },
      {
        $group: {
          _id: null,
          maxValue: { $max: { $max: [field1, field2] } },
          minValue: { $min: { $min: [field1, field2] } },
          avgValue: { $avg: { $avg: [field1, field2] } },
        }
      }
    ]);
    res.json(stats[0] || {});
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

app.get('/api/history/chart', protect, async (req, res) => {
  const { startTime, endTime, sensorType } = req.query;
  if (!startTime || !endTime || !sensorType) {
    return res.status(400).json({ message: 'startTime, endTime, and sensorType are required' });
  }

  const outputFields = {
    avgSensor1: { $avg: `$${sensorType}.sensor1` },
    avgSensor2: { $avg: `$${sensorType}.sensor2` },
  };

  try {
    const chartData = await Reading.aggregate([
      { $match: { timestamp: { $gte: new Date(startTime), $lte: new Date(endTime) } } },
      {
        $bucketAuto: {
          groupBy: "$timestamp",
          buckets: 20,
          output: outputFields
        }
      }
    ]);
    res.json(chartData);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

app.get('/api/users', protect, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }

  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'user',
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully. Please log in.' });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

app.get('/api/failures/active', protect, async (req, res) => {
  try {
    const activeFailures = await Failure.find({ resolved: false }).sort({ timestamp: -1 });
    res.json(activeFailures);
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

app.post('/api/failures/resolve/:id', protect, async (req, res) => {
  try {
    const failure = await Failure.findById(req.params.id);
    if (failure) {
      failure.resolved = true;
      await failure.save();
      res.json({ message: 'Failure marked as resolved.' });
    } else {
      res.status(404).json({ message: 'Failure not found.' });
    }
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

app.post('/api/control', protect, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }

  const { actuatorType, index, level } = req.body;

  if (!actuatorType || !index || !level) {
    return res.status(400).json({ message: 'actuatorType, index, and level are required.' });
  }

  const commandTopic = 'building/room/command';
  const commandPayload = JSON.stringify({
    type: actuatorType,
    index: index,
    level: level
  });

  client.publish(commandTopic, commandPayload, (error) => {
    if (error) {
      console.error('MQTT publish error:', error);
      return res.status(500).json({ message: 'Failed to send command.' });
    }
    console.log(`Command sent to ${commandTopic}:`, commandPayload);
    res.json({ message: `Command '${level}' sent to ${actuatorType} ${index}` });
  });
});


app.get('/', (req, res) => {
  res.send('Backend Server is running.');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});