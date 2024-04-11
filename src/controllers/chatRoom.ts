import cloudinary from "cloudinary";
import { StatusCodes } from "http-status-codes";
import { courseRoom } from "../models/chatRoom";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";
import { isImage } from "../utils/mediaType";
import express from "express";
import http from "http";
import { init as initSocket } from "../utils/socket";

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

export const userRooms = async (req: any, res: any) => {
  const { userId } = req.user;
  const rooms = courseRoom.find({ user: userId });
  res.status(StatusCodes.OK).json({ rooms });
};
