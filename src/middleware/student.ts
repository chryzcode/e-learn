import { courseStudent, Course } from "../models/course";
import { UnauthenticatedError, NotFoundError } from "../errors/index";

export default async (req: any, res: any, next: any) => {
  const { userId } = req.user;
  const { courseId } = req.params;
  const course = await Course.findOne({ _id: courseId });
  if (!course) {
    throw new NotFoundError(`Course with ${courseId} does not exist`);
  }
  const student: any = await courseStudent.findOne({ student: userId, course: courseId });
  if (student) {
    req.course = { courseId: course.id };
    next();
  } else {
    throw new UnauthenticatedError("Authentication as student is invalid");
  }
};
