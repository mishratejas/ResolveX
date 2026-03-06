import Staff from '../models/Staff.models.js';
import UserComplaint from '../models/UserComplaint.models.js';

export const getLeastLoadedStaff = async (departmentId, adminId) => {
    try {
        // 1. Find all active, approved staff in this specific department and workspace
        const availableStaff = await Staff.find({
            department: departmentId,
            adminId: adminId,
            isApproved: true,
            isActive: true
        });

        // If no staff exist in this department, return null (ticket stays Pending)
        if (!availableStaff || availableStaff.length === 0) {
            return null; 
        }

        // 2. Look at all currently active tickets and group them by Staff ID
        const staffIds = availableStaff.map(s => s._id);
        
        const loadStats = await UserComplaint.aggregate([
            { 
                $match: { 
                    assignedTo: { $in: staffIds },
                    status: { $in: ['pending', 'in-progress'] } // Only count active work
                } 
            },
            {
                $group: {
                    _id: '$assignedTo',
                    activeTickets: { $sum: 1 }
                }
            }
        ]);

        // 3. Find the staff member with the lowest load
        let lowestLoad = Infinity;
        let selectedStaffId = null;

        // Loop through ALL available staff. 
        // (Staff with 0 tickets won't show up in loadStats, so we default them to 0)
        for (const staff of availableStaff) {
            const stat = loadStats.find(l => l._id.toString() === staff._id.toString());
            const load = stat ? stat.activeTickets : 0; 

            // The moment we find someone with 0, we can just assign it to them immediately!
            if (load === 0) {
                return staff._id;
            }

            if (load < lowestLoad) {
                lowestLoad = load;
                selectedStaffId = staff._id;
            }
        }

        return selectedStaffId;
    } catch (error) {
        console.error("Load Balancer Error:", error);
        return null; // Fail gracefully: leave it unassigned so the Admin can handle it
    }
};