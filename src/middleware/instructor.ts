import { User } from "../models/user";
import { UnauthenticatedError } from "../errors/index";

export default async (req: any, res: any, next: any) => {
  const { userId } = req.user;
  const user: any = User.findOne({ _id: userId, userType: "Instructor" });
  if (!user) {
    throw new UnauthenticatedError("Authentication as an instructor invalid");
  }
  req.user = { userId: user.userId, fullName: user.fullName };
  next();
};
