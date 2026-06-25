import express from "express";
import { staffLogin, getStaffProfile, updateStaffProfile} from "../controllers/staff.controllers.js";
import { staffAuth } from "../middleware/staffAuth.js";
import { getDepartments } from "../controllers/department.controllers.js";
const router=express.Router();

// NOTE: Staff registration now lives at POST /api/otp/signup/staff (otp.routes.js),
// which actually verifies the OTP before creating the account.
router.post("/login",staffLogin);
router.get("/departments",getDepartments);
router.get('/profile', staffAuth, getStaffProfile);
router.put('/profile', staffAuth, updateStaffProfile);

export default router;