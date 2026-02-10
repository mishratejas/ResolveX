// department.controllers.js
import Department from "../models/Department.model.js";

// Get all active departments for dropdown
export const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find({ isActive: true })
            .select('_id name category description')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: departments
        });
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching departments'
        });
    }
};

// Get department statistics for dashboard
export const getDepartmentStats = async (req, res) => {
    try {
        const departments = await Department.find({ isActive: true })
            .select('_id name category')
            .sort({ name: 1 });

        // For dashboard charts, return mock/computed stats
        // In a real app, you would aggregate complaint data here
        const stats = departments.map(dept => ({
            name: dept.name,
            complaints: Math.floor(Math.random() * 100) + 20, // Mock data
            resolved: Math.floor(Math.random() * 80) + 10,    // Mock data
            pending: Math.floor(Math.random() * 30) + 5       // Mock data
        }));

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching department stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching department stats'
        });
    }
};

// Create new department (optional, for admin)
export const createDepartment = async (req, res) => {
    try {
        const { name, description, category, contactEmail, contactPhone } = req.body;

        if (!name || !category) {
            return res.status(400).json({
                success: false,
                message: 'Name and category are required'
            });
        }

        const existingDept = await Department.findOne({ name });
        if (existingDept) {
            return res.status(400).json({
                success: false,
                message: 'Department with this name already exists'
            });
        }

        const department = new Department({
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
        console.error('Error creating department:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating department'
        });
    }
};