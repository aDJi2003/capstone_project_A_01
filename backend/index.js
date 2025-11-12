import express from "express";
import mongoose from "mongoose";
import mqtt from "mqtt";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import csv from "csv-parser";
import { Readable } from "stream";

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
const BROKER_URL = 'mqtt://test.mosquitto.org:1883';
const TOPIC = 'sensor/data/system';
const COMMAND_TOPIC = 'building/room/command';

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

const zeroTracker = {
  suhu: { '0': 0 },         // sensor1 (indeks 0)
  kelembapan: { '0': 0 },  // sensor1 (indeks 0)
  cahaya: { '0': 0, '1': 0 }, // sensor1 (indeks 0), sensor2 (indeks 1)
  gas: { '0': 0 },          // sensor1 (indeks 0)
  arus: { '0': 0 },         // sensor1 (indeks 0)
};

client.on("message", async (topic, payload) => {
  const messageString = payload.toString();

  // 1. Tangani pesan PERINTAH
  if (topic === COMMAND_TOPIC) {
    const command = JSON.parse(messageString);
    console.log(`Command Received: Set ${command.type} ${command.index} to ${command.level}`);
    return;
  }

  // 2. Tangani pesan DATA SENSOR
  if (topic === TOPIC) {
    // Abaikan baris header
    if (messageString.includes("lux1,lux2,lux3,lux4")) {
      console.log("Received CSV header, ignoring.");
      return;
    }
    
    // Fungsi internal untuk memproses data
    const processData = async (data) => {
      const newReading = new Reading(data);
      await newReading.save();
      console.log("Data saved to MongoDB!");

      // Logika deteksi error dinamis (Kode ini sudah robust, tidak perlu diubah)
      for (const sensorType in data) {
        data[sensorType].forEach(async (value, index) => {
          const key = `${sensorType}-${index}`; 
          if (!zeroTracker[key]) zeroTracker[key] = 0;
          if (value === 0) zeroTracker[key]++;
          else zeroTracker[key] = 0;

          if (zeroTracker[key] === 3) {
            const sensorIndex = `sensor${index + 1}`;
            console.log(`FAILURE DETECTED: ${sensorType} ${sensorIndex}`);
            const existingFailure = await Failure.findOne({ sensorType, sensorIndex, resolved: false });
            if (!existingFailure) {
              const message = `Sensor ${sensorType} (${sensorIndex}) reported zero value 3 times in a row.`;
              await Failure.create({ sensorType, sensorIndex, message });
            }
            zeroTracker[key] = 0;
          }
        });
      }
    };

    // --- LOGIKA PARSING BARU (Format 11 Kolom) ---
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
            parseNumeric(row['0'], false),
            parseNumeric(row['1'], false),
            parseNumeric(row['2'], false),
            parseNumeric(row['3'], false)
          ].filter(v => v !== null),
          gas: [
            parseNumeric(row['4'], false),
            parseNumeric(row['5'], false)
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
            parseNumeric(row['10'], false)
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
      return res
        .status(404)
        .json({ message: "No user found with that email address." });
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;

    await user.save();

    const resetLink = `http://localhost:3000/reset-password/${token}`;

    console.log("--------------------");
    console.log("PASSWORD RESET LINK (COPY TO BROWSER):");
    console.log(resetLink);
    console.log("--------------------");

    res.json({
      message:
        "A password reset link has been generated. Check the backend console.",
    });
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

app.post("/api/auth/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Password reset token is invalid or has expired." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password has been updated successfully." });
  } catch (error) {
    res.status(500).send("Server Error");
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

  // Buat output dinamis untuk 4 sensor (jumlah maksimum)
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

  const commandTopic = "building/room/command";
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
