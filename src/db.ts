import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionString = process.env.MONGO_URI;
    await mongoose.connect(connectionString as any);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit the process with failure
  }
};

export default connectDB;
