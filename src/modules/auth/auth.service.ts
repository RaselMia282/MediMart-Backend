import { randomInt, createHmac, timingSafeEqual } from "crypto";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import {
  IPendingRegistration,
  IRegisterUser,
  IVerifyEmail,
} from "./auth.interface";
import bcrypt from "bcryptjs";
import { redisClient } from "../../lib/redis";
import { sendVerificationEmail } from "../../utils/sendVerificationEmail";

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
    attempts: 0,
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

  const role = await prisma.role.findUnique({
    where: { name: pendingRegistration.roleName || "CUSTOMER" },
  });
  if (!role) {
    throw new Error("Role not found");
  }

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
  });
  return result;
};

export const authService = {
  pendingRegisterUserIntoDB,
  verifyEmailAndCreateUserIntoDB,
};
