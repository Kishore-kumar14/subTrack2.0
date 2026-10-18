import mongoose from 'mongoose';

/**
 * Connect to MongoDB using Mongoose.
 * Supports local MongoDB instances as well as MongoDB Atlas connection strings.
 */
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/subtrack';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000 // Fast fail/warn if MongoDB is not reachable
    });

    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn(`💡 Tip: Ensure MongoDB service is running or check your MONGODB_URI in .env`);
    return null;
  }
};

/**
 * Check if MongoDB connection is active
 */
export const isDBConnected = () => {
  return mongoose.connection.readyState === 1;
};

export const getDBDetails = () => {
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  return {
    connected: mongoose.connection.readyState === 1,
    status: states[mongoose.connection.readyState] || 'Unknown',
    host: mongoose.connection.host || null,
    database: mongoose.connection.name || null,
    uri: process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:([^:@]{1,})@/, ':****@') : 'mongodb://127.0.0.1:27017/subtrack'
  };
};

// Listen to connection lifecycle events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB connection lost. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected successfully.');
});

export default connectDB;
