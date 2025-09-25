import express from 'express';
import Reading from '../models/Reading.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/latest', async (req, res) => {
  try {
    const latestReadings = await Reading.find().sort({ timestamp: -1 }).limit(20);
    res.json(latestReadings.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/history/stats', protect, async (req, res) => {
  const { startTime, endTime, sensorType } = req.query;
  if (!startTime || !endTime || !sensorType) {
    return res.status(400).json({ message: 'Required params are missing' });
  }

  const field1 = `$${sensorType}.sensor1`;
  const field2 = `$${sensorType}.sensor2`;

  try {
    const stats = await Reading.aggregate([
      { $match: { timestamp: { $gte: new Date(startTime), $lte: new Date(endTime) } } },
      { $group: { _id: null, maxValue: { $max: { $max: [field1, field2] } }, minValue: { $min: { $min: [field1, field2] } }, avgValue: { $avg: { $avg: [field1, field2] } } } }
    ]);
    res.json(stats[0] || {});
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/history/chart', protect, async (req, res) => {
  const { startTime, endTime, sensorType } = req.query;
  if (!startTime || !endTime || !sensorType) {
    return res.status(400).json({ message: 'Required params are missing' });
  }

  const outputFields = {
    avgSensor1: { $avg: `$${sensorType}.sensor1` },
    avgSensor2: { $avg: `$${sensorType}.sensor2` },
  };

  try {
    const chartData = await Reading.aggregate([
      { $match: { timestamp: { $gte: new Date(startTime), $lte: new Date(endTime) } } },
      { $bucketAuto: { groupBy: "$timestamp", buckets: 20, output: outputFields } }
    ]);
    res.json(chartData);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;