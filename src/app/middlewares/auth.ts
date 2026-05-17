import type { NextFunction, Request, Response } from "express";

import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

import AppError from "../errors/AppError";

const auth =
  (...requiredRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;

    if (!token) {
      throw new AppError(401, "You are not authorized");
    }

    const actualToken = token.split(" ")[1];

    if (!actualToken) {
      throw new AppError(401, "You are not authorized");
    }

    const verifiedToken = jwt.verify(
      actualToken,
      process.env.JWT_ACCESS_SECRET as string,
    ) as JwtPayload;

    // Role Check
    if (requiredRoles.length && !requiredRoles.includes(verifiedToken.role)) {
      throw new AppError(403, "Forbidden Access");
    }

    req.user = verifiedToken;

    next();
  };

export default auth;
