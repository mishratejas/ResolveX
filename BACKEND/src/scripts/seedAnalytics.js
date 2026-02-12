
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import UserComplaint from '../models/UserComplaint.models.js';
import User from '../models/User.models.js';
import Staff from '../models/Staff.models.js';
import Department from '../models/Department.model.js';
import AuditLog from '../models/AuditLog.models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/resolvex";

const seedAnalytics = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('📦 Connected to MongoDB');

        // Get existing data for reference
        const users = await User.find();
        const staffMembers = await Staff.find();
        const departments = await Department.find();

        if (users.length === 0 || staffMembers.length === 0 || departments.length === 0) {
            console.error('❌ Please ensure you have basic users, staff, and departments first.');
            process.exit(1);
        }

        console.log('🌱 Seeding analytics data...');

        const complaints = [];
        const auditLogs = [];
        const statuses = ['pending', 'in-progress', 'resolved', 'rejected', 'closed'];
        const priorities = ['low', 'medium', 'high', 'critical'];
        const categories = departments.map(d => d.name); // or d.category

        const validComplaintCategories = ["road", "water", "electricity", "sanitation", "security", "transport", "other"];
        
        // Helper to map department to category
        const contentMap = {
            'Water Supply': 'water',
            'Electricity': 'electricity',
            'Road Maintenance': 'road',
            'Sanitation': 'sanitation',
            'Police': 'security',
            'Transport': 'transport'
        };

        // Generate data for the last 90 days
        for (let i = 0; i < 200; i++) {
            // Random date within last 90 days
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 90));
            // Random time
            date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

            const user = users[Math.floor(Math.random() * users.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const priority = priorities[Math.floor(Math.random() * priorities.length)];
            const department = departments[Math.floor(Math.random() * departments.length)];
            
            // Determine category
            let category = contentMap[department.name] || validComplaintCategories.find(c => department.name.toLowerCase().includes(c)) || 'other';
            if (!validComplaintCategories.includes(category)) category = 'other';

            // Determine assignment
            let assignedTo = null;
            if (status !== 'pending' && status !== 'rejected') {
                // Find staff in that department
                const deptStaff = staffMembers.filter(s => s.department?.toString() === department._id.toString());
                if (deptStaff.length > 0) {
                    assignedTo = deptStaff[Math.floor(Math.random() * deptStaff.length)]._id;
                } else {
                    // Fallback to any staff if none in department
                    assignedTo = staffMembers[Math.floor(Math.random() * staffMembers.length)]._id;
                }
            }

            // Create Complaint
            const complaint = new UserComplaint({
                user: user._id,
                title: `Issue regarding ${department.name} - ${Math.random().toString(36).substring(7)}`,
                description: `This is a simulated complaint for analytics testing. Details about ${department.name} issue...`,
                category: category,
                department: department._id, // Fixed: Use ObjectId
                priority: priority,
                status: status,
                assignedTo: assignedTo,
                location: {
                    address: parseFloat(Math.random().toFixed(1)) > 0.5 ? 'Sector ' + Math.floor(Math.random() * 20) : undefined,
                    latitude: (Math.random() > 0.3) ? 19.07 + (Math.random() * 0.1 - 0.05) : undefined,
                    longitude: (Math.random() > 0.3) ? 72.87 + (Math.random() * 0.1 - 0.05) : undefined
                },
                createdAt: date,
                updatedAt: date
            });

            complaints.push(complaint);

            // Generate Audit Log for Creation
            auditLogs.push({
                actor: user._id,
                actorModel: 'User',
                actorName: user.name,
                actorEmail: user.email,
                action: 'ISSUE_CREATED',
                category: 'ISSUE_MANAGEMENT',
                severity: 'LOW',
                status: 'SUCCESS',
                description: `${user.name} created new issue: ${complaint.title}`,
                targetModel: 'UserComplaint',
                targetName: complaint.title,
                timestamp: date
            });

            // If resolved/assigned, add more logs
            if (assignedTo) {
                const assignee = staffMembers.find(s => s._id.toString() === assignedTo.toString());
                const assignDate = new Date(date);
                assignDate.setHours(assignDate.getHours() + 1);

                auditLogs.push({
                    actor: assignee?._id || user._id, // Assignee or Admin
                    actorModel: 'Staff',
                    actorName: assignee?.name || 'Staff',
                    actorEmail: assignee?.email || 'staff@example.com',
                    action: 'ISSUE_ASSIGNED',
                    category: 'ISSUE_MANAGEMENT',
                    severity: 'MEDIUM',
                    status: 'SUCCESS',
                    description: `Issue assigned to ${assignee?.name}`,
                    targetModel: 'UserComplaint',
                    targetName: complaint.title,
                    timestamp: assignDate
                });

                if (status === 'resolved') {
                    const resolveDate = new Date(assignDate);
                    resolveDate.setDate(resolveDate.getDate() + Math.floor(Math.random() * 5));
                    
                    complaint.updatedAt = resolveDate; // Update complaint timestamp

                    auditLogs.push({
                        actor: assignee?._id || user._id,
                        actorModel: 'Staff',
                        actorName: assignee?.name || 'Staff',
                        actorEmail: assignee?.email || 'staff@example.com',
                        action: 'ISSUE_RESOLVED',
                        category: 'ISSUE_MANAGEMENT',
                        severity: 'MEDIUM',
                        status: 'SUCCESS',
                        description: `Issue resolved by ${assignee?.name}`,
                        targetModel: 'UserComplaint',
                        targetName: complaint.title,
                        timestamp: resolveDate
                    });
                }
            }
        }

        await UserComplaint.insertMany(complaints);
        await AuditLog.insertMany(auditLogs);

        console.log(`✅ Successfully seeded ${complaints.length} complaints and ${auditLogs.length} audit logs.`);
        process.exit(0);

    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedAnalytics();
