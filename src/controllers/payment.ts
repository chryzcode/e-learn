import { Payment } from "../models/payment";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";
import { StatusCodes } from "http-status-codes";
import { courseStudent, Course } from "../models/course";
import { sendEmail } from "../utils/transporter";
import { User } from "../models/user";
import { courseRoom } from "../models/chatRoom";


const FRONTEND_DOMAIN = process.env.FRONTEND_DOMAIN || "http://localhost:3000/";

export const paymentSuccessful = async (req: any, res: any) => {
  try {
    const { paymentId, courseId } = req.params;

    // Check if the payment has been made before updating
    const payment = await Payment.findOne({ _id: paymentId, course: courseId });
    if (!payment) {
      throw new NotFoundError("Payment does not exist");
    }
    if (payment.paid) {
      throw new BadRequestError("Payment has already been made");
    }

    // Mark payment as paid
    payment.paid = true;
    await payment.save();

    // Create a new courseStudent entry
    const studentCourseObj = await courseStudent.create({
      student: payment.student,
      course: payment.course,
    });

    // Fetch related data
    const student = await User.findById(studentCourseObj.student);
    const course = await Course.findById(studentCourseObj.course);
    const instructor = await User.findById(course?.instructor);
    const room = await courseRoom.findOne({ course: payment.course });

    if (!room) {
      throw new NotFoundError("Course room not found");
    }

    // Add student to the course room
    room.users.push(student?.id);
    await room.save();

    // Send email notification to instructor
    if (instructor) {
      const emailContent = `
        <p><strong>${student?.fullName}</strong> just paid <strong>${course?.currency}${course?.price}</strong> 
        for your course <strong>${course?.title}</strong>.</p>
      `;

      await sendEmail(instructor.email, `${student?.fullName} just paid for ${course?.title}`, emailContent);
    }

    // Redirect to the course detail page
    res.redirect(`${FRONTEND_DOMAIN}/course/detail/${courseId}`);
  } catch (error: any) {
    console.error("Payment error:", error.message);
    res.status(400).json({ msg: error.message });
  }
};

export const paymentCancelled = async (req: any, res: any) => {
  const { paymentId, courseId } = req.params;
  const payment = await Payment.findOne({ _id: paymentId, course: courseId });
  if (!payment) {
    throw new NotFoundError(`Payment does not exist`);
  }
  res.status(StatusCodes.OK).json({ payment });
};