import { User } from "../models/user";
import { UnauthenticatedError } from "../errors/index";

export default async (req: any, res: any, next: any) => {
  const { userId } = req.user;
  const user: any = User.findOne({ _id: userId, userType: "Instructor" });
  console.log(user.userType);
  if (!user) {
    req.user = { userId: user.userId, fullName: user.fullName };
    next();
  } else {
    throw new UnauthenticatedError("Authentication as an instructor invalid");
  }
};
