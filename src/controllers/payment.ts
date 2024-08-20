import { Payment } from "../models/payment";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";
import { StatusCodes } from "http-status-codes";
import { courseStudent, Course } from "../models/course";
import { transporter } from "../utils/transporter";
import { User } from "../models/user";
import { courseRoom } from "../models/chatRoom";


const FRONTEND_DOMAIN = process.env.FRONTEND_DOMAIN || "http://localhost:3000/";

export const paymentSuccessful = async (req: any, res: any) => {
  const { paymentId, courseId } = req.params;

  // Check if the payment has been made before updating
  const payment = await Payment.findOne({ _id: paymentId, course: courseId });
  if (!payment) {
    throw new NotFoundError(`Payment does not exist`);
  }
  if (payment.paid) {
    throw new BadRequestError(`Payment has been made already`);
  }

  // Update payment to mark as paid
  payment.paid = true;
  await payment.save();

  // Create a new courseStudent entry
  const studentCourseObj = await courseStudent.create({
    student: payment.student,
    course: payment.course,
  });

  const student = await User.findOne({ _id: studentCourseObj.student });
  const course = await Course.findOne({ _id: studentCourseObj.course });
  const instructor = await User.findOne({ _id: course?.instructor });
  const room = await courseRoom.findOne({ course: payment.course });

  if (!room) {
    throw new NotFoundError("Course room not found");
  }

  room.users.push(student?.id);
  await room.save();

  // Send an email notification to the instructor
  const maildata = {
    from: process.env.Email_User,
    to: instructor?.email,
    subject: `${student?.fullName} just paid for ${course?.title}`,
    html: `${student?.fullName} just paid ${course?.currency}${course?.price} for your course ${course?.title}`,
  };

  transporter.sendMail(maildata, (error, info) => {
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Mail not sent due to errors" });
    }
  });

  // Redirect to the course detail page
  res.redirect(`${FRONTEND_DOMAIN}/course/detail/${courseId}`);
};

export const paymentCancelled = async (req: any, res: any) => {
  const { paymentId, courseId } = req.params;
  const payment = await Payment.findOne({ _id: paymentId, course: courseId });
  if (!payment) {
    throw new NotFoundError(`Payment does not exist`);
  }
  res.status(StatusCodes.OK).json({ payment });
};