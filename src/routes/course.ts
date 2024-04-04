import express from "express";
import { createCourse, allCourses } from "../controllers/course";
import authenticateUser from "../middleware/authentication";
import authenticateInstructor from "../middleware/instructor";

const router = express.Router();

router.route("/").post(authenticateUser, authenticateInstructor, createCourse).get(allCourses);


export default router