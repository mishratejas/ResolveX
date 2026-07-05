import express from "express";
import {
    handleGetStaffComplaints,
    handleUpdateStaffComplaint,
    handleGetStaffStats,
    getAdminsIdForStaff
} from "../controllers/staff_issue.controllers.js";
import {staffAuth} from "../middleware/staffAuth.js";

const router=express.Router();

router.get("/",staffAuth,handleGetStaffComplaints);
router.put("/:id",staffAuth,handleUpdateStaffComplaint);
router.get("/stats",staffAuth,handleGetStaffStats);
router.get("/admins/list", staffAuth, getAdminsIdForStaff);


export default router;