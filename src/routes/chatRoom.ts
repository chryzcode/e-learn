import express from "express";
import {
  userRooms,
  roomMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  leaveRoom,
  inviteUserToRoom,
  removeUser,
  getAChatRoom,
  getAChatRoomByCourseId,
} from "../controllers/chatRoom";
import authenticateUser from "../middleware/authentication";
import authenticateInstructor from "../middleware/instructor";

const router = express.Router();

router.route("/").get(authenticateUser, userRooms);
router.route("/message/:roomId").get(authenticateUser, roomMessages).post(authenticateUser, sendMessage);
router.route("/:roomId/message/:messageId").put(authenticateUser, editMessage).delete(authenticateUser, deleteMessage);
router.route("/:roomId/exit").post(authenticateUser, leaveRoom);
router.route("/get-room/:roomId").get(getAChatRoom);
router.route("/get-room/course/:courseId").get(getAChatRoomByCourseId);
router.route("/:roomId/invite/:userId").post(authenticateUser, authenticateInstructor, inviteUserToRoom);
router.route("/:roomId/remove/:userId").post(authenticateUser, authenticateInstructor, removeUser);

export default router;
