import jwt from "jsonwebtoken";
import "dotenv/config";

export const generateToken = (uniqueID: any) => {
  const expiry = "10m";
  const secret_key = process.env.JWT_SECRET as any;
  return jwt.sign({ id: uniqueID }, secret_key, { expiresIn: expiry });
};

export const generateRefreshToken = (uniqueID: any) => {
  const expiry = "7d"; // Refresh token expiry time
  const secret_key = process.env.JWT_SECRET as any;
  return jwt.sign({ id: uniqueID }, secret_key, { expiresIn: expiry });
};
