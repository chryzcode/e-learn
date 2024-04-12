import express from "express";
import { userRooms, roomMessages, sendMessage } from "../controllers/chatRoom";
import authenticateUser from "../middleware/authentication";

const router = express.Router();

router.route("/").get(authenticateUser, userRooms);
router.route("/roomId").get(authenticateUser, roomMessages).post(authenticateUser, sendMessage);

export default router;
