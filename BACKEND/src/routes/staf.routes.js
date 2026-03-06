import express from "express";
import { staffRegister,staffLogin, getStaffProfile} from "../controllers/staff.controllers.js";
import { staffAuth } from "../middleware/staffAuth.js";
import { getDepartments } from "../controllers/department.controllers.js";
const router=express.Router();

router.post("/register",staffRegister);
router.post("/login",staffLogin);
router.get("/departments",getDepartments);
router.get('/profile', staffAuth, getStaffProfile);

export default router;