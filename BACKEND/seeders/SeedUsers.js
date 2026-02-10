import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.models.js';

dotenv.config();

const users = [
  {
    name: "Rajesh Kumar",
    email: "rajesh@gmail.com",
    phone: "9876543201",
    password: "user123",
    role: "user",
    street: "123 Main Street",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    profileImage: null
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@gmail.com",
    phone: "9876543202",
    password: "user123",
    role: "user",
    street: "456 Park Avenue",
    city: "Delhi",
    state: "Delhi",
    pincode: "110001",
    profileImage: null
  },
  {
    name: "Amit Patel",
    email: "amit.patel@gmail.com",
    phone: "9876543203",
    password: "user123",
    role: "user",
    street: "789 Gandhi Road",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380001",
    profileImage: null
  },
  {
    name: "Sneha Gupta",
    email: "sneha.gupta@gmail.com",
    phone: "9876543204",
    password: "user123",
    role: "user",
    street: "101 Lotus Colony",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560001",
    profileImage: null
  },
  {
    name: "Vikram Singh",
    email: "vikram.singh@gmail.com",
    phone: "9876543205",
    password: "user123",
    role: "user",
    street: "202 Rose Garden",
    city: "Chandigarh",
    state: "Punjab",
    pincode: "160001",
    profileImage: null
  },
  {
    name: "Anjali Reddy",
    email: "anjali.reddy@gmail.com",
    phone: "9876543206",
    password: "user123",
    role: "user",
    street: "303 Hillside Road",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500001",
    profileImage: null
  },
  {
    name: "Rahul Verma",
    email: "rahul.verma@gmail.com",
    phone: "9876543207",
    password: "user123",
    role: "user",
    street: "404 River View",
    city: "Kolkata",
    state: "West Bengal",
    pincode: "700001",
    profileImage: null
  },
  {
    name: "Pooja Mehta",
    email: "pooja.mehta@gmail.com",
    phone: "9876543208",
    password: "user123",
    role: "user",
    street: "505 Sky Apartments",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600001",
    profileImage: null
  },
  {
    name: "Sanjay Joshi",
    email: "sanjay.joshi@gmail.com",
    phone: "9876543209",
    password: "user123",
    role: "user",
    street: "606 Green Valley",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
    profileImage: null
  },
  {
    name: "Neha Kapoor",
    email: "neha.kapoor@gmail.com",
    phone: "9876543210",
    password: "user123",
    role: "user",
    street: "707 Royal Enclave",
    city: "Jaipur",
    state: "Rajasthan",
    pincode: "302001",
    profileImage: null
  },
  {
    name: "Arun Malhotra",
    email: "arun.malhotra@gmail.com",
    phone: "9876543211",
    password: "user123",
    role: "user",
    street: "808 Tech Park",
    city: "Gurgaon",
    state: "Haryana",
    pincode: "122001",
    profileImage: null
  },
  {
    name: "Divya Nair",
    email: "divya.nair@gmail.com",
    phone: "9876543212",
    password: "user123",
    role: "user",
    street: "909 Coastal Road",
    city: "Goa",
    state: "Goa",
    pincode: "403001",
    profileImage: null
  },
  {
    name: "Karan Sharma",
    email: "karan.sharma@gmail.com",
    phone: "9876543213",
    password: "user123",
    role: "user",
    street: "1010 Mountain View",
    city: "Shimla",
    state: "Himachal Pradesh",
    pincode: "171001",
    profileImage: null
  },
  {
    name: "Mona Das",
    email: "mona.das@gmail.com",
    phone: "9876543214",
    password: "user123",
    role: "user",
    street: "1111 Lake City",
    city: "Bhopal",
    state: "Madhya Pradesh",
    pincode: "462001",
    profileImage: null
  },
  {
    name: "Rohan Menon",
    email: "rohan.menon@gmail.com",
    phone: "9876543215",
    password: "user123",
    role: "user",
    street: "1212 Sunrise Apartments",
    city: "Kochi",
    state: "Kerala",
    pincode: "682001",
    profileImage: null
  }
];

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/Webster_2025';
    console.log(`🔗 Connecting to MongoDB...`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing users (optional)
    const deleteResult = await User.deleteMany({ role: 'user' });
    console.log(`🗑️ Cleared ${deleteResult.deletedCount} existing users`);

    // Hash passwords
    const usersToInsert = [];
    
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      usersToInsert.push({
        ...user,
        password: hashedPassword,
        isActive: true,
        createdAt: new Date()
      });
    }

    // Insert users
    const result = await User.insertMany(usersToInsert);
    console.log(`✅ Inserted ${result.length} users`);

    // Display created users
    console.log('\n📋 Created Users:');
    result.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} - ${user.email} - ${user.city}`);
    });

    await mongoose.disconnect();
    console.log('\n🎉 Users seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

// Run the seeder
seedUsers();