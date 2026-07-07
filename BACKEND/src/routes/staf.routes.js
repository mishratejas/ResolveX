import express from "express";
import { staffLogin, getStaffProfile, updateStaffProfile} from "../controllers/staff.controllers.js";
import { staffAuth } from "../middleware/staffAuth.js";
const router=express.Router();

router.post("/login",staffLogin);
router.get('/profile', staffAuth, getStaffProfile);
router.put('/profile', staffAuth, updateStaffProfile);

export default router;