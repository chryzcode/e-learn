import express from "express";
import {
  userNotifications,
  markAllNotificationAsRead,
  markANotificationAsRead,
  notificationDetail,
} from "../controllers/notification";
import authenticateUser from "../middleware/authentication";

const router = express.Router();

router.route("/").get(authenticateUser, userNotifications).post(authenticateUser, markAllNotificationAsRead);
router
  .route("/:noticationId")
  .get(authenticateUser, notificationDetail)
  .post(authenticateUser, markANotificationAsRead);

export default router;
