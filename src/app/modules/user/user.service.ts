import type { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "../../../prisma/prisma";
import AppError from "../../errors/AppError";

const createUser = async (payload: { name?: string; email: string }) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (isUserExists) {
    throw new AppError(409, "Email already exists");
  }
  const result = await prisma.user.create({
    data: payload,
  });

  return result;
};

const getAllUsers = async (query: Record<string, unknown>) => {
  const searchTerm = query.searchTerm as string;

  const page = Number(query.page) || 1;

  const limit = Number(query.limit) || 5;

  const skip = (page - 1) * limit;

  const whereConditions: Prisma.UserWhereInput = searchTerm
    ? {
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },

          {
            email: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        ],
      }
    : {};

  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
  });

  const total = await prisma.user.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },

    data: result,
  };
};

const getSingleUser = async (id: number) => {
  const result = await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      posts: true,
    },
  });
  return result;
};

const updateUser = async (
  id: number,
  payload: {
    name?: string;
    email?: string;
  },
) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!isUserExists) {
    throw new AppError(404, "User not found");
  }

  const result = await prisma.user.update({
    where: {
      id,
    },
    data: payload,
  });

  return result;
};

const deleteUser = async (id: number) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!isUserExists) {
    throw new AppError(404, "User not found");
  }

  const result = await prisma.user.delete({
    where: {
      id,
    },
  });

  return result;
};

export const UserService = {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
};

// notes
// Service Layer Responsibility

// This is where:

// database queries
// business logic
// validations
// reusable logic

// Prisma mostly stays here.
