import { Payment } from "../models/payment";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";
import { StatusCodes } from "http-status-codes";
import { courseStudent, Course } from "../models/course";
import { transporter } from "../utils/transporter";
import { User } from "../models/user";

export const paymentSuccessful = async (req: any, res: any) => {
  const { paymentId } = req.params;
  const payment = await Payment.findOneAndUpdate(
    { _id: paymentId },
    { paid: true },
    { new: true, runValidators: true }
  );
  if (!payment) {
    throw new NotFoundError(`Payment with id ${paymentId} does not exists`);
  }
  const studentCourseObj = await courseStudent.create({
    student: payment.student,
    course: payment.course,
  });
  const student = await User.findOne({ _id: studentCourseObj.student });
  const course = await Course.findOne({ _id: studentCourseObj.course });
  const instructor = await User.findOne({ _id: course?.instructor });
  const maildata = {
    from: process.env.Email_User,
    to: instructor?.email,
    subject: `${student?.fullName} just paid for ${course?.title}`,
    html: `for verification. Link expires in 30 mins.</p>`,
  };
  transporter.sendMail(maildata, (error, info) => {
    if (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: "Mail not sent due to errors" });
    }
  });

  res.status(StatusCodes.OK).json({ payment });
};

export const paymentCancelled = async (req: any, res: any) => {
  const { paymentId } = req.params;
  const payment = await Payment.findOne({ _id: paymentId });
  if (!payment) {
    throw new NotFoundError(`Payment with id ${paymentId} does not exists`);
  }
  res.status(StatusCodes.OK).json({ error: "payment was not successful" });
};
