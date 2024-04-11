import express from "express";
import { userRooms } from "../controllers/chatRoom";
import authenticateUser from "../middleware/authentication";

const router = express.Router();

router.route("/").get(authenticateUser, userRooms);

export default router;
