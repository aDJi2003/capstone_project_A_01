// import mongoose from "mongoose";

// const SensorValueSchema = new mongoose.Schema({
//   sensor1: { type: Number },
//   sensor2: { type: Number },
// }, { _id: false });

// const ReadingSchema = new mongoose.Schema({
//   suhu: SensorValueSchema,
//   kelembapan: SensorValueSchema,
//   cahaya: SensorValueSchema,
//   gas: SensorValueSchema,
//   arus: SensorValueSchema,
//   timestamp: { type: Date, default: Date.now }
// });

// const Reading = mongoose.model("Reading", ReadingSchema);
// export default Reading;

import mongoose from 'mongoose';

const ReadingSchema = new mongoose.Schema({
  suhu: [Number],
  kelembapan: [Number],
  cahaya: [Number],
  gas: [Number],
  arus: [Number],
  timestamp: { type: Date, default: Date.now }
});

const Reading = mongoose.model('Reading', ReadingSchema);
export default Reading;
