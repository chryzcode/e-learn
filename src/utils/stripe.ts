import "dotenv/config";
import { Payment } from "../models/payment";
import { Course, courseStudent } from "../models/course";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";
import stripePackage from "stripe";

let STRIPE_SECRET_KEY: any = process.env.STRIPE_SECRET_KEY;
const stripe = new stripePackage(STRIPE_SECRET_KEY);
const DOMAIN = process.env.DOMAIN || "http://localhost:8000/";

export const makeCoursePayment = async (userId: any, courseId: any) => {
  const course = await Course.findOne({ _id: courseId });
  if (!course) {
    throw new NotFoundError(`Course with id ${courseId} does not exist`);
  }

  var payment = await Payment.create({
    student: userId,
    course: courseId,
    amount: course.price,
  });
  const successUrl = `${DOMAIN}payment/${payment.id}/success`;
  const cancelUrl = `${DOMAIN}payment/${payment.id}/cancel`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"], // Payment method types accepted (e.g., card)
    line_items: [
      {
        price_data: {
          currency: course.currency,
          product_data: {
            name: `${course.title} payment`, // Name of your product or service
          },
          unit_amount: course.price * 100, // Amount in cents
        },
        quantity: 1, // Quantity of the product
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  return session.url;
};
