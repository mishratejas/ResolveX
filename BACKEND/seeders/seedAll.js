import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Import models
import Admin from '../src/models/Admin.models.js';
import Department from '../src/models/Department.model.js';
import Staff from '../src/models/Staff.models.js';
import User from '../src/models/User.models.js';
import UserComplaint from '../src/models/UserComplaint.models.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resolvex';

// Helper function to generate random date within range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper to get random item from array
const randomItem = (array) => array[Math.floor(Math.random() * array.length)];

// Helper to generate random phone
const randomPhone = () => {
  return '9' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
};

// Helper to generate random coordinates (centered around India)
const randomCoordinates = () => {
  return {
    latitude: 20.5937 + (Math.random() - 0.5) * 2,
    longitude: 78.9629 + (Math.random() - 0.5) * 2
  };
};

// Valid category enum values from Department model
const validCategories = [
  "infrastructure", 
  "utilities", 
  "public-safety", 
  "administrative", 
  "health", 
  "education", 
  "other"
];

// Complaint titles and descriptions by category (mapped to valid enum values)
const complaintTemplates = {
  'infrastructure': [
    { title: 'Deep pothole on main road', description: 'Large pothole causing traffic jams and vehicle damage' },
    { title: 'Street light not working', description: 'Complete darkness on Main Street for a week' },
    { title: 'Broken footpath', description: 'Pedestrian path is broken and dangerous for walkers' },
    { title: 'Missing road sign', description: 'Important road sign missing at intersection' },
    { title: 'Bridge needs repair', description: 'Cracks visible on the bridge structure' },
    { title: 'Damaged road divider', description: 'Road divider broken, safety hazard' }
  ],
  'utilities': [
    { title: 'No water supply since 3 days', description: 'Entire colony has no water connection' },
    { title: 'Yellow/brown water coming', description: 'Water is muddy and smells bad' },
    { title: 'Broken water pipe', description: 'Water pipe burst, wasting water' },
    { title: 'Low water pressure', description: 'Very low pressure in morning hours' },
    { title: 'Frequent power cuts', description: 'Power cuts every 2-3 hours' },
    { title: 'Broken electric pole', description: 'Electric pole leaning dangerously' }
  ],
  'public-safety': [
    { title: 'Suspicious activity', description: 'Unknown persons loitering at night' },
    { title: 'Street lights out', description: 'Dark area encouraging crime' },
    { title: 'Broken CCTV camera', description: 'Security camera not working' },
    { title: 'Park safety issue', description: 'No security in children\'s park' },
    { title: 'Vacant plot misuse', description: 'Empty plot being used for illegal activities' },
    { title: 'Stray animal issue', description: 'Stray dogs/cattle causing problems' }
  ],
  'administrative': [
    { title: 'Encroachment', description: 'Shop extended onto footpath' },
    { title: 'Illegal parking', description: 'Cars parked on footpath' },
    { title: 'Missing bus stop', description: 'No bus shelter at busy stop' },
    { title: 'Traffic signal issue', description: 'Signal stuck on red' },
    { title: 'No auto rickshaw stand', description: 'Autos park randomly causing chaos' }
  ],
  'health': [
    { title: 'Stagnant water', description: 'Water logging causing mosquito breeding' },
    { title: 'Open drainage', description: 'Drainage open, causing mosquito breeding' },
    { title: 'Garbage not collected', description: 'Waste piling up for 2 weeks' },
    { title: 'No dustbins in area', description: 'No public dustbins on main market' },
    { title: 'Sewage overflow', description: 'Sewage water coming onto road' }
  ],
  'education': [
    { title: 'Noise pollution near school', description: 'Loud noise affecting school children' },
    { title: 'Broken playground equipment', description: 'School park equipment broken' },
    { title: 'No street light near school', description: 'Dark area near school entrance' }
  ],
  'other': [
    { title: 'Tree branch dangerous', description: 'Dead tree branch about to fall' },
    { title: 'Air pollution', description: 'Dust from construction site' },
    { title: 'Noise pollution', description: 'Loud music causing disturbance' }
  ]
};

// Department names by category (using valid enum values)
const departmentsByCategory = {
  'infrastructure': [
    { name: 'Road Maintenance', description: 'Road repairs and maintenance' },
    { name: 'Bridge Department', description: 'Bridge infrastructure' },
    { name: 'Street Lighting', description: 'Street light maintenance' },
    { name: 'Footpath Division', description: 'Pedestrian path maintenance' }
  ],
  'utilities': [
    { name: 'Water Distribution', description: 'Water supply management' },
    { name: 'Pipeline Maintenance', description: 'Water pipe repairs' },
    { name: 'Power Distribution', description: 'Electricity supply' },
    { name: 'Line Maintenance', description: 'Power line repairs' }
  ],
  'public-safety': [
    { name: 'Security Patrol', description: 'Area security' },
    { name: 'CCTV Monitoring', description: 'Surveillance systems' },
    { name: 'Emergency Response', description: 'Quick response team' },
    { name: 'Animal Control', description: 'Stray animal management' }
  ],
  'administrative': [
    { name: 'Traffic Management', description: 'Traffic control' },
    { name: 'Road Safety', description: 'Road safety measures' },
    { name: 'Parking Authority', description: 'Parking management' },
    { name: 'Encroachment Cell', description: 'Illegal encroachment removal' }
  ],
  'health': [
    { name: 'Garbage Collection', description: 'Waste collection services' },
    { name: 'Drainage Department', description: 'Drain maintenance' },
    { name: 'Sewage Treatment', description: 'Sewage management' },
    { name: 'Public Health', description: 'Community health issues' }
  ],
  'education': [
    { name: 'School Infrastructure', description: 'School building maintenance' },
    { name: 'Educational Facilities', description: 'Educational facilities management' }
  ],
  'other': [
    { name: 'General Services', description: 'General complaints' },
    { name: 'Environmental', description: 'Environment related' },
    { name: 'Customer Service', description: 'Public grievances' }
  ]
};

const seedDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Admin.deleteMany({});
    await Department.deleteMany({});
    await Staff.deleteMany({});
    await User.deleteMany({});
    await UserComplaint.deleteMany({});
    console.log('✅ All collections cleared\n');

    // ==================== CREATE ADMINS (WORKSPACES) ====================
    console.log('🏢 Creating admins (workspaces)...');
    
    const admins = [
      {
        organizationName: 'Gwalior City',
        name: 'Krishna Mishra',
        email: 'krishnamishra040907@gmail.com',
        phone: '9876543210',
        password: await bcrypt.hash('123456', 10),
        role: 'admin',
        workspaceCode: '20F25C' // Fixed code as per your screenshot
      },
      {
        organizationName: 'Indore Municipal Corporation',
        name: 'Rajesh Sharma',
        email: 'indore@resolvex.com',
        phone: '9876543211',
        password: await bcrypt.hash('123456', 10),
        role: 'admin',
        workspaceCode: crypto.randomBytes(3).toString('hex').toUpperCase()
      },
      {
        organizationName: 'Bhopal Smart City',
        name: 'Priya Singh',
        email: 'bhopal@resolvex.com',
        phone: '9876543212',
        password: await bcrypt.hash('123456', 10),
        role: 'admin',
        workspaceCode: crypto.randomBytes(3).toString('hex').toUpperCase()
      },
      {
        organizationName: 'Jabalpur Development Authority',
        name: 'Amit Patel',
        email: 'jabalpur@resolvex.com',
        phone: '9876543213',
        password: await bcrypt.hash('123456', 10),
        role: 'admin',
        workspaceCode: crypto.randomBytes(3).toString('hex').toUpperCase()
      }
    ];

    const createdAdmins = await Admin.insertMany(admins);
    console.log(`✅ Created ${createdAdmins.length} admins/workspaces`);

    // ==================== CREATE DEPARTMENTS FOR EACH ADMIN ====================
    console.log('\n🏛️  Creating departments...');
    
    const allDepartments = [];
    
    for (const admin of createdAdmins) {
      for (const [category, depts] of Object.entries(departmentsByCategory)) {
        for (const dept of depts) {
          allDepartments.push({
            adminId: admin._id,
            name: dept.name,
            description: dept.description,
            category: category, // Using valid enum value directly
            contactEmail: `${dept.name.toLowerCase().replace(/ /g, '.')}@${admin.organizationName.toLowerCase().replace(/ /g, '')}.com`,
            contactPhone: randomPhone(),
            isActive: true
          });
        }
      }
    }

    const createdDepartments = await Department.insertMany(allDepartments);
    console.log(`✅ Created ${createdDepartments.length} departments across all workspaces`);

    // ==================== CREATE STAFF ====================
    // ==================== CREATE STAFF ====================
console.log('\n👥 Creating staff members...');
    
const allStaff = [];
const usedEmails = new Set(); // Track used emails to avoid duplicates

// Staff for Gwalior (including tejas.20243295@mnnit.ac.in)
const gwaliorAdmin = createdAdmins.find(a => a.workspaceCode === '20F25C');
const gwaliorDepts = createdDepartments.filter(d => d.adminId.toString() === gwaliorAdmin._id.toString());

// Create Tejas as staff
const tejasStaffDept = gwaliorDepts.find(d => d.category === 'public-safety') || gwaliorDepts[0];
const tejasEmail = 'tejas.20243295@mnnit.ac.in';
usedEmails.add(tejasEmail);

allStaff.push({
  adminId: gwaliorAdmin._id,
  isApproved: true,
  name: 'Tejas Mishra',
  email: tejasEmail,
  staffId: `STF${gwaliorAdmin.workspaceCode}001`,
  phone: '9999999999',
  password: await bcrypt.hash('123456', 10),
  department: tejasStaffDept._id,
  isActive: true
});

// Create 4 more staff for Gwalior with unique emails
const gwaliorStaffNames = ['Vikram Singh', 'Neha Gupta', 'Rahul Verma', 'Priya Sharma'];
for (let i = 0; i < 4; i++) {
  const dept = randomItem(gwaliorDepts);
  const baseEmail = `${gwaliorStaffNames[i].toLowerCase().replace(/ /g, '.')}@gwalior.gov.in`;
  
  // Make email unique by adding number if needed
  let email = baseEmail;
  let counter = 1;
  while (usedEmails.has(email)) {
    email = baseEmail.replace('@', `${counter}@`);
    counter++;
  }
  usedEmails.add(email);
  
  allStaff.push({
    adminId: gwaliorAdmin._id,
    isApproved: true,
    name: gwaliorStaffNames[i],
    email: email,
    staffId: `STF${gwaliorAdmin.workspaceCode}${String(i + 2).padStart(3, '0')}`,
    phone: randomPhone(),
    password: await bcrypt.hash('123456', 10),
    department: dept._id,
    isActive: true
  });
}

// Staff for other workspaces (3 each)
const otherAdminStaffNames = [
  { name: 'Amit Kumar', dept: 'infrastructure' },
  { name: 'Sneha Reddy', dept: 'health' },
  { name: 'Ravi Shastri', dept: 'utilities' },
  { name: 'Pooja Patel', dept: 'administrative' },
  { name: 'Arun Joshi', dept: 'public-safety' },
  { name: 'Meera Nair', dept: 'education' },
  { name: 'Gautam Kumar', dept: 'other' },
  { name: 'Deepa Singh', dept: 'infrastructure' },
  { name: 'Sanjay Gupta', dept: 'health' }
];

for (const admin of createdAdmins) {
  if (admin.workspaceCode === '20F25C') continue; // Skip Gwalior, already done
  
  const adminDepts = createdDepartments.filter(d => d.adminId.toString() === admin._id.toString());
  
  for (let i = 0; i < 3; i++) {
    const staffInfo = randomItem(otherAdminStaffNames);
    const dept = adminDepts.find(d => d.category === staffInfo.dept) || randomItem(adminDepts);
    
    // Create unique email
    const baseEmail = `${staffInfo.name.toLowerCase().replace(/ /g, '.')}@${admin.organizationName.toLowerCase().replace(/ /g, '')}.com`;
    
    // Make email unique by adding number if needed
    let email = baseEmail;
    let counter = 1;
    while (usedEmails.has(email)) {
      email = baseEmail.replace('@', `${counter}@`);
      counter++;
    }
    usedEmails.add(email);
    
    allStaff.push({
      adminId: admin._id,
      isApproved: true,
      name: staffInfo.name,
      email: email,
      staffId: `STF${admin.workspaceCode}${String(i + 1).padStart(3, '0')}`,
      phone: randomPhone(),
      password: await bcrypt.hash('123456', 10),
      department: dept._id,
      isActive: true
    });
  }
}

const createdStaff = await Staff.insertMany(allStaff);
console.log(`✅ Created ${createdStaff.length} staff members`);
    // ==================== CREATE USERS ====================
    console.log('\n👤 Creating users...');
    
    const allUsers = [];

    // Create Tejas Mishra user
    allUsers.push({
      name: 'Tejas Mishra',
      email: 'tejasmishra040907@gmail.com',
      password: await bcrypt.hash('123456', 10),
      phone: '8888888888',
      address: {
        street: '123 Civil Lines',
        city: 'Gwalior',
        state: 'Madhya Pradesh',
        pincode: '474001'
      },
      role: 'user',
      profileImage: '',
      isVerified: true,
      joinedWorkspaces: [gwaliorAdmin._id]
    });

    // Create 4 more users
    const additionalUsers = [
      {
        name: 'Rohan Das',
        email: 'rohan.das@gmail.com',
        phone: '8888888881',
        city: 'Indore'
      },
      {
        name: 'Sneha Kapoor',
        email: 'sneha.kapoor@gmail.com',
        phone: '8888888882',
        city: 'Bhopal'
      },
      {
        name: 'Arjun Reddy',
        email: 'arjun.reddy@gmail.com',
        phone: '8888888883',
        city: 'Jabalpur'
      },
      {
        name: 'Kavita Iyer',
        email: 'kavita.iyer@gmail.com',
        phone: '8888888884',
        city: 'Gwalior'
      }
    ];

    for (const user of additionalUsers) {
      // Assign to 1-2 random workspaces
      const numWorkspaces = Math.floor(Math.random() * 2) + 1;
      const shuffled = [...createdAdmins].sort(() => 0.5 - Math.random());
      const selectedWorkspaces = shuffled.slice(0, numWorkspaces);
      
      allUsers.push({
        name: user.name,
        email: user.email,
        password: await bcrypt.hash('123456', 10),
        phone: user.phone,
        address: {
          street: `${Math.floor(Math.random() * 100)} Main Road`,
          city: user.city,
          state: 'Madhya Pradesh',
          pincode: String(Math.floor(Math.random() * 900000) + 100000)
        },
        role: 'user',
        profileImage: '',
        isVerified: true,
        joinedWorkspaces: selectedWorkspaces.map(w => w._id)
      });
    }

    const createdUsers = await User.insertMany(allUsers);
    console.log(`✅ Created ${createdUsers.length} users`);

    // ==================== CREATE COMPLAINTS ====================
    console.log('\n📝 Creating complaints with various statuses...');
    
    const statuses = ['pending', 'in-progress', 'resolved', 'rejected'];
    const priorities = ['low', 'medium', 'high', 'critical'];
    const allComplaints = [];
    
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    // Create complaints for each user in each workspace they joined
    for (const user of createdUsers) {
      for (const workspaceId of user.joinedWorkspaces) {
        const admin = createdAdmins.find(a => a._id.toString() === workspaceId.toString());
        if (!admin) continue;
        
        const adminDepts = createdDepartments.filter(d => d.adminId.toString() === admin._id.toString());
        if (adminDepts.length === 0) continue;
        
        // Create 3-7 complaints per user per workspace
        const numComplaints = Math.floor(Math.random() * 5) + 3;
        
        for (let i = 0; i < numComplaints; i++) {
          const department = randomItem(adminDepts);
          const deptStaff = createdStaff.filter(s => 
            s.adminId.toString() === admin._id.toString() && 
            s.department.toString() === department._id.toString()
          );
          
          // Random status with realistic distribution
          const statusRand = Math.random();
          let status;
          if (statusRand < 0.4) status = 'pending';      // 40% pending
          else if (statusRand < 0.65) status = 'in-progress'; // 25% in-progress
          else if (statusRand < 0.9) status = 'resolved';     // 25% resolved
          else status = 'rejected';                          // 10% rejected

          // Random priority
          const priority = randomItem(priorities);
          
          // Get complaint template based on department category
          const templates = complaintTemplates[department.category] || complaintTemplates['other'];
          const template = randomItem(templates);
          
          // Random location
          const coords = randomCoordinates();
          
          // Random date within last 3 months
          const createdAt = randomDate(threeMonthsAgo, now);
          
          // For resolved complaints, set resolvedAt
          let resolvedAt = null;
          if (status === 'resolved') {
            resolvedAt = new Date(createdAt);
            resolvedAt.setDate(resolvedAt.getDate() + Math.floor(Math.random() * 10) + 1); // 1-10 days later
          }
          
          // Random votes (0-8)
          const voteCount = Math.floor(Math.random() * 9);
          const voters = [];
          const otherUsers = createdUsers.filter(u => u._id.toString() !== user._id.toString());
          for (let j = 0; j < voteCount; j++) {
            if (otherUsers.length > 0) {
              const randomUser = randomItem(otherUsers);
              if (!voters.includes(randomUser._id)) {
                voters.push(randomUser._id);
              }
            }
          }
          
          // Random comments (0-4)
          const comments = [];
          const commentCount = Math.floor(Math.random() * 5);
          for (let j = 0; j < commentCount; j++) {
            const staff = deptStaff.length > 0 ? randomItem(deptStaff) : null;
            if (staff) {
              comments.push({
                staff: staff._id,
                message: [
                  'We are looking into this issue.',
                  'Assigned to concerned team.',
                  'Update: Work in progress.',
                  'Issue resolved. Closing.',
                  'Need more information.',
                  'Team dispatched to location.',
                  'Will be addressed within 24 hours.'
                ][Math.floor(Math.random() * 7)],
                createdAt: randomDate(createdAt, now)
              });
            }
          }
          
          // Auto-priority assigned (true for most)
          const autoPriorityAssigned = Math.random() > 0.2;
          
          // Assigned staff
          let assignedTo = null;
          if (deptStaff.length > 0 && (status === 'in-progress' || status === 'resolved')) {
            assignedTo = randomItem(deptStaff)._id;
          }
          
          const complaint = {
            adminId: admin._id,
            title: template.title,
            description: template.description,
            category: department.name, // Store department name in category
            status: status,
            priority: priority,
            autoPriorityAssigned: autoPriorityAssigned,
            manualPriorityOverridden: !autoPriorityAssigned && Math.random() > 0.5,
            location: {
              address: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
              latitude: coords.latitude,
              longitude: coords.longitude
            },
            images: [],
            user: user._id,
            voteCount: voters.length,
            voters: voters,
            department: department._id, // Store department ID
            assignedTo: assignedTo,
            comments: comments,
            resolvedAt: resolvedAt,
            createdAt: createdAt,
            updatedAt: randomDate(createdAt, now)
          };
          
          allComplaints.push(complaint);
        }
      }
    }

    const createdComplaints = await UserComplaint.insertMany(allComplaints);
    console.log(`✅ Created ${createdComplaints.length} complaints`);

    // ==================== UPDATE DEPARTMENT HEADS ====================
    console.log('\n👑 Updating department heads...');
    
    for (const dept of createdDepartments) {
      const deptStaff = createdStaff.filter(s => 
        s.department.toString() === dept._id.toString()
      );
      if (deptStaff.length > 0) {
        dept.head = randomItem(deptStaff)._id;
        await dept.save();
      }
    }
    console.log('✅ Department heads updated');

    // ==================== SUMMARY ====================
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEEDING COMPLETE - SUMMARY');
    console.log('='.repeat(60));
    console.log(`🏢 Admins/Workspaces: ${createdAdmins.length}`);
    console.log(`🏛️  Departments: ${createdDepartments.length}`);
    console.log(`👥 Staff: ${createdStaff.length}`);
    console.log(`👤 Users: ${createdUsers.length}`);
    console.log(`📝 Complaints: ${createdComplaints.length}`);
    console.log('='.repeat(60));
    
    // Status breakdown
    const statusCounts = {
      pending: createdComplaints.filter(c => c.status === 'pending').length,
      'in-progress': createdComplaints.filter(c => c.status === 'in-progress').length,
      resolved: createdComplaints.filter(c => c.status === 'resolved').length,
      rejected: createdComplaints.filter(c => c.status === 'rejected').length
    };
    console.log('\n📊 Complaint Status Breakdown:');
    console.log(`   ⏳ Pending: ${statusCounts.pending}`);
    console.log(`   🔄 In-Progress: ${statusCounts['in-progress']}`);
    console.log(`   ✅ Resolved: ${statusCounts.resolved}`);
    console.log(`   ❌ Rejected: ${statusCounts.rejected}`);
    
    // Workspace breakdown
    console.log('\n🏢 Workspace Details:');
    for (const admin of createdAdmins) {
      const adminComplaints = createdComplaints.filter(c => c.adminId.toString() === admin._id.toString()).length;
      const adminStaff = createdStaff.filter(s => s.adminId.toString() === admin._id.toString()).length;
      const adminUsers = createdUsers.filter(u => u.joinedWorkspaces.includes(admin._id)).length;
      console.log(`   ${admin.organizationName} (${admin.workspaceCode}):`);
      console.log(`      - Staff: ${adminStaff}`);
      console.log(`      - Users: ${adminUsers}`);
      console.log(`      - Complaints: ${adminComplaints}`);
    }

    // Login credentials
    console.log('\n🔐 LOGIN CREDENTIALS:');
    console.log('='.repeat(60));
    console.log('ADMIN:');
    console.log(`   Email: krishnamishra040907@gmail.com`);
    console.log(`   Password: 123456`);
    console.log('\nSTAFF:');
    console.log(`   Email: tejas.20243295@mnnit.ac.in`);
    console.log(`   Password: 123456`);
    console.log('   (and 4 other staff members - check database for emails)');
    console.log('\nUSERS:');
    console.log(`   Email: tejasmishra040907@gmail.com`);
    console.log(`   Password: 123456`);
    console.log(`   Email: rohan.das@gmail.com`);
    console.log(`   Password: 123456`);
    console.log(`   Email: sneha.kapoor@gmail.com`);
    console.log(`   Password: 123456`);
    console.log(`   Email: arjun.reddy@gmail.com`);
    console.log(`   Password: 123456`);
    console.log(`   Email: kavita.iyer@gmail.com`);
    console.log(`   Password: 123456`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seedDatabase();