import cloudinary from "cloudinary";
import { StatusCodes } from "http-status-codes";
import { courseRoom, roomMessage } from "../models/chatRoom";
import { courseStudent } from "../models/course";
import { User } from "../models/user";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";
import { isImage } from "../utils/mediaType";
import { io } from "../utils/socket";

export const userRooms = async (req: any, res: any) => {
  const { userId } = req.user;
  const rooms = await courseRoom.find({ users: userId });
  res.status(StatusCodes.OK).json({ rooms });
};

export const roomMessages = async (req: any, res: any) => {
  const { userId } = req.user;
  const { roomId } = req.params;
  const room = await courseRoom.findOne({ _id: roomId, users: userId });
  if (!room) {
    throw new NotFoundError(`Room does not exist`);
  }
  const messages = await roomMessage.find({ room: roomId }).sort("createdAt");
  io.to(roomId).emit("roomMessages", messages);
  res.status(StatusCodes.OK).json({ messages });
};

export const sendMessage = async (req: any, res: any) => {
  const { roomId } = req.params;
  const { userId } = req.user;
  req.body.room = roomId;
  req.body.sender = userId;
  if (req.body.media) {
    if (isImage(req.body.media) == false) {
      throw new BadRequestError("Image/ Media type not supported");
    }
    try {
      const result = await cloudinary.v2.uploader.upload(req.body.media, {
        folder: "E-Learn/Message/Image/",
        use_filename: true,
      });
      req.body.media = result.url;
    } catch (error) {
      console.error(error);
      throw new BadRequestError("error uploading video on cloudinary");
    }
  }
  const room = await courseRoom.findOne({ _id: roomId, users: userId });
  if (!room) {
    throw new NotFoundError(`Room does not exist`);
  }
  const message = await roomMessage.create({ ...req.body });
  io.to(room?.id).emit("message", message);
  res.status(StatusCodes.OK).json({ message });
};

export const editMessage = async (req: any, res: any) => {
  const { messageId, roomId } = req.params;
  const { userId } = req.user;
  var message = await roomMessage.findOne({ _id: messageId, room: roomId, sender: userId });
  if (!message) {
    throw new NotFoundError(`Message not found`);
  }
  if (req.body.media) {
    if (!message.media) {
      throw new BadRequestError(`you can add media to a message that does not initially have`);
    }
    if (isImage(req.body.media) == false) {
      throw new BadRequestError("Image/ Media type not supported");
    }
    try {
      const result = await cloudinary.v2.uploader.upload(req.body.media, {
        folder: "E-Learn/Message/Image/",
        use_filename: true,
      });
      req.body.media = result.url;
    } catch (error) {
      console.error(error);
      throw new BadRequestError("error uploading video on cloudinary");
    }
  }
  message = await roomMessage.findOneAndUpdate({ _id: messageId, room: roomId, sender: userId }, req.body, {
    new: true,
    runValidators: true,
  });

  io.to(roomId).emit("message", message);
  res.status(StatusCodes.OK).json({ message });
};

export const deleteMessage = async (req: any, res: any) => {
  const { messageId, roomId } = req.params;
  const { userId } = req.user;
  const message = await roomMessage.findOneAndDelete({ _id: messageId, room: roomId, sender: userId });
  if (!message) {
    throw new NotFoundError(`Message not found`);
  }
  io.to(roomId).emit("message", message);
  res.status(StatusCodes.OK).json({ success: "Message deleted successfully" });
};

export const leaveRoom = async (req: any, res: any) => {
  const { roomId } = req.params;
  const { userId } = req.user;
  const user = await User.findOne({ _id: userId });
  const room = await courseRoom.findOneAndUpdate({ _id: roomId }, { $pull: { users: userId } }, { new: true });
  if (!room) {
    throw new NotFoundError(`Room does not exist`);
  }
  io.to(room?.id).emit("message", `${user?.fullName} has left the chat`);
  res.status(StatusCodes.OK).json({ success: "you have successfully left the room" });
};

export const inviteUserToRoom = async (req: any, res: any) => {
  const { roomId, userId } = req.params;
  const room = await courseRoom.findOne({ _id: roomId });
  const isStudent = await courseStudent.findOne({ course: room?.course, student: userId });
  if (!room) {
    throw new NotFoundError(`Room does not exist`);
  }
  if (!isStudent) {
    throw new BadRequestError(`You can not add a user who has not registered for the course`);
  }
  if (room.users.includes(userId)) {
    throw new BadRequestError(`User is already in the room`);
  }
  await courseRoom.findOneAndUpdate({ _id: roomId }, { $push: { users: userId } }, { new: true });
  res.status(StatusCodes.OK).json({ success: "you have successfully joined the room" });
};

export const removeUser = async (req: any, res: any) => {
  const { roomId, userId } = req.params;
  const room = await courseRoom.findOneAndUpdate(
    { _id: roomId, users: userId },
    { $pull: { users: userId } },
    { new: true }
  );
  if (!room) {
    throw new NotFoundError(`Room does not exist`);
  }
  res.status(StatusCodes.OK).json({ success: `${userId} has been successfully sent off the room` });
};
