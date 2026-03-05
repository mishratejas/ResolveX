// // department.controllers.js
// import Department from "../models/Department.model.js";

// // Get all active departments for dropdown
// export const getDepartments = async (req, res) => {
//     try {
//         const departments = await Department.find({ isActive: true })
//             .select('_id name category description')
//             .sort({ name: 1 });

//         res.status(200).json({
//             success: true,
//             data: departments
//         });
//     } catch (error) {
//         console.error('Error fetching departments:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching departments'
//         });
//     }
// };

// // Get department statistics for dashboard
// export const getDepartmentStats = async (req, res) => {
//     try {
//         const departments = await Department.find({ isActive: true })
//             .select('_id name category')
//             .sort({ name: 1 });

//         // For dashboard charts, return mock/computed stats
//         // In a real app, you would aggregate complaint data here
//         const stats = departments.map(dept => ({
//             name: dept.name,
//             complaints: Math.floor(Math.random() * 100) + 20, // Mock data
//             resolved: Math.floor(Math.random() * 80) + 10,    // Mock data
//             pending: Math.floor(Math.random() * 30) + 5       // Mock data
//         }));

//         res.status(200).json({
//             success: true,
//             data: stats
//         });
//     } catch (error) {
//         console.error('Error fetching department stats:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching department stats'
//         });
//     }
// };

// // Create new department (optional, for admin)
// export const createDepartment = async (req, res) => {
//     try {
//         const { name, description, category, contactEmail, contactPhone } = req.body;

//         if (!name || !category) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Name and category are required'
//             });
//         }

//         const existingDept = await Department.findOne({ name });
//         if (existingDept) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Department with this name already exists'
//             });
//         }

//         const department = new Department({
//             name,
//             description,
//             category,
//             contactEmail,
//             contactPhone
//         });

//         await department.save();

//         res.status(201).json({
//             success: true,
//             message: 'Department created successfully',
//             data: department
//         });
//     } catch (error) {
//         console.error('Error creating department:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error creating department'
//         });
//     }
// };

import Department from "../models/Department.model.js";
import Admin from "../models/Admin.models.js"; // 🚀 NEW: Required to verify workspace codes

// ==================== PUBLIC ROUTES ====================

// 🚀 NEW: Fetch departments by Workspace Code (For Staff Signup Dropdown)
export const getDepartmentsByWorkspaceCode = async (req, res) => {
    try {
        const { code } = req.params;

        if (!code) {
            return res.status(400).json({ success: false, message: 'Workspace code is required' });
        }

        // 1. Find the admin that owns this workspace code
        const admin = await Admin.findOne({ workspaceCode: code.toUpperCase() });
        
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Invalid workspace code' });
        }

        // 2. Fetch ONLY departments belonging to this specific admin
        const departments = await Department.find({ adminId: admin._id, isActive: true })
            .select('_id name category description')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: departments
        });
    } catch (error) {
        console.error('❌ Error fetching workspace departments:', error);
        res.status(500).json({ success: false, message: 'Error fetching departments' });
    }
};

// ==================== PROTECTED ROUTES (Requires Auth) ====================

// 🔧 UPDATED: Get departments for the logged-in Admin's dashboard
export const getDepartments = async (req, res) => {
    try {
        const currentAdminId = req.admin?._id || req.admin?.id || req.user?.id;
        
        const departments = await Department.find({ adminId: currentAdminId, isActive: true })
            .select('_id name category description')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: departments
        });
    } catch (error) {
        console.error('❌ Error fetching departments:', error);
        res.status(500).json({ success: false, message: 'Error fetching departments' });
    }
};

// 🔧 UPDATED: Get department statistics scoped to the Admin
export const getDepartmentStats = async (req, res) => {
    try {
        const currentAdminId = req.admin?._id || req.admin?.id || req.user?.id;

        const departments = await Department.find({ adminId: currentAdminId, isActive: true })
            .select('_id name category')
            .sort({ name: 1 });

        // Keeping your mock data structure, but it is now correctly mapped to the Admin's actual departments!
        const stats = departments.map(dept => ({
            name: dept.name,
            complaints: Math.floor(Math.random() * 100) + 20, 
            resolved: Math.floor(Math.random() * 80) + 10,    
            pending: Math.floor(Math.random() * 30) + 5       
        }));

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('❌ Error fetching department stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching department stats' });
    }
};

// 🔧 UPDATED: Create department (Locked to Admin Workspace)
export const createDepartment = async (req, res) => {
    try {
        const currentAdminId = req.admin?._id || req.admin?.id || req.user?.id;
        const { name, description, category, contactEmail, contactPhone } = req.body;

        if (!name || !category) {
            return res.status(400).json({ success: false, message: 'Name and category are required' });
        }

        // 🚀 Ensure uniqueness is ONLY checked within this specific admin's workspace
        // Admin A and Admin B can both have a "Maintenance" department safely.
        const existingDept = await Department.findOne({ name, adminId: currentAdminId });
        if (existingDept) {
            return res.status(400).json({ success: false, message: 'A department with this name already exists in your workspace' });
        }

        const department = new Department({
            adminId: currentAdminId, // 🚀 Lock it to the admin!
            name,
            description,
            category,
            contactEmail,
            contactPhone
        });

        await department.save();

        res.status(201).json({
            success: true,
            message: 'Department created successfully',
            data: department
        });
    } catch (error) {
        console.error('❌ Error creating department:', error);
        res.status(500).json({ success: false, message: 'Error creating department' });
    }
};