import express from "express";
import { staffRegister,staffLogin } from "../controllers/staff.controllers.js";
import { staffAuth } from "../middleware/staffAuth.js";
import { getDepartments } from "../controllers/department.controllers.js";
const router=express.Router();

router.post("/register",staffRegister);
router.post("/login",staffLogin);
router.get("/departments",getDepartments);

export default router;