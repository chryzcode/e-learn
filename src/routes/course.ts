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
  editCourse,
  deleteCourse,
  likeCourse,
  createComment,
  courseComments,
  editComment,
  deleteComment,
  addCourseWishlist,
  getUserWishlist,
  courseStudents,
  studentCourses,
  removeCourseFromWishlist,
  unlikeCourse,
  getCourseLikes,
  searchCourses,
} from "../controllers/course";
import authenticateUser from "../middleware/authentication";
import authenticateInstructor from "../middleware/instructor";
import authenticateStudent from "../middleware/student";
import { multerUpload } from "../utils/cloudinaryConfig";

const router = express.Router();

router
  .route("/")
  .post(
    authenticateUser,
    authenticateInstructor,
    multerUpload.fields([
      { name: "video", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
    createCourse
  )
  .get(allCourses);
router.route("/instructor/:instructorId").get(getAnInstructorCourses);
router.route("/instructor/my-courses").get(authenticateUser, authenticateInstructor, instructorCourses);
router.route("/student/my-courses").get(authenticateUser, studentCourses);
router.route("/categories").get(courseCategories);
router.route("/categories/:categoryId").get(filterCourseByCategory);
router.route("/free").get(freeCourses);
router.route("/enroll/:courseId").post(authenticateUser, enrollForCourse);
router.route("/detail/:courseId").get(courseDetail);
router.route("/:courseId/students").get(courseStudents);
router
  .route("/edit/:courseId")
  .put(authenticateUser, authenticateInstructor, multerUpload.fields([{ name: "thumbnail", maxCount: 1 }]), editCourse);
router.route("/delete/:courseId").delete(authenticateUser, authenticateInstructor, deleteCourse);
router
  .route("/like/:courseId")
  .post(authenticateUser, authenticateStudent, likeCourse)
  .delete(authenticateUser, authenticateStudent, unlikeCourse)
  .get(getCourseLikes);
router.route("/comment/:courseId").post(authenticateUser, authenticateStudent, createComment).get(courseComments);
router
  .route("/:courseId/comment/:commentId")
  .put(authenticateUser, authenticateStudent, editComment)
  .delete(authenticateUser, authenticateStudent, deleteComment);
router
  .route("/:courseId/wishlist")
  .post(authenticateUser, addCourseWishlist)
  .delete(authenticateUser, removeCourseFromWishlist);
router.route("/wishlists").get(authenticateUser, getUserWishlist);
router.get("/search", searchCourses);

export default router;
