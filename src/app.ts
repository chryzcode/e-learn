import "dotenv/config";
import mongoose from "mongoose";
import express from "express";
import "express-async-errors";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import errorHandlerMiddleware from "./middleware/error-handler";
import notFoundMiddleware from "./middleware/not-found";

const PORT = process.env.PORT || 8000;

const app = express();
export { app }; // Export the Express app for Socket.IO integration

app.set("trust proxy", 1);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  })
);

app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send(
    `E-learn APIs  <p>Checkout the <a href="https://documenter.getpostman.com/view/31014226/2sA3Bt3VVm#19978277-2621-4a96-abe2-dc9430f6fa06">E-learn APIs Documentation</a></p>`
  );
});

// Import your routes
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
