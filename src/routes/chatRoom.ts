import express from "express";
import { userRooms, roomMessages, sendMessage, editMessage, deleteMessage, exitRoom } from "../controllers/chatRoom";
import authenticateUser from "../middleware/authentication";

const router = express.Router();

router.route("/").get(authenticateUser, userRooms);
router.route("/roomId").get(authenticateUser, roomMessages).post(authenticateUser, sendMessage);
router.route("/roomId/messageId").put(authenticateUser, editMessage).delete(authenticateUser, deleteMessage);
router.route("/roomId/exit").post(authenticateUser, exitRoom);

export default router;
