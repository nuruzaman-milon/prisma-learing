import bcrypt from "bcrypt";

import AppError from "../../errors/AppError";
import { prisma } from "../../../prisma/prisma";

const registerUser = async (payload: {
  name?: string;
  email: string;
  password: string;
}) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (isUserExists) {
    throw new AppError(409, "Email already exists");
  }

  // Hash Password
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const result = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
    },
  });

  return result;
};

export const AuthService = {
  registerUser,
};
