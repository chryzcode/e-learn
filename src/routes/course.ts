import express from "express";
import {
  createCourse,
  allCourses,
  getAnInstructorCourses,
  instructorCourses,
  courseCategories,
} from "../controllers/course";
import authenticateUser from "../middleware/authentication";
import authenticateInstructor from "../middleware/instructor";

const router = express.Router();

router.route("/").post(authenticateUser, authenticateInstructor, createCourse).get(allCourses);
router.route("/instructor/:instructorId").get(getAnInstructorCourses);
router.route("/my-courses").get(authenticateUser, authenticateInstructor, instructorCourses)
router.route("/categories").get(courseCategories);

export default router;
