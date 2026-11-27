import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string("Name is required")
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name cannot exceed 100 characters"),

  email: z
    .string("Email is required")
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address")
    .max(150, "Email cannot exceed 150 characters"),

  password: z
    .string("Password is required")
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password cannot exceed 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),

  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, "Please provide a valid phone number")
    .optional(),
});

export const verifyEmailSchema = z.object({
  email: z
    .string("Email is required")
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address")
    .max(150, "Email cannot exceed 150 characters"),

  otp: z
    .string("OTP is required")
    .trim()
    .regex(/^\d{6}$/, "OTP must be a valid 6-digit number"),
});

export const loginSchema = z.object({
  email: z
    .string("Email is required")
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address")
    .max(150, "Email cannot exceed 150 characters"),

  password: z
    .string("Password is required")
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password cannot exceed 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});
