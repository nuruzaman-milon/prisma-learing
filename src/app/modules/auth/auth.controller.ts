import type { Request, Response } from "express";

import catchAsync from "../../utils/catchAsync";

import { AuthService } from "./auth.service";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: result,
  });
});

export const AuthController = {
  registerUser,
};
