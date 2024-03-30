import "dotenv/config";
import mongoose from "mongoose";
import express from "express";

const PORT = process.env.PORT || 8000;

const app = express();

const start = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
