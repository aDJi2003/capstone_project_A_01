import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, default: 'Admin' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
});

const User = mongoose.model('User', UserSchema);
export default User;