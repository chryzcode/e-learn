import express from "express";
import { userNotifications } from "../controllers/notification";
import authenticateUser from "../middleware/authentication";

const router = express.Router();

router.route("/").get(authenticateUser, userNotifications);
