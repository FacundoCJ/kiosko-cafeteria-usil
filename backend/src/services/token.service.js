import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "kiosko_usil_dev_secret";

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    {
      expiresIn: "8h"
    }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};