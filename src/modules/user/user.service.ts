import bcrypt from "bcryptjs";
import { pool } from "../../db";
import type { IUser } from "./user.interface";

// Create User
const createUserIntoDB = async (payload: IUser) => {
  const { name, email, password, role } = payload;

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `
    INSERT INTO users
    (name, email, password, role)
    VALUES
    ($1, $2, $3, COALESCE($4, 'contributor'))
    RETURNING id, name, email, role, created_at, updated_at
    `,
    [name, email, hashedPassword, role]
  );

  return result.rows[0];
};

export const userService = {
  createUserIntoDB,
  
};