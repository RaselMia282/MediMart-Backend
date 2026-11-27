import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();
router.post("/registration", authController.pendingRegisterUser);
router.post("/verify-email", authController.verifyEmailAndCreateUser);
router.post("/login", authController.loginUser);
router.post("/logout",authController.logout)

export const authRouter = router;
