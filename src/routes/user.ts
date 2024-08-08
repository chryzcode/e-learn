import express from "express";
import {
  signIn,
  signUp,
  getUser,
  updateUser,
  deleteUser,
  logout,
  sendForgotPasswordLink,
  verifyForgotPasswordToken,
  verifyAccount,
  currentUser,
} from "../controllers/user";

import authenticateUser from "../middleware/authentication";
import { multerUpload } from "../utils/cloudinaryConfig";

const router = express.Router();

router.route("/auth/signup").post(signUp);
router.route("/auth/signin").post(signIn);
router.route("/profile/:userId").get(getUser);
router.route("/current-user").get(authenticateUser, currentUser);
router.route("/auth/logout").post(authenticateUser, logout);
router.route("/update").put(authenticateUser, multerUpload.single("avatar"), updateUser);
router.route("/delete").delete(authenticateUser, deleteUser);
router.route("/send-forgot-password-link").post(sendForgotPasswordLink);
router.route("/auth/forgot-password/:userId/:token").post(verifyForgotPasswordToken);
router.route("/auth/verify-account/:userId/:token").post(verifyAccount);

export default router;
