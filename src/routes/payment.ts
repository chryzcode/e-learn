import express from "express";
import { paymentSuccessful, paymentCancelled } from "../controllers/payment";

const router = express.Router();

router.route("/:paymentId/success").get(paymentSuccessful);
router.route("/:paymentId/cancel").get(paymentCancelled);

export default router;
