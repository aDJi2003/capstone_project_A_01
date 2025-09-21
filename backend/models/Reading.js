import mongoose from 'mongoose';

const ReadingSchema = new mongoose.Schema({
  suhu: { type: Number, required: true },
  kelembapan: { type: Number, required: true },
  cahaya: { type: Number, required: true },
  gas: { type: Number, required: true },
  arus: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Reading = mongoose.model('Reading', ReadingSchema);
export default Reading;