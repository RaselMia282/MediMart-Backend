import { randomInt, createHmac, timingSafeEqual } from "crypto";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import {
  Ilogin,
  IPendingRegistration,
  IRegisterUser,
  IVerifyEmail,
} from "./auth.interface";
import bcrypt from "bcryptjs";
import { redisClient } from "../../lib/redis";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../../utils/sendVerificationEmail";
import { jwtUtilis } from "../../utils/jwt";

const pendingRegisterUserIntoDB = async (payload: IRegisterUser) => {
  const { name, email, password, phone } = payload;

  const normalizeEmail = email.trim().toLowerCase();

  const isUserExists = await prisma.user.findUnique({
    where: { email: normalizeEmail },
  });
  if (isUserExists) {
    throw new Error("User already exists");
  }

  const hashPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds),
  );

  const otp = randomInt(100000, 1000000).toString();
  if (!config.otp_secret) {
    throw new Error("Invalid OTP");
  }

  const otpHash = createHmac("sha256", config.otp_secret)
    .update(otp)
    .digest("hex");

  const pendingRegisterUser: IPendingRegistration = {
    name,
    email: normalizeEmail,
    phone,
    passwordHash: hashPassword,
    otpHash,
    attempts: 4,
  };

  const redisKey = `medimart:pending-registration:${normalizeEmail}`;
  await redisClient.set(redisKey, JSON.stringify(pendingRegisterUser), {
    EX: 300,
  });
  try {
    await sendVerificationEmail(email, name, otp);
  } catch (error) {
    await redisClient.del(redisKey);
    throw new Error("Verification Failed");
  }
  return {
    email: normalizeEmail,
    message: "OTP sent your email.Please verify your email",
  };
};

const verifyEmailAndCreateUserIntoDB = async (payload: IVerifyEmail) => {
  const { email, otp } = payload;
  const normalizeEmail = email.trim().toLowerCase();
  const redisKey = `medimart:pending-registration:${normalizeEmail}`;

  const pendingData = await redisClient.get(redisKey);
  if (!pendingData) {
    throw new Error("Registration expired or not found");
  }

  const pendingRegistration: IPendingRegistration = JSON.parse(
    pendingData as string,
  );
  const incomingOtpHash = createHmac("sha256", config.otp_secret)
    .update(otp)
    .digest("hex");

  const isOtpValid =
    incomingOtpHash.length === pendingRegistration.otpHash.length &&
    timingSafeEqual(
      Buffer.from(incomingOtpHash, "hex"),
      Buffer.from(pendingRegistration.otpHash, "hex"),
    );

  if (!isOtpValid) {
    throw new Error("Invalid OTP");
  }

  const role = await prisma.role.upsert({
    where: { name: pendingRegistration.roleName || "USER" },
    update: {},
    create: { name: pendingRegistration.roleName || "USER" },
  });

  const result = await prisma.user.create({
    data: {
      name: pendingRegistration.name,
      email: pendingRegistration.email,
      passwordHash: pendingRegistration.passwordHash,
      phone: pendingRegistration.phone,
      emailVerifiedAt: new Date(),

      role: {
        connect: {
          id: role.id,
        },
      },
    },
    omit: {
      passwordHash: true,
    },
  });
  await redisClient.del(redisKey);
  return result;
};

const loginUserIntoDB = async (payload: Ilogin) => {
  const { email, password } = payload;
  const normalizeEmail = email.trim().toLowerCase();
  const isUserExists = await prisma.user.findUnique({
    where: { email: normalizeEmail },
    include: {
      role: true,
    },
  });
  if (!isUserExists) {
    throw new Error("Invalid email or password");
  }

  if (isUserExists.status === "DELETED") {
    throw new Error("User is deleted");
  }
  if (isUserExists.status === "BLOCKED") {
    throw new Error("User is blocked.Please contact support team");
  }
  if (!isUserExists.emailVerifiedAt) {
    throw new Error("Please verify your email");
  }
  const isPasswordMatch = await bcrypt.compare(
    password,
    isUserExists.passwordHash,
  );
  if (!isPasswordMatch) {
    throw new Error("Invalid email or password");
  }
  // first time login user welcome message
  const isFirstLogin = !isUserExists.lastLoginAt;
  await prisma.user.update({
    where: { id: isUserExists.id },
    data: {
      lastLoginAt: new Date(),
    },
  });
  if (isFirstLogin) {
    const userName = isUserExists.name || isUserExists.email.split("@")[0];

    sendWelcomeEmail(isUserExists.email, userName).catch((err: unknown) => {
      console.error("Failed to send welcome email:", err);
    });
  }
  // create jwt
  const jwtPayload = {
    id: isUserExists.id,
    email: isUserExists.email,
    role: isUserExists.role.name,
  };
  // create accesstoken
  const accessToken = jwtUtilis.createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expire_in as string,
  );
  // create refreshtoken
  const refreshToken = jwtUtilis.createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expire_in as string,
  );
  return {
    accessToken,
    refreshToken,
    user: {
      id: isUserExists.id,
      email: isUserExists.email,
      role: isUserExists.role.name,
      profileImage: isUserExists.profileImage,
    },
  };
};

const getMyProfileIntoDB = async (userId: string) => {
  const result = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      status: true,
      emailVerifiedAt: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  if (!result) {
    throw new Error("User not found");
  }
  return result;
};

export const authService = {
  pendingRegisterUserIntoDB,
  verifyEmailAndCreateUserIntoDB,
  loginUserIntoDB,
  getMyProfileIntoDB,
};
