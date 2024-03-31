import jwt from "jsonwebtoken";

export const generateToken = (uniqueID: any) => {
  const expiry = "10m";
  const secret_key = process.env.JWT_SECRET as any;
  return jwt.sign({ id: uniqueID }, secret_key, { expiresIn: expiry });
};
