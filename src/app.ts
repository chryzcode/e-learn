import "dotenv/config";
import mongoose from "mongoose";
import express from "express";
import "express-async-errors";

import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

//error handler
import errorHandlerMiddleware from "./middleware/error-handler";
import notFoundMiddleware from "./middleware/not-found";

const PORT = process.env.PORT || 8000;

const app = express();

app.set("trust proxy", 1);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, //15 mins
    max: 100, //limit each ip to 100 requests per windowsMs
  })
);

app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: any, res: any) => {
  res.send("E-learn");
});

import userRoute from "./routes/user";
import courseRoute from "./routes/course";
import paymentRoute from "./routes/payment";
import roomRoute from "./routes/chatRoom";
import notificationRoute from "./routes/notification";

app.use("/", userRoute);
app.use("/course", courseRoute);
app.use("/payment", paymentRoute);
app.use("/room", roomRoute);
app.use("/notification", notificationRoute);

app.use(errorHandlerMiddleware);
app.use(notFoundMiddleware);

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
