import express from "express";
import {
    handleGetStaffComplaints,
    handleUpdateStaffComplaint
} from "../controllers/staff_issue.controllers.js";
import {staffAuth} from "../middleware/staffAuth.js";

const router=express.Router();

router.get("/",staffAuth,handleGetStaffComplaints);
router.put("/:id",staffAuth,handleUpdateStaffComplaint);

export default router;