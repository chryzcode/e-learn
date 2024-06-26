import { User } from "../models/user";
import { UnauthenticatedError } from "../errors/index";

export default async (req: any, res: any, next: any) => {
  const { userId } = req.user;
  const user: any = await User.findOne({ _id: userId, userType: "Instructor" });
  if (user) {
    req.user = { userId: user.id, fullName: user.fullName };
    next();
  } else {
    throw new UnauthenticatedError("Authentication as an instructor invalid");
  }
};
