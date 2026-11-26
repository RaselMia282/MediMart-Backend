import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();
router.post("/registration",authController.pendingRegisterUser);
router.post("/verify-email",authController.verifyEmailAndCreateUser);

export const authRouter = router;