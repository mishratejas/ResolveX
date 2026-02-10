import mongoose from 'mongoose';
import Department from '../src/models/Department.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const departments = [
  { 
    name: "Water Supply", 
    category: "utilities",
    description: "Responsible for water distribution, maintenance, and quality control",
    contactEmail: "water.supply@city.gov",
    contactPhone: "5550101001"  // Changed to 10 digits: "555" + "010" + "1001"
  },
  { 
    name: "Electricity", 
    category: "utilities",
    description: "Manages electrical grid, power distribution, and outage repairs",
    contactEmail: "electricity@city.gov",
    contactPhone: "5550101002"
  },
  { 
    name: "Road Maintenance", 
    category: "infrastructure",
    description: "Responsible for road repairs, construction, and maintenance",
    contactEmail: "road.maintenance@city.gov",
    contactPhone: "5550101003"
  },
  { 
    name: "Sanitation", 
    category: "infrastructure",
    description: "Garbage collection, recycling, and waste management services",
    contactEmail: "sanitation@city.gov",
    contactPhone: "5550101004"
  },
  { 
    name: "Police", 
    category: "public-safety",
    description: "Law enforcement and public safety services",
    contactEmail: "police@city.gov",
    contactPhone: "5550101005"
  },
  { 
    name: "Fire Department", 
    category: "public-safety",
    description: "Fire prevention, emergency response, and rescue services",
    contactEmail: "fire.department@city.gov",
    contactPhone: "5550101006"
  },
  { 
    name: "City Administration", 
    category: "administrative",
    description: "General administration and city management",
    contactEmail: "admin@city.gov",
    contactPhone: "5550101007"
  },
  { 
    name: "Health Services", 
    category: "health",
    description: "Public health services, clinics, and medical facilities",
    contactEmail: "health.services@city.gov",
    contactPhone: "5550101008"
  },
  { 
    name: "Education Department", 
    category: "education",
    description: "Schools, educational programs, and youth services",
    contactEmail: "education@city.gov",
    contactPhone: "5550101009"
  },
  { 
    name: "Public Works", 
    category: "other",
    description: "General public works and infrastructure projects",
    contactEmail: "public.works@city.gov",
    contactPhone: "5550101010"
  }
];

const seedDepartments = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database-name';
    console.log(`🔗 Connecting to MongoDB: ${mongoUri.split('@')[1] || mongoUri}`);
    
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB');
    
    // Clear existing departments
    const deleteResult = await Department.deleteMany({});
    console.log(`🗑️ Cleared ${deleteResult.deletedCount} existing departments`);
    
    // Insert new departments
    const insertedDepartments = [];
    for (const dept of departments) {
      const department = new Department({
        name: dept.name,
        category: dept.category,
        description: dept.description,
        contactEmail: dept.contactEmail,
        contactPhone: dept.contactPhone,
        isActive: true,
        createdAt: new Date()
      });
      
      await department.save();
      insertedDepartments.push(department);
      console.log(`✅ Added department: ${dept.name} (${dept.category})`);
    }
    
    console.log('\n🎉 All departments seeded successfully!');
    console.log(`📊 Total departments: ${insertedDepartments.length}`);
    
    // Display the created departments with their IDs
    console.log('\n📋 Created Departments:');
    insertedDepartments.forEach(dept => {
      console.log(`   ${dept.name.padEnd(25)} - ID: ${dept._id}`);
    });
    
    console.log('\n📝 You can now use these IDs in staff registration');
    console.log('\n🔗 Test API endpoint: GET /api/staff/departments');
    
    // Don't forget to disconnect
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding departments:', error.message);
    console.error('Validation errors:', error.errors);
    process.exit(1);
  }
};

// Run the seeder
seedDepartments();