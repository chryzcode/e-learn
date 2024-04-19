import { Notification } from "../models/notification";
import { StatusCodes } from "http-status-codes";
import { User } from "../models/user";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";

export const userNotifications = async (req: any, res: any) => {
  const { userId } = req.user;
  const notifications = await Notification.find({ to: userId });
  res.status(StatusCodes.OK).json({ notifications });
};

export const markAllNotificationAsRead = async (req: any, res: any) => {
  const { userId } = req.user;
  const notifications = await Notification.updateMany({ to: userId }, { read: true });
  res.status(StatusCodes.OK).json({ notifications });
};

export const maekANotificationAsReadasync = async (req: any, res: any) => {
  const { userId } = req.user;
  const { notificationId } = req.params;
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, to: userId },
    { read: true },
    { new: true }
  );
  if (!notification) {
    throw new NotFoundError(`Notification does not exists`);
  }
  res.status(StatusCodes.OK).json({ notification });
};
