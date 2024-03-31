import "dotenv/config";
import mongoose from "mongoose";
import express from "express";

const PORT = process.env.PORT || 8000;

const app = express();

app.use(express.json());


const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    app.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
