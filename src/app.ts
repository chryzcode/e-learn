import "dotenv/config";
import mongoose from "mongoose";
import express from "express";

import notFoundRoute from "./middleware/not-found"



const PORT = process.env.PORT || 8000;

const app = express();

app.use(express.json());

app.use(notFoundRoute)

app.get("/", (req: any, res: any) => {
  res.send("E-learn");
});

import userRoute from "./routes/user";

app.use("/", userRoute);

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
