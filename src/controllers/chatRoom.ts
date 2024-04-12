import cloudinary from "cloudinary";
import { StatusCodes } from "http-status-codes";
import { courseRoom, roomMessage } from "../models/chatRoom";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";
import { isImage } from "../utils/mediaType";
import express from "express";
import http from "http";
import { init as initSocket, emitroomMessages } from "../utils/socket";

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

export const userRooms = async (req: any, res: any) => {
  const { userId } = req.user;
  const rooms = await courseRoom.find({ users: userId });
  res.status(StatusCodes.OK).json({ rooms });
};

export const roomMessages = async (req: any, res: any) => {
  const { userId } = req.user;
  const { courseId } = req.course;
  const room = await courseRoom.findOne({ course: courseId, users: userId });
  if (!room) {
    throw new NotFoundError(`Room does not exists`);
  }
  const messages = await roomMessage.find({ room: room.id }).sort("createdAt");
  emitroomMessages(room.id, messages);
  res.status(StatusCodes.OK).json({ messages });
};

// export const sendMessage = async (req: any, res: any) => {
//   const { roomId } = req.params
//   const { userId } = req.user;
//   const room = await courseRoom.findOne(filter, projection, options);

// }
