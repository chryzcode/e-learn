import { Payment } from "../models/payment";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";
import { StatusCodes } from "http-status-codes";
import { courseStudent } from "../models/course";

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
  await courseStudent.create({
    student: payment.student,
    course: payment.course,
  });
  res.status(StatusCodes.OK).json({ payment });
};
