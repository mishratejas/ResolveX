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
import Admin from "../models/Admin.models.js";
import Staff from "../models/Staff.models.js";
import UserComplaint from "../models/UserComplaint.models.js";

// ==================== PUBLIC ROUTES ====================

export const getDepartmentsByWorkspaceCode = async (req, res) => {
    try {
        const { code } = req.params;

        if (!code) {
            return res.status(400).json({ success: false, message: 'Workspace code is required' });
        }

        const admin = await Admin.findOne({ workspaceCode: code.toUpperCase() });
        
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Invalid workspace code' });
        }

        const departments = await Department.find({ adminId: admin._id, isActive: true })
            .select('_id name description') // Removed category
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

export const getDepartments = async (req, res) => {
    try {
        const currentAdminId = req.admin?._id || req.admin?.id || req.user?.id;
        
        const departments = await Department.find({ adminId: currentAdminId, isActive: true })
            .select('_id name description') // Removed category
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

export const getDepartmentStats = async (req, res) => {
    try {
        const currentAdminId = req.admin?._id || req.admin?.id || req.user?.id;

        const departments = await Department.find({ adminId: currentAdminId, isActive: true })
            .select('_id name')
            .sort({ name: 1 });

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

export const createDepartment = async (req, res) => {
    try {
        const currentAdminId = req.admin?._id || req.admin?.id || req.user?.id;
        // 🚀 Removed category requirement from here
        const { name, description, contactEmail, contactPhone } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }

        const existingDept = await Department.findOne({ name, adminId: currentAdminId });
        if (existingDept) {
            return res.status(400).json({ success: false, message: 'A department with this name already exists in your workspace' });
        }

        const department = new Department({
            adminId: currentAdminId,
            name,
            description,
            category: 'other', // Default value for schema
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

// 🚀 NEW: The Smart Delete Function
export const deleteDepartment = async (req, res) => {
    try {
        const currentAdminId = req.admin?._id || req.admin?.id || req.user?.id;
        const { id } = req.params;

        // 1. Check if the department exists and belongs to this admin
        const deptToDelete = await Department.findOne({ _id: id, adminId: currentAdminId });
        if (!deptToDelete) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }

        // 2. Prevent deleting the fallback 'Other' department
        if (deptToDelete.name.toLowerCase() === 'other') {
            return res.status(400).json({ success: false, message: "Cannot delete the default 'Other' department" });
        }

        // 3. Find the fallback "Other" department
        let fallbackDept = await Department.findOne({ adminId: currentAdminId, name: 'Other' });
        
        // Safety net: if 'Other' got deleted somehow, recreate it
        if (!fallbackDept) {
            fallbackDept = new Department({ 
                name: 'Other', 
                description: 'Default bucket', 
                adminId: currentAdminId,
                category: 'other' 
            });
            await fallbackDept.save();
        }

        // 4. Move all Staff
        const staffUpdate = await Staff.updateMany(
            { department: id, adminId: currentAdminId },
            { $set: { department: fallbackDept._id } }
        );

        // 5. Move all Tickets (Ensure field name matches your UserComplaint schema: 'department' or 'assignedDepartment')
        const ticketUpdate = await UserComplaint.updateMany(
            { department: id, adminId: currentAdminId }, 
            { $set: { department: fallbackDept._id } } 
        );

        // 6. Finally, delete the department
        await Department.findByIdAndDelete(id);

        res.status(200).json({ 
            success: true, 
            message: `Department deleted. Moved ${staffUpdate.modifiedCount} staff and ${ticketUpdate.modifiedCount} tickets to 'Other'.` 
        });

    } catch (error) {
        console.error("❌ Error deleting department:", error);
        res.status(500).json({ success: false, message: "Error deleting department" });
    }
};