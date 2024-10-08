import express from "express";
import { paymentSuccessful, paymentCancelled } from "../controllers/payment";

const router = express.Router();

router.route("/:paymentId/course/:courseId/success").get(paymentSuccessful);
router.route("/:paymentId/course/:courseId/cancel").get(paymentCancelled);

export default router;
