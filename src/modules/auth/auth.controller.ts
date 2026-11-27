import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import {
  loginSchema,
  registerSchema,
  verifyEmailSchema,
} from "./auth.validation";
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import {
  ACCESS_COOKIE_MAX_AGE,
  cookieOptions,
  REFRESH_COOKIE_MAX_AGE,
} from "../../utils/cookie";

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

const loginUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = loginSchema.safeParse(req.body);
    if (!payload.success) {
      throw new Error(payload.error.message);
    }
    const { accessToken, refreshToken, user } =
      await authService.loginUserIntoDB(payload.data);

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_COOKIE_MAX_AGE,
    });
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User login successful",
      data: user,
    });
  },
);

const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Logout successful",
      data: null,
    });
  },
);

export const authController = {
  pendingRegisterUser,
  verifyEmailAndCreateUser,
  loginUser,
  logout,
};
