import express from "express";
import { paymentSuccessful, paymentCancelled } from "../controllers/payment";

const router = express.Router();

router.route("/:paymentId/success").post(paymentSuccessful);
router.route("/:paymentId/cancel").post(paymentCancelled);

export default router;
