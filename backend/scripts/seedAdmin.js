import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminEmail = '';
    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      console.log('Admin user already exists.');
      mongoose.connection.close();
      return;
    }

    const hashedPassword = await bcrypt.hash('', 10);

    await User.create({
      email: adminEmail,
      password: hashedPassword,
    });

    console.log('Admin user created successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding admin user:', error);
    mongoose.connection.close();
  }
};

seedAdmin();