import "dotenv/config";
import { Booking } from "../models/payment";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";
import stripePackage from "stripe";
import { StatusCodes } from "http-status-codes";

let STRIPE_SECRET_KEY: any = process.env.STRIPE_SECRET_KEY;
const stripe = new stripePackage(STRIPE_SECRET_KEY);
const DOMAIN = process.env.DOMAIN;

export const createBooking = async (req, res) => {
  const { userId } = req.user;
  const user = await User.findOne({ _id: userId });
  const { listingId } = req.params;
  req.body.user = user.id;
  const arrival = new Date(req.body.arrival);
  const days = req.body.numberOfNights;
  var departure = new Date(arrival);
  departure = departure.setDate(arrival.getDate() + days);
  req.body.departure = departure;
  const currentDate = new Date();

  var listing =
    (await Car.findOne({ _id: listingId })) ||
    (await House.findOne({ _id: listingId })) ||
    (await Yatch.findOne({ _id: listingId }));

  if (!listing || listing.booked == true) {
    throw new NotFoundError(
      `Listing (either house, car or yatch with ${listingId} does not exist) or it has been booked`
    );
  }

  if (currentDate < listing.dateAvailable) {
    throw new BadRequestError(`Listing is not available for booking`);
  }
  const serviceFee = listing.serviceFee || 0;
  const cleaningFee = listing.cleaningFee || 0;
  const taxAmount = listing.tax || 0;
  const amount = Number(listing.price * days) + serviceFee + cleaningFee;
  req.body.amount = amount;
  req.body.listingId = listing.id;
  var booking = await Booking.create({ ...req.body });
  const successUrl = `${DOMAIN}/payment/${booking.id}/success`;
  const cancelUrl = `${DOMAIN}/payment/${booking.id}/cancel`;
  const guestChargeAmount = (amount * 7) / 100;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // Payment method types accepted (e.g., card)
      line_items: [
        {
          price_data: {
            currency: listing.currency,
            product_data: {
              name: `Travel Leaf Booking Listing`, // Name of your product or service
            },
            unit_amount: (amount + taxAmount + guestChargeAmount) * 100, // Amount in cents
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
  // await listing.findOneAndUpdate({ dateAvailable: departure, booked: true });
};
