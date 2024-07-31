import jwt from "jsonwebtoken";
import { UnauthenticatedError } from "../errors/index";
import { User } from "../models/user";

const JWT_SECRET = process.env.JWT_SECRET as any;

export default async (req: any, res: any, next: any) => {
  // check header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnauthenticatedError("Authentication invalid");
  }
  const token = authHeader.split(" ")[1];

  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    // attach the user to the job routes
    const user = await User.findOne({ _id: payload.userId, verified: true });
    if (!user) {
      throw new UnauthenticatedError("Authentication invalid");
    }

    req.user = { userId: payload.userId, fullName: payload.fullName };

    next();
  } catch (error) {
    throw new UnauthenticatedError("Authentication invalid");
  }
};
