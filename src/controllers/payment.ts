import "dotenv/config";
import { Payment } from "../models/payment";
import { Course } from "../models/course";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";
import stripePackage from "stripe";
import { StatusCodes } from "http-status-codes";

let STRIPE_SECRET_KEY: any = process.env.STRIPE_SECRET_KEY;
const stripe = new stripePackage(STRIPE_SECRET_KEY);
const DOMAIN = process.env.DOMAIN;

export const makeCoursePayment = async (req: any, res: any) => {
  const { userId } = req.user;
  const { courseId } = req.params;
  const course = await Course.findOne({ _id: courseId });
  if (!course) {
    throw new NotFoundError(`Course with id ${courseId} does not exist`);
  }
  req.body.student = userId;
  req.body.course = courseId;
  req.body.amount = course.price;
  var payment = await Payment.create({ ...req.body });
  const successUrl = `${DOMAIN}/payment/${payment.id}/success`;
  const cancelUrl = `${DOMAIN}/payment/${payment.id}/cancel`;
  try {
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
    res.status(StatusCodes.OK).json({ success: session.url });
  } catch (error) {
    console.error("Error creating payment link:", error);
    res.status(StatusCodes.BAD_REQUEST).json({ error: "payment link not created" });
  }
};
