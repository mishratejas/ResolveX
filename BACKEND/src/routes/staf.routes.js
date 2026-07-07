import express from "express";
import { staffLogin, staffRefreshToken, staffLogout, getStaffProfile, updateStaffProfile} from "../controllers/staff.controllers.js";
import { staffAuth } from "../middleware/staffAuth.js";
const router=express.Router();

router.post("/login",staffLogin);
router.post("/refresh-token", staffRefreshToken);
router.post("/logout", staffLogout);
router.get('/profile', staffAuth, getStaffProfile);
router.put('/profile', staffAuth, updateStaffProfile);

export default router;