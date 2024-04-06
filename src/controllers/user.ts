import "dotenv/config";
import { User } from "../models/user";
import { transporter } from "../utils/transporter";
import { generateToken } from "../utils/generateToken";
import { v4 as uuidv4 } from "uuid";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError, NotFoundError } from "../errors/index";
import jwt from "jsonwebtoken";
import cloudinary from "cloudinary";
import bcrypt from "bcryptjs";

const uniqueID = uuidv4();
const domain = process.env.DOMAIN || "http://localhost:8000/";

const linkVerificationtoken = generateToken(uniqueID);

export const signUp = async (req: any, res: any) => {
  const user: any = await User.create({ ...req.body });

  const maildata = {
    from: process.env.Email_User,
    to: user.email,
    subject: `${user.fullName} verify your account`,
    html: `<p>Please use the following <a href="${domain}auth/verify-account/?userId=${
      user.id
    }/?token=${encodeURIComponent(
      linkVerificationtoken
    )}">link</a> to verify your account. Link expires in 10 mins.</p>`,
  };
  transporter.sendMail(maildata, (error, info) => {
    if (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: "Mail not sent due to errors" });
    }
    res.status(StatusCodes.OK).send();
  });
  const token = user.createJWT();

  res.status(StatusCodes.CREATED).json({
    user: { fullName: user.fullName },
    token,
    msg: "check your mail for account verification",
  });
};

export const signIn = async (req: any, res: any) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new BadRequestError(`email and password field is required`);
  }
  const user: any = await User.findOne({ email: email });
  if (!user) {
    throw new NotFoundError(`User with email not found`);
  }

  const passwordMatch = await user.comparePassword(password);
  if (!passwordMatch) {
    throw new UnauthenticatedError("Invalid password");
  }
  if (user.verified == false) {
    const maildata = {
      from: process.env.Email_User,
      to: user.email,
      subject: `${user.fullName} verify your account`,
      html: `<p>Please use the following <a href="${domain}auth/verify-account/?userId=${
        user.id
      }/?token=${encodeURIComponent(
        linkVerificationtoken
      )}">link</a> to verify your account. Link expires in 10 mins.</p>`,
    };
    transporter.sendMail(maildata, (error, info) => {
      if (error) {
        console.log(error);
        res.status(StatusCodes.BAD_REQUEST).json({ error: "Mail not sent due to errors" });
      }
      console.log(info);
      res.status(StatusCodes.OK).send();
    });
    throw new UnauthenticatedError("Account is not verified, kindly check your mail for verfication");
  }
  var token = user.createJWT();
  await User.findOneAndUpdate({ token: token });
  token = user.token;
  res.status(StatusCodes.OK).json({ user: { fullName: user.fullName }, token });
};

export const logout = async (req: any, res: any) => {
  const { userId } = req.user;
  req.body.token = "";
  await User.findOneAndUpdate({ _id: userId }, req.body);
  res.status(StatusCodes.OK).json({ success: "User has been logged out successsfully" });
};

export const verifyAccount = async (req: any, res: any) => {
  const token = req.params.token;
  const userId = req.params.userId;
  const secretKey: any = process.env.JWT_SECRET;
  try {
    jwt.verify(token, secretKey);
    await User.findOneAndUpdate({ _id: userId }, { verified: true }, { new: true, runValidators: true });
    res.status(StatusCodes.OK).json({ success: "User has been verified successfully" });
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid or expired token" });
  }
};

export const currentUser = async (req: any, res: any) => {
  const { userId } = req.user;
  const user = await User.findOne({ _id: userId });
  if (!user) {
    throw new UnauthenticatedError("No account is currently logged in or User does not exist");
  }
  res.status(StatusCodes.OK).json({ user });
};

export const getUser = async (req: any, res: any) => {
  const { userId } = req.params;
  const user = await User.findOne({ _id: userId });
  if (!user) {
    throw new NotFoundError(`User with id ${userId} does not exist`);
  }
  res.status(StatusCodes.OK).json({ user });
};

export const updateUser = async (req: any, res: any) => {
  const { userId } = req.user;
  var user = await User.findOne({ _id: userId });
  if (!user) {
    throw new NotFoundError(`User with id ${userId} does not exist`);
  }

  if (req.body.avatar) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "E-Learn/User/Avatar/",
        use_filename: true,
      });
      req.body.avatar = result.url;
    } catch (error) {
      console.error(error);
      throw new BadRequestError("error uploading image on cloudinary");
    }
  }

  user = await User.findOneAndUpdate({ _id: userId }, req.body, { new: true, runValidators: true });

  res.status(StatusCodes.OK).json({ user });
};

export const deleteUser = async (req: any, res: any) => {
  const { userId } = req.user;
  const user = await User.findOneAndUpdate({ _id: userId }, { verified: false }, { new: true, runValidators: true });
  if (!user) {
    throw new NotFoundError(`User with id ${userId} does not exist`);
  }
  res.status(StatusCodes.OK).json({ success: "Your account has been disabled" });
};

export const sendForgotPasswordLink = async (req: any, res: any) => {
  const { email } = req.body;
  if (!email) {
    throw new BadRequestError("Email field is required");
  }
  const user = await User.findOne({ email: email });
  if (!user) {
    throw new NotFoundError("User does not exists");
  }
  const maildata = {
    from: process.env.Email_User,
    to: user.email,
    subject: `${user.fullName} you forgot your password`,
    html: `<p>Please use the following <a href="${domain}verify/forgot-password/?userId=${
      user.id
    }/?token=${encodeURIComponent(linkVerificationtoken)}">link</a> for verification. Link expires in 30 mins.</p>`,
  };
  transporter.sendMail(maildata, (error, info) => {
    if (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: "Mail not sent due to errors" });
    }
    res.status(StatusCodes.OK).json({ success: "Check you email to change your password" });
  });
};

export const verifyForgotPasswordToken = async (req: any, res: any) => {
  const token = req.params.token;
  const userId = req.params.userId;
  const secretKey: any = process.env.JWT_SECRET;
  let { password } = req.body;
  try {
    jwt.verify(token, secretKey);
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    const user = await User.findOneAndUpdate(
      { _id: userId },
      { password: password, token: token },
      { runValidators: true, new: true }
    );

    res.status(StatusCodes.OK).json({ user });
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid or expired token" });
  }
};
