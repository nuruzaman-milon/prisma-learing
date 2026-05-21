import { prisma } from "../../../prisma/prisma";
import QueryBuilder from "../../builder/QueryBuilder";
import cloudinary from "../../config/cloudinary.config";
import redisClient from "../../config/redis.config";
import AppError from "../../errors/AppError";
import fs from "fs-extra";

// const createUser = async (payload: { name?: string; email: string }) => {
//   const isUserExists = await prisma.user.findUnique({
//     where: {
//       email: payload.email,
//     },
//   });

//   if (isUserExists) {
//     throw new AppError(409, "Email already exists");
//   }
//   const result = await prisma.user.create({
//     data: payload,
//   });

//   return result;
// };

const createUser = async (payload: {
  name?: string;
  email: string;
  role?: string;
  profile?: {
    bio?: string;
  };
}) => {
  const result = await prisma.$transaction(async (tx) => {
    const isUserExists = await tx.user.findUnique({
      where: {
        email: payload.email,
      },
    });
    if (isUserExists) {
      throw new AppError(409, "Email already exists");
    }
    const user = await tx.user.create({
      data: {
        name: payload.name || "",
        email: payload.email,
        role: payload.role || "user",
      },
    });

    const profile = await tx.profile.create({
      data: {
        bio: payload.profile?.bio || "Developer",
        userId: user.id,
      },
    });

    return {
      user,
      profile,
    };
  });

  return result;
};

const getAllUsers = async (query: Record<string, unknown>) => {
  // Check cache first
  const cachedUsers = await redisClient.get("all-users");

  if (cachedUsers) {
    console.log("Data coming from Redis cache");

    return JSON.parse(cachedUsers);
  }

  console.log("Data coming from Database");

  // DB query
  const queryBuilder = new QueryBuilder(
    {
      where: {
        isDeleted: false,
      },
    },

    query,
  )
    .search(["name", "email"])
    .paginate()
    .sort()
    .fields();

  const result = await prisma.user.findMany(queryBuilder.modelQuery);

  // Save into Redis
  await redisClient.set("all-users", JSON.stringify(result), {
    EX: 60, // 1 minute
  });
  return result;
};

//without query builder
// const getAllUsers = async (query: Record<string, unknown>) => {
//   const searchTerm = query.searchTerm as string;

//   const page = Number(query.page) || 1;

//   const limit = Number(query.limit) || 5;

//   const skip = (page - 1) * limit;

//   const whereConditions: Prisma.UserWhereInput = searchTerm
//     ? {
//         OR: [
//           {
//             name: {
//               contains: searchTerm,
//               mode: "insensitive",
//             },
//           },

//           {
//             email: {
//               contains: searchTerm,
//               mode: "insensitive",
//             },
//           },
//         ],
//       }
//     : {};

//   const result = await prisma.user.findMany({
//     where: whereConditions,
//     skip,
//     take: limit,
//   });

//   const total = await prisma.user.count({
//     where: whereConditions,
//   });

//   return {
//     meta: {
//       page,
//       limit,
//       total,
//     },

//     data: result,
//   };
// };

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

const updateProfile = async (userId: number, payload: any, file: any) => {
  let imageUrl;
  let newImagePublicId;

  const profile = await prisma.profile.findUnique({
    where: {
      userId,
    },
  });

  if (!profile) {
    throw new AppError(404, "Profile not found");
  }

  const oldImagePublicId = profile.profilePhotoPublicId;

  // Upload to Cloudinary
  if (file) {
    const uploadResult = await cloudinary.uploader.upload(file.path);
    imageUrl = uploadResult.secure_url;
    newImagePublicId = uploadResult.public_id;
    // Delete temp local file
    await fs.remove(file.path);
  }

  const updateData: any = {
    ...payload,
  };

  if (imageUrl && newImagePublicId) {
    updateData.profilePhoto = imageUrl;

    updateData.profilePhotoPublicId = newImagePublicId;
  }

  // Update profile
  const result = await prisma.profile.update({
    where: {
      userId,
    },

    data: updateData,
  });

  // Delete old image from Cloudinary
  if (file && oldImagePublicId) {
    await cloudinary.uploader.destroy(oldImagePublicId);
  }

  return result;
};

export const UserService = {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  updateProfile,
};

// notes
// Service Layer Responsibility

// This is where:

// database queries
// business logic
// validations
// reusable logic

// Prisma mostly stays here.
