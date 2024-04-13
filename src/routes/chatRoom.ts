import express from "express";
import { userRooms, roomMessages, sendMessage, editMessage } from "../controllers/chatRoom";
import authenticateUser from "../middleware/authentication";

const router = express.Router();

router.route("/").get(authenticateUser, userRooms);
router.route("/roomId").get(authenticateUser, roomMessages).post(authenticateUser, sendMessage);
router.route("/roomId/messageId").put(authenticateUser, editMessage).post(authenticateUser, sendMessage);

export default router;
