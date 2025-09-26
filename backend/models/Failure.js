import mongoose from 'mongoose';

const FailureSchema = new mongoose.Schema({
  sensorType: { type: String, required: true },
  sensorIndex: { type: String, required: true },
  message: { type: String, required: true },
  resolved: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

const Failure = mongoose.model('Failure', FailureSchema);
export default Failure;