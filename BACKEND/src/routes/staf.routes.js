import express from "express";
import { staffRegister,staffLogin, getStaffProfile, updateStaffProfile} from "../controllers/staff.controllers.js";
import { staffAuth } from "../middleware/staffAuth.js";
import { getDepartments } from "../controllers/department.controllers.js";
const router=express.Router();

router.post("/register",staffRegister);
router.post("/login",staffLogin);
router.get("/departments",getDepartments);
router.get('/profile', staffAuth, getStaffProfile);
router.put('/profile', staffAuth, updateStaffProfile); // 🚀 NEW: Staff can update their own name/phone/profile photo

export default router;