import type { Request, Response } from "express";
import { UserService } from "./user.service";
import catchAsync from "../../utils/catchAsync";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createUser(req.body);

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllUsers(req.query);

  res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    data: result,
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.getSingleUser(Number(id));

  res.status(200).json({
    success: true,
    message: "User fetched successfully",
    data: result,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const result = await UserService.updateUser(id, req.body);

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const result = await UserService.deleteUser(id);

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const result = req.user;
  res.status(200).json({
    success: true,
    message: "User fetched successfully",
    data: result,
  });
});

const updateProfile = async (req: Request, res: Response) => {
  console.log(req.files);

  console.log(req.body);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
  });
};

export const UserController = {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  getMe,
  updateProfile,
};

// notes
// Controller Responsibility

// Controllers handle:

// req
// res
// status codes
// response formatting

// NOT business logic.
