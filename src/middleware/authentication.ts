import jwt from "jsonwebtoken";
import { UnauthenticatedError } from "../errors/index";
import { User } from "../models/user";

export default async (req: any, res: Response, next: any) => {
  // check header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnauthenticatedError("Authentication invalid");
  }
  const token = authHeader.split(" ")[1];
  const user = await User.findOne({ token: token, verified: true });
  if (user) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      // attach the user to the job routes
      req.user = { userId: payload.userId, firstName: payload.firstName };

      next();
    } catch (error) {
      throw new UnauthenticatedError("Authentication invalid");
    }
  } else {
    throw new UnauthenticatedError("Authentication invalid");
  }
};
