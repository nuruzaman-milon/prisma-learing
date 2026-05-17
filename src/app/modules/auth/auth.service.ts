import bcrypt from "bcrypt";
import jwt, { type JwtPayload } from "jsonwebtoken";

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

  console.log("hashed password", hashedPassword);

  const result = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
    },
  });

  console.log("result for register", result);

  return result;
};

const loginUser = async (payload: { email: string; password: string }) => {
  const { email, password } = payload;
  const authSecret = process.env.JWT_ACCESS_SECRET || "my_super_key";
  const refreshAuthSecret = process.env.JWT_REFRESH_SECRET || "my_super_key";
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

  const isUserExists = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!isUserExists) {
    throw new AppError(404, "User not found!");
  }

  //compare password
  const isPasswordMatched = await bcrypt.compare(
    password,
    isUserExists.password,
  );

  if (!isPasswordMatched) {
    throw new AppError(401, "Invalid credentials!");
  }

  const jwtPayload = {
    userId: isUserExists.id,
    email: isUserExists.email,
    role: isUserExists.role,
  };

  // generate JWT token
  const accessToken = jwt.sign(jwtPayload, authSecret, { expiresIn });

  //generate refresh token
  const refreshToken = jwt.sign(jwtPayload, refreshAuthSecret, {
    expiresIn: refreshExpiresIn,
  });

  return {
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (token: string) => {
  // Verify Refresh Token
  const verifiedToken = jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET as string,
  ) as JwtPayload;

  // Find User
  const isUserExists = await prisma.user.findUnique({
    where: {
      email: verifiedToken.email,
    },
  });

  if (!isUserExists) {
    throw new AppError(404, "User not found");
  }

  // Generate New Access Token
  const jwtPayload = {
    userId: isUserExists.id,
    email: isUserExists.email,
    role: isUserExists.role,
  };

  const accessToken = jwt.sign(
    jwtPayload,
    process.env.JWT_ACCESS_SECRET as string,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    },
  );

  return {
    accessToken,
  };
};

export const AuthService = {
  registerUser,
  loginUser,
  refreshToken,
};
