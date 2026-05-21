import type { Request, Response } from "express";

import catchAsync from "../../utils/catchAsync";

import { AuthService } from "./auth.service";
import AppError from "../../errors/AppError";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUserWithCredentials(req.body);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.loginUserWithCredentials(req.body);

  const { accessToken, refreshToken } = result;

  res.cookie("refreshToken", refreshToken, {
    secure: process.env.NODE_ENV === "production", // in production, set this to true
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    data: {
      accessToken,
    },
  });
});

const loginOrRegisterUserWithSocials = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AuthService.loginOrRegisterUserWithSocials(req.body);

    const { user, accessToken, refreshToken } = result;

    res.cookie("refreshToken", refreshToken, {
      secure: process.env.NODE_ENV === "production", // in production, set this to true
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: {
        user,
        accessToken,
      },
    });
  },
);

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    throw new AppError(401, "You are not authorized");
  }

  const result = await AuthService.refreshToken(token);

  res.status(200).json({
    success: true,
    message: "Access token generated successfully",
    data: result,
  });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    secure: process.env.NODE_ENV === "production", // in production, set this to true
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const token = req.query.token as string;

  await AuthService.verifyEmail(token);

  res.status(200).json({
    success: true,

    message: "Email verified successfully",
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  await AuthService.forgotPassword(req.body.email);

  res.status(200).json({
    success: true,

    message: "Password reset email sent",
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const { token, newPassword } = req.body;

  await AuthService.resetPassword(token, newPassword);

  res.status(200).json({
    success: true,

    message: "Password reset successful",
  });
});

const changePassword = catchAsync(async (req, res) => {
  const result = await AuthService.changePassword(
    req.user.userId,
    req.body.oldPassword,
    req.body.newPassword,
  );

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
    data: result,
  });
});

const sendOTP = catchAsync(async (req, res) => {
  const { email } = req.body;
  await AuthService.sendOTP(email);
  res.status(200).json({
    success: true,
    message: "OTP sent successfully",
  });
});

const verifyOTP = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  await AuthService.verifyOTP(email, otp);

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
  });
});

export const AuthController = {
  registerUser,
  loginUser,
  refreshToken,
  forgotPassword,
  logoutUser,
  loginOrRegisterUserWithSocials,
  verifyEmail,
  resetPassword,
  changePassword,
  sendOTP,
  verifyOTP,
};
