const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('URI:', process.env.MONGODB_URI);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB Connection Error:');
    console.error(`Error Message: ${error.message}`);
    console.error(`Error Code: ${error.code}`);
    console.error(`Error Name: ${error.name}`);
    process.exit(1);
  }
};

module.exports = connectDB;
