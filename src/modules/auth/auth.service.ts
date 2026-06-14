import bcrypt from "bcryptjs";
import { pool } from "./../../db/index";

import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../../config";


const loginUserIntoDB = async (payload: {
  email: string;
  password: string;
}) => {
  const { email, password } = payload;

  // Check user
  const userData = await pool.query(
    `
    SELECT * FROM users
    WHERE email = $1
    `,
    [email]
  );

  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials!");
  }

  const user = userData.rows[0];

  // Compare password
  const matched = await bcrypt.compare(password, user.password);

  if (!matched) {
    throw new Error("Invalid Credentials!");
  }

  // JWT Payload
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
  };

  // Generate Token
  const token = jwt.sign(jwtPayload, config.secret as string, {
    expiresIn: "1d",
  });

  // Never return password
  delete user.password;

  return {
    token,
    user,
  };
};

const generateFreshToken = async (token: string) => {
  if (!token) {
    throw new Error("Unauthorized");
  }

  const decoded = jwt.verify(
    token,
    config.secret as string
  ) as JwtPayload;

  const userData = await pool.query(
    `
    SELECT *
    FROM users
    WHERE id = $1
    `,
    [decoded.id]
  );

  if (userData.rows.length === 0) {
    throw new Error("User not found!");
  }

  const user = userData.rows[0];

  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
  };

  const newToken = jwt.sign(jwtPayload, config.secret as string, {
    expiresIn: "1d",
  });

  return {
    token: newToken,
  };
};

export const authService = {
  loginUserIntoDB,
  generateFreshToken,
};