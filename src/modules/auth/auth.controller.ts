import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { registerSchema, verifyEmailSchema } from "./auth.validation";
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const pendingRegisterUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = registerSchema.safeParse(req.body);
    if (!payload.success) {
      throw new Error(payload.error.message);
    }

    const result = await authService.pendingRegisterUserIntoDB(payload.data);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User registered successful",
      data: result,
    });
  },
);

const verifyEmailAndCreateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = verifyEmailSchema.safeParse(req.body);
    if (!payload.success) {
      throw new Error(payload.error.message);
    }

    const result = await authService.verifyEmailAndCreateUserIntoDB(
      payload.data,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Email verified successfully",
      data: result,
    });
  },
);

export const authController = {
  pendingRegisterUser,
  verifyEmailAndCreateUser,
};
