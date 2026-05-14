import type { ErrorRequestHandler } from "express";

import AppError from "../errors/AppError";

const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  let statusCode = 500;

  let message = "Something went wrong";

  if (error instanceof AppError) {
    statusCode = error.statusCode;

    message = error.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default globalErrorHandler;
