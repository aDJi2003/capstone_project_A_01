import express from "express";
import mongoose from "mongoose";
import mqtt from "mqtt";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import csv from "csv-parser";
import { Readable } from "stream";
import nodemailer from 'nodemailer';

import Reading from "./models/Reading.js";
import User from "./models/User.js";
import { protect } from "./middleware/authMiddleware.js";
import Failure from "./models/Failure.js";
import Command from "./models/Command.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err) => console.error("DB Connection Error:", err));

// const BROKER_URL = "mqtt://localhost:1883";
// const TOPIC = "building/room/data";
const BROKER_URL = 'mqtt://broker.hivemq.com:1883';
const TOPIC = 'sensor/data/system';
const COMMAND_TOPIC = 'device/control';

const client = mqtt.connect(BROKER_URL, {
  clientId: `mqtt_backend_subscriber_${Math.random().toString(16).slice(3)}`,
});

client.on("connect", () => {
  console.log("MQTT Backend connected to Broker!");
  client.subscribe([TOPIC], (err) => {
    if (!err) {
      console.log(`Subscribed to topic: [${TOPIC}]`);
    } else {
      console.error("Subscription error:", err);
    }
  });
});

const zeroTracker = {};

client.on("message", async (topic, payload) => {
  const messageString = payload.toString();

  if (topic === TOPIC) {
    if (messageString.includes("lux1,lux2,lux3,lux4")) {
      console.log("Received CSV header, ignoring.");
      return;
    }
    
    const processData = async (data) => {
      const newReading = new Reading(data);
      await newReading.save();
      console.log("Data saved to MongoDB!");

      for (const sensorType in data) {
        const sensorValues = data[sensorType];
        
        for (let index = 0; index < sensorValues.length; index++) {
          const value = sensorValues[index];
          const key = `${sensorType}-${index}`; 

          if (zeroTracker[key] === undefined) {
            zeroTracker[key] = 0;
          }
          
          if (value === 0) {
            zeroTracker[key]++;
          } else {
            zeroTracker[key] = 0;
          }

          if (zeroTracker[key] === 3) {
            const sensorIndex = `sensor${index + 1}`;
            console.log(`FAILURE DETECTED: ${sensorType} ${sensorIndex}`);
            
            const existingFailure = await Failure.findOne({ 
              sensorType, 
              sensorIndex, 
              resolved: false 
            });
            
            if (!existingFailure) {
              const message = `Sensor ${sensorType} (${sensorIndex}) reported zero value 3 times in a row.`;
              await Failure.create({ sensorType, sensorIndex, message });
            }
            
            zeroTracker[key] = 0;
          }
        }
      }
    };

    console.log(`Processing message as CSV: ${messageString}`);
    const stream = Readable.from(messageString);
    stream.pipe(csv({ headers: false })).on("data", async (row) => {
      try {
        const parseNumeric = (value, isFloat = true) => {
          if (value === null || value === undefined || value.trim() === '') return null;
          const num = isFloat ? parseFloat(value) : parseInt(value, 10);
          return isNaN(num) ? null : num;
        };
        
        // Format STM32: 
        // 0-3: cahaya 1-4
        // 4-5: gas 1-2
        // 6-7: suhu 1-2
        // 8-9: kelembapan 1-2
        // 10:  arus 1
        const jsonData = {
          cahaya: [
            parseNumeric(row['0']),
            parseNumeric(row['1']),
            parseNumeric(row['2']),
            parseNumeric(row['3'])
          ].filter(v => v !== null),
          gas: [
            parseNumeric(row['4']),
            parseNumeric(row['5'])
          ].filter(v => v !== null),
          suhu: [
            parseNumeric(row['6']),
            parseNumeric(row['7'])
          ].filter(v => v !== null),
          kelembapan: [
            parseNumeric(row['8']),
            parseNumeric(row['9'])
          ].filter(v => v !== null),
          arus: [
            parseNumeric(row['10'])
          ].filter(v => v !== null)
        };

        await processData(jsonData);
      } catch (processError) {
        console.error("Failed to process CSV row:", processError);
      }
    });
  }
});

client.on("error", (err) => {
  console.error("MQTT Connection Error:", err);
});

app.get("/api/latest-data", async (req, res) => {
  try {
    const latestReadings = await Reading.find()
      .sort({ timestamp: -1 })
      .limit(20);

    res.json(latestReadings.reverse());
  } catch (error) {
    console.error("Failed to fetch latest data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
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
      { expiresIn: "1h" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_RESET_SECRET,
      { expiresIn: '15m' }
    );

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset for your account.</p>
        <p>Please click this link to reset your password (link is valid for 15 minutes):</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${user.email}`);
    
    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });

  } catch (error) {
    console.error('FORGOT PASSWORD ERROR:', error);
    res.status(500).send('Server Error');
  }
});

app.post("/api/auth/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(400).json({ message: 'Invalid token or user does not exist.' });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ message: 'Password has been updated successfully.' });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }
    console.error('RESET PASSWORD ERROR:', error);
    res.status(500).send('Server Error');
  }
});

app.get("/api/users/me", protect, (req, res) => {
  res.json(req.user);
});

app.post("/api/users/change-password", protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

app.get("/api/history/stats", protect, async (req, res) => {
  const { startTime, endTime, sensorType } = req.query;
  if (!startTime || !endTime || !sensorType) {
    return res
      .status(400)
      .json({ message: "startTime, endTime, and sensorType are required" });
  }

  try {
    const stats = await Reading.aggregate([
      {
        $match: {
          timestamp: { $gte: new Date(startTime), $lte: new Date(endTime) },
          [sensorType]: { $exists: true, $ne: [] }
        },
      },
      { $unwind: `$${sensorType}` },
      {
        $group: {
          _id: null,
          maxValue: { $max: `$${sensorType}` },
          minValue: { $min: `$${sensorType}` },
          avgValue: { $avg: `$${sensorType}` },
        },
      },
    ]).allowDiskUse(true);

    res.json(stats[0] || { maxValue: "N/A", minValue: "N/A", avgValue: "N/A" });
  } catch (error) {
    console.error("Aggregation Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/api/history/chart", protect, async (req, res) => {
  const { startTime, endTime, sensorType } = req.query;
  if (!startTime || !endTime || !sensorType) {
    return res
      .status(400)
      .json({ message: "startTime, endTime, and sensorType are required" });
  }

  const outputFields = {
    avgSensor1: { $avg: { $arrayElemAt: [`$${sensorType}`, 0] } },
    avgSensor2: { $avg: { $arrayElemAt: [`$${sensorType}`, 1] } },
    avgSensor3: { $avg: { $arrayElemAt: [`$${sensorType}`, 2] } },
    avgSensor4: { $avg: { $arrayElemAt: [`$${sensorType}`, 3] } },
  };

  try {
    const chartData = await Reading.aggregate([
      {
        $match: {
          timestamp: { $gte: new Date(startTime), $lte: new Date(endTime) },
          [sensorType]: { $exists: true, $ne: [] }
        },
      },
      {
        $bucketAuto: {
          groupBy: "$timestamp",
          buckets: 20,
          output: outputFields,
        },
      },
    ]).allowDiskUse(true);
    
    res.json(chartData);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/api/users", protect, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }

  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    await user.save();

    res
      .status(201)
      .json({ message: "User registered successfully. Please log in." });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

app.get("/api/failures/active", protect, async (req, res) => {
  try {
    const activeFailures = await Failure.find({ resolved: false }).sort({
      timestamp: -1,
    });
    res.json(activeFailures);
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

app.post("/api/failures/resolve/:id", protect, async (req, res) => {
  try {
    const failure = await Failure.findById(req.params.id);
    if (failure) {
      failure.resolved = true;
      await failure.save();
      res.json({ message: "Failure marked as resolved." });
    } else {
      res.status(404).json({ message: "Failure not found." });
    }
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

app.post("/api/control", protect, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }

  const { actuatorType, index, level } = req.body;
  if (!actuatorType || !index || !level) {
    return res.status(400).json({ message: "Required fields are missing." });
  }

  const commandTopic = COMMAND_TOPIC;
  const commandPayload = JSON.stringify({ type: actuatorType, index, level });

  client.publish(commandTopic, commandPayload, async (error) => {
    if (error) {
      return res.status(500).json({ message: "Failed to send command." });
    }

    try {
      const newCommand = new Command({
        user: { id: req.user._id, email: req.user.email },
        actuatorType,
        actuatorIndex: index,
        level,
      });
      await newCommand.save();
      console.log(`Command from ${req.user.email} logged.`);
      console.log(`Command Received: Set ${actuatorType} ${index} to ${level}`);
    } catch (dbError) {
      console.error("Failed to log command:", dbError);
    }

    res.json({
      message: `Command '${level}' sent to ${actuatorType} ${index}`,
    });
  });
});

app.get("/api/failures/all", protect, async (req, res) => {
  try {
    const allFailures = await Failure.find({}).sort({ timestamp: -1 });
    res.json(allFailures);
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

app.get("/api/commands/all", protect, async (req, res) => {
  try {
    const allCommands = await Command.find({}).sort({ timestamp: -1 });
    res.json(allCommands);
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

app.get("/api/search", protect, async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ message: "Search query is required." });
  }

  try {
    const queryRegex = new RegExp(q, "i");

    const [users, failures, commands] = await Promise.all([
      User.find({
        $or: [{ name: queryRegex }, { email: queryRegex }],
      })
        .select("-password")
        .limit(5),

      Failure.find({ message: queryRegex }).limit(5),

      Command.find({
        $or: [
          { actuatorType: queryRegex },
          { level: queryRegex },
          { "user.email": queryRegex },
        ],
      }).limit(5),
    ]);

    res.json({ users, failures, commands });
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

function classifyIKE(ikeValue) {
  if (ikeValue >= 32.99) return "Sangat Boros";
  if (ikeValue >= 26.67 && ikeValue < 32.99) return "Boros";
  if (ikeValue >= 20.25 && ikeValue < 26.67) return "Agak Boros";
  if (ikeValue >= 16.78 && ikeValue < 20.25) return "Cukup Efisien";
  if (ikeValue >= 11.01 && ikeValue < 16.78) return "Efisien";
  if (ikeValue >= 5.79 && ikeValue < 11.01) return "Sangat Efisien";
  if (ikeValue < 5.79) return "Sangat Efisien";
  return "Terjadi Kesalahan Perhitungan";
}

app.get("/api/data/ike", protect, async (req, res) => {
  try {
    const buildingArea = (0.5 * 0.3) * 2;
    const VOLTAGE = 12;

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - (1 * 60 * 60 * 1000)); 

    const energyData = await Reading.aggregate([
      { $match: { timestamp: { $gte: oneHourAgo, $lte: now } } },
      { $unwind: "$arus" },
      {
        $group: {
          _id: null,
          totalAmpereSeconds: { $sum: "$arus" } 
        }
      }
    ]);

    if (!energyData.length) {
      return res.json({ ikeValue: 0, classification: "N/A" });
    }

    const totalAmpSeconds = energyData[0].totalAmpereSeconds;
    const totalWattSeconds = totalAmpSeconds * VOLTAGE;
    const totalWattHours = totalWattSeconds / 3600;
    const ikeValue = totalWattHours / buildingArea;
    const classification = classifyIKE(ikeValue);

    res.json({
      ikeValue: ikeValue.toFixed(2),
      classification: classification,
      energyWh: totalWattHours.toFixed(2),
    });

  } catch (error) {
    console.error("IKE Calculation Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/", (req, res) => {
  res.send("Backend Server is running.");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
