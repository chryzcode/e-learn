import express from "express";
import {
  createCourse,
  allCourses,
  getAnInstructorCourses,
  instructorCourses,
  courseCategories,
  filterCourseByCategory,
  freeCourses,
  enrollForCourse,
  courseDetail,
} from "../controllers/course";
import authenticateUser from "../middleware/authentication";
import authenticateInstructor from "../middleware/instructor";
import authenticateStudent from "../middleware/student";

const router = express.Router();

router.route("/").post(authenticateUser, authenticateInstructor, createCourse).get(allCourses);
router.route("/instructor/:instructorId").get(getAnInstructorCourses);
router.route("/my-courses").get(authenticateUser, authenticateInstructor, instructorCourses);
router.route("/categories").get(courseCategories);
router.route("/categories/:categoryId").get(filterCourseByCategory);
router.route("/free").get(freeCourses);
router.route("/enroll/:courseId").post(authenticateUser, enrollForCourse);
router.route("/detail/:courseId").get(authenticateUser, courseDetail);

export default router;
