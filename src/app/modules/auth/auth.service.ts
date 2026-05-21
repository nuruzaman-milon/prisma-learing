import bcrypt from "bcrypt";
import jwt, { type JwtPayload } from "jsonwebtoken";

import AppError from "../../errors/AppError";
import { prisma } from "../../../prisma/prisma";
import type { AuthProvider } from "../../../../generated/prisma/enums";
import { generateUserTokens } from "../../utils/generateUsersTokens";
import sendEmail from "../../utils/sendEmail";
import redisClient from "../../config/redis.config";

const registerUserWithCredentials = async (payload: {
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
      name: payload.name || "",
      email: payload.email,
      password: hashedPassword,
      authProvider: "CREDENTIALS",
      profile: {
        create: {},
      },
    },
    include: {
      profile: true,
    },
  });

  console.log(
    "process.env.JWT_VERIFY_SECRET in register",
    process.env.JWT_VERIFY_SECRET,
  );

  const verificationToken = jwt.sign(
    {
      email: result.email,
    },

    process.env.JWT_VERIFY_SECRET as string,

    {
      expiresIn: "1d",
    },
  );

  const verificationLink = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}`;

  await sendEmail(
    result.email,

    "Verify Your Email",

    `
    <h1>Email Verification</h1>

    <p>
      Click below to verify your account
    </p>

    <a href="${verificationLink}">
      Verify Account
    </a>
  `,
  );

  return result;
};

const verifyEmail = async (token: string) => {
  const decoded = jwt.verify(
    token,
    process.env.JWT_VERIFY_SECRET as string,
  ) as JwtPayload;

  console.log(
    "process.env.JWT_VERIFY_SECRET in verify",
    process.env.JWT_VERIFY_SECRET,
  );

  const user = await prisma.user.findUnique({
    where: {
      email: decoded.email,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  await prisma.user.update({
    where: {
      email: user.email,
    },

    data: {
      isVerified: true,
    },
  });
};

const loginUserWithCredentials = async (payload: {
  email: string;
  password: string;
}) => {
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

  if (!isUserExists.isVerified) {
    throw new AppError(401, "Please verify your email");
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

const loginOrRegisterUserWithSocials = async (payload: {
  name?: string;
  email: string;
  authProvider: AuthProvider;
  providerId: string;
}) => {
  let user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  // Create user if not exists
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: payload.name || null,

        email: payload.email,

        authProvider: payload.authProvider,

        providerId: payload.providerId,

        profile: {
          create: {},
        },
      },

      include: {
        profile: true,
      },
    });
  }

  // Generate tokens
  const tokens = generateUserTokens(user);

  return {
    user,
    ...tokens,
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

const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  // Generate reset token
  const resetToken = jwt.sign(
    {
      email: user.email,
    },
    process.env.JWT_RESET_PASSWORD_SECRET as string,
    {
      expiresIn: "15m",
    },
  );

  // Reset link
  const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

  // Send email
  await sendEmail(
    user.email,
    "Reset Your Password",
    `
      <h1>Reset Password</h1>

      <a href="${resetLink}">
        Reset Password
      </a>
    `,
  );
};

const resetPassword = async (
  token: string,

  newPassword: string,
) => {
  // Verify token
  const decoded = jwt.verify(
    token,
    process.env.JWT_RESET_PASSWORD_SECRET as string,
  ) as JwtPayload;

  // Find user
  const user = await prisma.user.findUnique({
    where: {
      email: decoded.email,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.user.update({
    where: {
      email: user.email,
    },

    data: {
      password: hashedPassword,
    },
  });
};

const changePassword = async (
  userId: number,
  oldPassword: string,
  newPassword: string,
) => {
  // Find user
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  /**
   * CASE 1:
   * Credentials user
   * ----------------
   * password exists
   * must verify old password
   */
  if (user.password) {
    const isOldPasswordMatched = await bcrypt.compare(
      oldPassword,
      user.password,
    );

    if (!isOldPasswordMatched) {
      throw new AppError(401, "Old password is incorrect");
    }
  }

  /**
   * CASE 2:
   * Social login user
   * ------------------
   * password doesn't exist
   * skip old password verification
   */

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.user.update({
    where: {
      id: user.id,
    },

    data: {
      password: hashedPassword,
      // Optional:
      // convert hybrid account support
      authProvider: "CREDENTIALS",
    },
  });
  return null;
};

const sendOTP = async (email: string) => {
  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP in Redis
  await redisClient.set(
    `otp:${email}`,

    otp,

    {
      EX: 300,
    },
  );

  // Send email
  await sendEmail(
    email,
    "Your OTP Code",
    `
      <h1>${otp}</h1>

      <p>
        OTP valid for 5 minutes
      </p>
    `,
  );
  console.log("Generated OTP:", otp);
};

const verifyOTP = async (
  email: string,

  otp: string,
) => {
  // Get OTP from Redis
  const storedOTP = await redisClient.get(`otp:${email}`);

  // OTP expired or missing
  if (!storedOTP) {
    throw new AppError(400, "OTP expired");
  }

  // OTP mismatch
  if (storedOTP !== otp) {
    throw new AppError(401, "Invalid OTP");
  }

  // Delete OTP after success
  await redisClient.del(`otp:${email}`);
};

export const AuthService = {
  registerUserWithCredentials,
  loginUserWithCredentials,
  refreshToken,
  loginOrRegisterUserWithSocials,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  sendOTP,
  verifyOTP,
};
