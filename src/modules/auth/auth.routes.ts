import { Router } from "express";
import { authController } from "./auth.controller";

import { Roles } from "../../generated/prisma/enums";
import { auth } from "./auth.middleware";

const router = Router();
router.post("/registration", authController.pendingRegisterUser);
router.post("/verify-email", authController.verifyEmailAndCreateUser);
router.post("/login", authController.loginUser);
router.post("/logout", authController.logout);
router.get("/me", auth(Roles.USER, Roles.ADMIN), authController.getMyProfile);

export const authRouter = router;
