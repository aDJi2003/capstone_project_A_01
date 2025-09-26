import mongoose from 'mongoose';

const CommandSchema = new mongoose.Schema({
  user: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String }
  },
  actuatorType: { type: String, required: true },
  actuatorIndex: { type: Number, required: true },
  level: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Command = mongoose.model('Command', CommandSchema);
export default Command;