import { Notification } from "../models/notification";
import { StatusCodes } from "http-status-codes";
import { User } from "../models/user";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";

export const userNotifications = async (req: any, res: any) => {
  const { userId } = req.user;
  const notifications = Notification.find({ to: userId });
  res.status(StatusCodes.OK).json({ notifications });
};


