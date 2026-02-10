import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Staff from '../src/models/Staff.models.js';
import Department from '../src/models/Department.model.js';

dotenv.config();

const staffMembers = [
  {
    name: "John Smith",
    email: "john.smith@city.gov",
    staffId: "STAFF001",
    phone: "9876543210",
    password: "staff123",
    role: "staff"
  },
  {
    name: "Sarah Johnson",
    email: "sarah.j@city.gov",
    staffId: "STAFF002",
    phone: "9876543211",
    password: "staff123",
    role: "staff"
  },
  {
    name: "Michael Brown",
    email: "michael.b@city.gov",
    staffId: "STAFF003",
    phone: "9876543212",
    password: "staff123",
    role: "staff"
  },
  {
    name: "Emily Davis",
    email: "emily.d@city.gov",
    staffId: "STAFF004",
    phone: "9876543213",
    password: "staff123",
    role: "staff"
  },
  {
    name: "David Wilson",
    email: "david.w@city.gov",
    staffId: "STAFF005",
    phone: "9876543214",
    password: "staff123",
    role: "staff"
  },
  {
    name: "Lisa Miller",
    email: "lisa.m@city.gov",
    staffId: "STAFF006",
    phone: "9876543215",
    password: "staff123",
    role: "staff"
  },
  {
    name: "Robert Taylor",
    email: "robert.t@city.gov",
    staffId: "STAFF007",
    phone: "9876543216",
    password: "staff123",
    role: "staff"
  },
  {
    name: "Jennifer Lee",
    email: "jennifer.l@city.gov",
    staffId: "STAFF008",
    phone: "9876543217",
    password: "staff123",
    role: "staff"
  },
  {
    name: "William Clark",
    email: "william.c@city.gov",
    staffId: "STAFF009",
    phone: "9876543218",
    password: "staff123",
    role: "staff"
  },
  {
    name: "Amanda Lewis",
    email: "amanda.l@city.gov",
    staffId: "STAFF010",
    phone: "9876543219",
    password: "staff123",
    role: "staff"
  },
  {
    name: "Richard Walker",
    email: "richard.w@city.gov",
    staffId: "STAFF011",
    phone: "9876543220",
    password: "staff123",
    role: "staff"
  },
  {
    name: "Jessica Hall",
    email: "jessica.h@city.gov",
    staffId: "STAFF012",
    phone: "9876543221",
    password: "staff123",
    role: "staff"
  },
  {
    name: "Thomas Young",
    email: "thomas.y@city.gov",
    staffId: "STAFF013",
    phone: "9876543222",
    password: "staff123",
    role: "staff"
  },
  {
    name: "Samantha King",
    email: "samantha.k@city.gov",
    staffId: "STAFF014",
    phone: "9876543223",
    password: "staff123",
    role: "staff"
  },
  {
    name: "Charles Scott",
    email: "charles.s@city.gov",
    staffId: "STAFF015",
    phone: "9876543224",
    password: "staff123",
    role: "staff"
  }
];

const seedStaff = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/Webster_2025';
    console.log(`🔗 Connecting to MongoDB...`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all departments to assign randomly
    const departments = await Department.find({ isActive: true }).select('_id name');
    console.log(`📊 Found ${departments.length} departments`);

    if (departments.length === 0) {
      console.error('❌ No departments found. Please run department seeder first.');
      process.exit(1);
    }

    // Clear existing staff (optional - comment out if you want to keep existing)
    const deleteResult = await Staff.deleteMany({});
    console.log(`🗑️ Cleared ${deleteResult.deletedCount} existing staff members`);

    // Hash passwords and assign departments
    const staffToInsert = [];
    
    for (let i = 0; i < staffMembers.length; i++) {
      const staff = staffMembers[i];
      const hashedPassword = await bcrypt.hash(staff.password, 10);
      
      // Assign random department
      const randomDept = departments[Math.floor(Math.random() * departments.length)];
      
      staffToInsert.push({
        ...staff,
        password: hashedPassword,
        department: randomDept._id,
        isActive: true,
        createdAt: new Date()
      });
    }

    // Insert staff
    const result = await Staff.insertMany(staffToInsert);
    console.log(`✅ Inserted ${result.length} staff members`);

    // Display created staff
    console.log('\n📋 Created Staff Members:');
    result.forEach((staff, index) => {
      const dept = departments.find(d => d._id.equals(staff.department));
      console.log(`${index + 1}. ${staff.name} (${staff.staffId}) - ${dept?.name || 'No Dept'}`);
    });

    await mongoose.disconnect();
    console.log('\n🎉 Staff seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding staff:', error);
    process.exit(1);
  }
};

// Run the seeder
seedStaff();