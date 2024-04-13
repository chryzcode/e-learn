import express from "express";
import {
  userRooms,
  roomMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  exitRoom,
  inviteUserToRoom,
} from "../controllers/chatRoom";
import authenticateUser from "../middleware/authentication";
import authenticateStudent from "../middleware/student";

const router = express.Router();

router.route("/").get(authenticateUser, userRooms);
router.route("/:roomId").get(authenticateUser, roomMessages).post(authenticateUser, sendMessage);
router.route("/:roomId/:messageId").put(authenticateUser, editMessage).delete(authenticateUser, deleteMessage);
router.route("/:roomId/exit").post(authenticateUser, exitRoom);
router.route("/:roomId/invite").post(authenticateUser, authenticateStudent, inviteUserToRoom);

export default router;
