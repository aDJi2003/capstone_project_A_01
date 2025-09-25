import mongoose from "mongoose";

const SensorDataSchema = new mongoose.Schema(
  {
    sensor1: { type: Number, required: true },
    sensor2: { type: Number, required: true },
  },
  { _id: false }
);

const ReadingSchema = new mongoose.Schema({
  suhu: SensorDataSchema,
  kelembapan: SensorDataSchema,
  cahaya: SensorDataSchema,
  gas: SensorDataSchema,
  arus: SensorDataSchema,
  timestamp: { type: Date, default: Date.now },
});

const Reading = mongoose.model("Reading", ReadingSchema);
export default Reading;
