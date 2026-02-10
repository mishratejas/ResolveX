import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Issue from '../src/models/UserComplaint.models.js';
import User from '../src/models/User.models.js';

dotenv.config();

// Prayagraj specific locations
const prayagrajLocations = [
  "Civil Lines, Prayagraj",
  "Allahabad University Campus",
  "Triveni Sangam Area",
  "Katra, Prayagraj",
  "George Town, Prayagraj",
  "Naini Industrial Area",
  "Daraganj, Prayagraj",
  "Khusrobagh, Prayagraj",
  "Muthiganj, Prayagraj",
  "Chowk, Prayagraj",
  "Kalyani Devi, Prayagraj",
  "Tagore Town, Prayagraj",
  "Ashok Nagar, Prayagraj",
  "Bharadwaj Puram, Prayagraj",
  "Kareli, Prayagraj",
  "Rajapur, Prayagraj",
  "Kydganj, Prayagraj",
  "Govindpur, Prayagraj",
  "Lukerganj, Prayagraj",
  "Jhusi, Prayagraj",
  "Nayapura, Prayagraj",
  "Kohnaur, Prayagraj",
  "Soraon, Prayagraj",
  "Handia, Prayagraj",
  "Phaphamau, Prayagraj"
];

// Complaints specific to Prayagraj with backend category values
const complaints = [
  // road (20 complaints)
  {
    title: "Large Potholes on Civil Lines Road",
    description: "Multiple deep potholes near Civil Lines crossing causing accidents. Several two-wheeler riders have fallen recently.",
    category: "road",
    location: "Civil Lines, Prayagraj",
    priority: "high"
  },
  {
    title: "Damaged Footpath near Allahabad University",
    description: "Footpath tiles broken near University main gate. Difficult for students and pedestrians to walk safely.",
    category: "road",
    location: "Allahabad University Campus",
    priority: "medium"
  },
  {
    title: "Road Sinking near Triveni Sangam",
    description: "Road near Triveni Sangam has started sinking due to poor drainage. Risk of complete road collapse.",
    category: "road",
    location: "Triveni Sangam Area",
    priority: "high"
  },
  {
    title: "No Street Lights on Katra Road",
    description: "Street lights not working on entire stretch of Katra Road for 2 weeks. Safety concern at night.",
    category: "road",
    location: "Katra, Prayagraj",
    priority: "high"
  },
  {
    title: "Broken Road Divider near George Town",
    description: "Concrete road divider damaged near George Town crossing. Causing traffic confusion.",
    category: "road",
    location: "George Town, Prayagraj",
    priority: "medium"
  },
  {
    title: "Waterlogged Road in Naini",
    description: "Road near Naini Industrial Area gets completely waterlogged during rain. Vehicles stuck frequently.",
    category: "road",
    location: "Naini Industrial Area",
    priority: "medium"
  },
  {
    title: "Damaged Bridge Railing Daraganj",
    description: "Bridge railing broken near Daraganj Ghat. Danger to pedestrians and vehicles.",
    category: "road",
    location: "Daraganj, Prayagraj",
    priority: "high"
  },
  {
    title: "Uneven Road in Khusrobagh",
    description: "Road surface extremely uneven causing vehicle damage. Needs urgent resurfacing.",
    category: "road",
    location: "Khusrobagh, Prayagraj",
    priority: "low"
  },
  {
    title: "Missing Manhole Cover Muthiganj",
    description: "Open manhole on main road. Several accidents narrowly avoided.",
    category: "road",
    location: "Muthiganj, Prayagraj",
    priority: "high"
  },
  {
    title: "Road Construction Debris Chowk",
    description: "Construction debris left on road for months. Blocking half the road.",
    category: "road",
    location: "Chowk, Prayagraj",
    priority: "medium"
  },
  {
    title: "Damaged Speed Breakers Kalyani Devi",
    description: "Speed breakers damaged causing vehicle undercarriage damage. Need proper maintenance.",
    category: "road",
    location: "Kalyani Devi, Prayagraj",
    priority: "low"
  },
  {
    title: "Roadside Trees Blocking Traffic Tagore Town",
    description: "Overgrown trees blocking road view and traffic flow. Need pruning.",
    category: "road",
    location: "Tagore Town, Prayagraj",
    priority: "medium"
  },
  {
    title: "Road Paint Faded Ashok Nagar",
    description: "Road markings completely faded causing traffic rule violations.",
    category: "road",
    location: "Ashok Nagar, Prayagraj",
    priority: "low"
  },
  {
    title: "Damaged Foot Overbridge Bharadwaj Puram",
    description: "Foot overbridge in poor condition. Risk of collapse during crowded hours.",
    category: "road",
    location: "Bharadwaj Puram, Prayagraj",
    priority: "high"
  },
  {
    title: "Illegal Roadside Constructions Kareli",
    description: "Illegal constructions blocking road width. Traffic congestion daily.",
    category: "road",
    location: "Kareli, Prayagraj",
    priority: "medium"
  },
  {
    title: "Damaged Road Signs Rajapur",
    description: "Traffic signs damaged or missing causing confusion among drivers.",
    category: "road",
    location: "Rajapur, Prayagraj",
    priority: "medium"
  },
  {
    title: "Road Subsidence Kydganj",
    description: "Road sinking near Kydganj crossing. Immediate attention needed.",
    category: "road",
    location: "Kydganj, Prayagraj",
    priority: "high"
  },
  {
    title: "Broken Sidewalk Tiles Govindpur",
    description: "Sidewalk tiles broken causing pedestrian accidents.",
    category: "road",
    location: "Govindpur, Prayagraj",
    priority: "low"
  },
  {
    title: "Road Flooding Lukerganj",
    description: "Road floods even with light rain. Drainage system failure.",
    category: "road",
    location: "Lukerganj, Prayagraj",
    priority: "medium"
  },
  {
    title: "Damaged Railway Crossing Jhusi",
    description: "Railway crossing barrier not working properly. Safety hazard.",
    category: "road",
    location: "Jhusi, Prayagraj",
    priority: "high"
  },

  // sanitation (20 complaints)
  {
    title: "Garbage Overflow in Civil Lines",
    description: "Garbage bins overflowing for days. Unbearable smell and health hazard.",
    category: "sanitation",
    location: "Civil Lines, Prayagraj",
    priority: "high"
  },
  {
    title: "Illegal Dumping near University",
    description: "Construction waste illegally dumped near university campus.",
    category: "sanitation",
    location: "Allahabad University Campus",
    priority: "medium"
  },
  {
    title: "Sewage Overflow Sangam Area",
    description: "Sewage lines overflowing near Triveni Sangam. Polluting holy river area.",
    category: "sanitation",
    location: "Triveni Sangam Area",
    priority: "high"
  },
  {
    title: "Stagnant Water Breeding Mosquitoes Katra",
    description: "Stagnant water in vacant plots causing mosquito breeding.",
    category: "sanitation",
    location: "Katra, Prayagraj",
    priority: "medium"
  },
  {
    title: "Biomedical Waste Dumping George Town",
    description: "Hospital waste found dumped in residential area.",
    category: "sanitation",
    location: "George Town, Prayagraj",
    priority: "high"
  },
  {
    title: "Garbage Not Collected Naini",
    description: "Garbage collection stopped for 10 days in Naini area.",
    category: "sanitation",
    location: "Naini Industrial Area",
    priority: "medium"
  },
  {
    title: "Public Toilet Maintenance Daraganj",
    description: "Public toilets near ghat in terrible condition.",
    category: "sanitation",
    location: "Daraganj, Prayagraj",
    priority: "medium"
  },
  {
    title: "Plastic Waste Burning Khusrobagh",
    description: "Plastic waste being burned causing air pollution.",
    category: "sanitation",
    location: "Khusrobagh, Prayagraj",
    priority: "high"
  },
  {
    title: "Animal Carcass Disposal Muthiganj",
    description: "Dead animals not being removed for days.",
    category: "sanitation",
    location: "Muthiganj, Prayagraj",
    priority: "medium"
  },
  {
    title: "Drain Blockage Chowk",
    description: "Major drainage blockage causing waterlogging.",
    category: "sanitation",
    location: "Chowk, Prayagraj",
    priority: "high"
  },
  {
    title: "Garbage Bins Missing Kalyani Devi",
    description: "No garbage bins in the entire colony.",
    category: "sanitation",
    location: "Kalyani Devi, Prayagraj",
    priority: "low"
  },
  {
    title: "Sewage Treatment Plant Overflow",
    description: "Sewage treatment plant overflowing into residential area.",
    category: "sanitation",
    location: "Tagore Town, Prayagraj",
    priority: "high"
  },
  {
    title: "Medical Waste Ashok Nagar",
    description: "Used syringes and medical waste found in park.",
    category: "sanitation",
    location: "Ashok Nagar, Prayagraj",
    priority: "high"
  },
  {
    title: "Industrial Waste Dumping Bharadwaj Puram",
    description: "Industrial waste being dumped in residential area.",
    category: "sanitation",
    location: "Bharadwaj Puram, Prayagraj",
    priority: "high"
  },
  {
    title: "Plastic Pollution Kareli",
    description: "Plastic waste choking drains and waterways.",
    category: "sanitation",
    location: "Kareli, Prayagraj",
    priority: "medium"
  },
  {
    title: "Garbage Burning Rajapur",
    description: "Regular garbage burning causing air pollution.",
    category: "sanitation",
    location: "Rajapur, Prayagraj",
    priority: "medium"
  },
  {
    title: "Public Park Maintenance Kydganj",
    description: "Parks filled with litter and garbage.",
    category: "sanitation",
    location: "Kydganj, Prayagraj",
    priority: "low"
  },
  {
    title: "Drain Cleaning Needed Govindpur",
    description: "Drains not cleaned before monsoon.",
    category: "sanitation",
    location: "Govindpur, Prayagraj",
    priority: "medium"
  },
  {
    title: "Community Toilet Issue Lukerganj",
    description: "Community toilet blocked and unusable.",
    category: "sanitation",
    location: "Lukerganj, Prayagraj",
    priority: "medium"
  },
  {
    title: "Waste Segregation Not Happening Jhusi",
    description: "No waste segregation at source being done.",
    category: "sanitation",
    location: "Jhusi, Prayagraj",
    priority: "low"
  },

  // water (15 complaints)
  {
    title: "No Water Supply Civil Lines",
    description: "No water supply for 3 days in Civil Lines area.",
    category: "water",
    location: "Civil Lines, Prayagraj",
    priority: "high"
  },
  {
    title: "Contaminated Water University Area",
    description: "Tap water has strange odor and color.",
    category: "water",
    location: "Allahabad University Campus",
    priority: "high"
  },
  {
    title: "Water Leakage Sangam Road",
    description: "Major water pipeline leakage wasting water.",
    category: "water",
    location: "Triveni Sangam Area",
    priority: "medium"
  },
  {
    title: "Low Water Pressure Katra",
    description: "Very low water pressure on upper floors.",
    category: "water",
    location: "Katra, Prayagraj",
    priority: "medium"
  },
  {
    title: "Water Tank Contamination George Town",
    description: "Overhead water tank contamination reported.",
    category: "water",
    location: "George Town, Prayagraj",
    priority: "high"
  },
  {
    title: "Irregular Water Supply Naini",
    description: "Water supply timing not followed.",
    category: "water",
    location: "Naini Industrial Area",
    priority: "medium"
  },
  {
    title: "Water Pipe Burst Daraganj",
    description: "Water main pipe burst flooding streets.",
    category: "water",
    location: "Daraganj, Prayagraj",
    priority: "high"
  },
  {
    title: "Hand Pump Not Working Khusrobagh",
    description: "Public hand pump not working for weeks.",
    category: "water",
    location: "Khusrobagh, Prayagraj",
    priority: "low"
  },
  {
    title: "Water Quality Testing Needed Muthiganj",
    description: "Water quality suspicious, needs testing.",
    category: "water",
    location: "Muthiganj, Prayagraj",
    priority: "medium"
  },
  {
    title: "Water Supply Timing Issue Chowk",
    description: "Water supply only at odd hours.",
    category: "water",
    location: "Chowk, Prayagraj",
    priority: "low"
  },
  {
    title: "Borewell Water Contamination Kalyani Devi",
    description: "Borewell water turning yellow.",
    category: "water",
    location: "Kalyani Devi, Prayagraj",
    priority: "medium"
  },
  {
    title: "Water Tank Cleaning Tagore Town",
    description: "Water tank not cleaned for years.",
    category: "water",
    location: "Tagore Town, Prayagraj",
    priority: "medium"
  },
  {
    title: "Water Pipeline Theft Ashok Nagar",
    description: "Water pipeline parts stolen.",
    category: "water",
    location: "Ashok Nagar, Prayagraj",
    priority: "high"
  },
  {
    title: "Water Purification Plant Issue Bharadwaj Puram",
    description: "Water purification plant not functioning.",
    category: "water",
    location: "Bharadwaj Puram, Prayagraj",
    priority: "high"
  },
  {
    title: "Groundwater Depletion Kareli",
    description: "Groundwater level dropping rapidly.",
    category: "water",
    location: "Kareli, Prayagraj",
    priority: "low"
  },

  // electricity (15 complaints)
  {
    title: "Power Cut Civil Lines",
    description: "Frequent power cuts without notice.",
    category: "electricity",
    location: "Civil Lines, Prayagraj",
    priority: "high"
  },
  {
    title: "Street Lights Not Working University",
    description: "No street lights on campus roads.",
    category: "electricity",
    location: "Allahabad University Campus",
    priority: "medium"
  },
  {
    title: "Transformer Fault Sangam Area",
    description: "Transformer making strange noise, risk of fire.",
    category: "electricity",
    location: "Triveni Sangam Area",
    priority: "high"
  },
  {
    title: "Hanging Wires Katra",
    description: "Electric wires hanging low, dangerous.",
    category: "electricity",
    location: "Katra, Prayagraj",
    priority: "high"
  },
  {
    title: "Voltage Fluctuation George Town",
    description: "Voltage fluctuation damaging appliances.",
    category: "electricity",
    location: "George Town, Prayagraj",
    priority: "medium"
  },
  {
    title: "Electric Pole Damaged Naini",
    description: "Electric pole leaning dangerously.",
    category: "electricity",
    location: "Naini Industrial Area",
    priority: "high"
  },
  {
    title: "Meter Reading Issue Daraganj",
    description: "Incorrect electricity meter readings.",
    category: "electricity",
    location: "Daraganj, Prayagraj",
    priority: "low"
  },
  {
    title: "Illegal Electricity Connection Khusrobagh",
    description: "Illegal connections causing overload.",
    category: "electricity",
    location: "Khusrobagh, Prayagraj",
    priority: "medium"
  },
  {
    title: "Electricity Theft Muthiganj",
    description: "Massive electricity theft in area.",
    category: "electricity",
    location: "Muthiganj, Prayagraj",
    priority: "high"
  },
  {
    title: "Distribution Box Open Chowk",
    description: "Electricity distribution box left open.",
    category: "electricity",
    location: "Chowk, Prayagraj",
    priority: "high"
  },
  {
    title: "Substation Maintenance Kalyani Devi",
    description: "Substation needs urgent maintenance.",
    category: "electricity",
    location: "Kalyani Devi, Prayagraj",
    priority: "medium"
  },
  {
    title: "Power Surge Tagore Town",
    description: "Frequent power surges damaging equipment.",
    category: "electricity",
    location: "Tagore Town, Prayagraj",
    priority: "medium"
  },
  {
    title: "Street Light Timing Ashok Nagar",
    description: "Street lights not turning on at proper time.",
    category: "electricity",
    location: "Ashok Nagar, Prayagraj",
    priority: "low"
  },
  {
    title: "Transformer Overheating Bharadwaj Puram",
    description: "Transformer overheating during peak hours.",
    category: "electricity",
    location: "Bharadwaj Puram, Prayagraj",
    priority: "high"
  },
  {
    title: "Electric Bill Issue Kareli",
    description: "Abnormally high electricity bills.",
    category: "electricity",
    location: "Kareli, Prayagraj",
    priority: "low"
  },

  // security (10 complaints)
  {
    title: "Street Crime Civil Lines",
    description: "Increase in chain snatching incidents.",
    category: "security",
    location: "Civil Lines, Prayagraj",
    priority: "high"
  },
  {
    title: "No Police Patrolling University",
    description: "Lack of police presence on campus.",
    category: "security",
    location: "Allahabad University Campus",
    priority: "medium"
  },
  {
    title: "Theft Cases Sangam Area",
    description: "Multiple theft cases reported near ghats.",
    category: "security",
    location: "Triveni Sangam Area",
    priority: "high"
  },
  {
    title: "Drug Peddling Katra",
    description: "Drug peddling activities observed.",
    category: "security",
    location: "Katra, Prayagraj",
    priority: "high"
  },
  {
    title: "Eve Teasing George Town",
    description: "Eve teasing complaints increasing.",
    category: "security",
    location: "George Town, Prayagraj",
    priority: "medium"
  },
  {
    title: "Industrial Security Naini",
    description: "Poor security in industrial area.",
    category: "security",
    location: "Naini Industrial Area",
    priority: "medium"
  },
  {
    title: "House Break-ins Daraganj",
    description: "Series of house break-ins reported.",
    category: "security",
    location: "Daraganj, Prayagraj",
    priority: "high"
  },
  {
    title: "Gang Activity Khusrobagh",
    description: "Gang activities disturbing peace.",
    category: "security",
    location: "Khusrobagh, Prayagraj",
    priority: "medium"
  },
  {
    title: "Cyber Crime Muthiganj",
    description: "Online fraud cases increasing.",
    category: "security",
    location: "Muthiganj, Prayagraj",
    priority: "low"
  },
  {
    title: "Vehicle Theft Chowk",
    description: "Motorcycle thefts on rise.",
    category: "security",
    location: "Chowk, Prayagraj",
    priority: "medium"
  },

  // transport (10 complaints)
  {
    title: "Traffic Congestion Civil Lines",
    description: "Heavy traffic congestion during peak hours.",
    category: "transport",
    location: "Civil Lines, Prayagraj",
    priority: "medium"
  },
  {
    title: "No Bus Service University",
    description: "Irregular bus service to university.",
    category: "transport",
    location: "Allahabad University Campus",
    priority: "medium"
  },
  {
    title: "Auto Rickshaw Overcharging Sangam",
    description: "Auto drivers charging exorbitant fares.",
    category: "transport",
    location: "Triveni Sangam Area",
    priority: "low"
  },
  {
    title: "Parking Issue Katra",
    description: "No proper parking facilities available.",
    category: "transport",
    location: "Katra, Prayagraj",
    priority: "medium"
  },
  {
    title: "Road Accident Black Spot George Town",
    description: "Multiple accidents at same spot.",
    category: "transport",
    location: "George Town, Prayagraj",
    priority: "high"
  },
  {
    title: "Public Transport Condition Naini",
    description: "Buses in poor condition, unsafe.",
    category: "transport",
    location: "Naini Industrial Area",
    priority: "medium"
  },
  {
    title: "Traffic Signal Not Working Daraganj",
    description: "Traffic signal not functioning.",
    category: "transport",
    location: "Daraganj, Prayagraj",
    priority: "high"
  },
  {
    title: "Illegal Parking Khusrobagh",
    description: "Vehicles parked illegally blocking roads.",
    category: "transport",
    location: "Khusrobagh, Prayagraj",
    priority: "low"
  },
  {
    title: "School Bus Safety Muthiganj",
    description: "School buses overcrowded, unsafe.",
    category: "transport",
    location: "Muthiganj, Prayagraj",
    priority: "high"
  },
  {
    title: "Rickshaw Stand Issue Chowk",
    description: "Rickshaw stand causing traffic jam.",
    category: "transport",
    location: "Chowk, Prayagraj",
    priority: "medium"
  },

  // other (10 complaints)
  {
    title: "Noise Pollution Civil Lines",
    description: "Loudspeakers beyond permitted hours.",
    category: "other",
    location: "Civil Lines, Prayagraj",
    priority: "low"
  },
  {
    title: "Stray Dog Menace University",
    description: "Stray dogs attacking students.",
    category: "other",
    location: "Allahabad University Campus",
    priority: "medium"
  },
  {
    title: "Religious Noise Sangam",
    description: "Religious ceremonies causing noise pollution.",
    category: "other",
    location: "Triveni Sangam Area",
    priority: "low"
  },
  {
    title: "Monkey Menace Katra",
    description: "Monkeys entering houses, causing damage.",
    category: "other",
    location: "Katra, Prayagraj",
    priority: "medium"
  },
  {
    title: "Illegal Hawkers George Town",
    description: "Illegal street vendors blocking roads.",
    category: "other",
    location: "George Town, Prayagraj",
    priority: "low"
  },
  {
    title: "Air Pollution Naini",
    description: "Industrial pollution affecting air quality.",
    category: "other",
    location: "Naini Industrial Area",
    priority: "high"
  },
  {
    title: "Cattle on Roads Daraganj",
    description: "Stray cattle blocking traffic.",
    category: "other",
    location: "Daraganj, Prayagraj",
    priority: "medium"
  },
  {
    title: "Public Park Maintenance Khusrobagh",
    description: "Parks not maintained, equipment broken.",
    category: "other",
    location: "Khusrobagh, Prayagraj",
    priority: "low"
  },
  {
    title: "Graffiti on Public Property Muthiganj",
    description: "Public walls defaced with graffiti.",
    category: "other",
    location: "Muthiganj, Prayagraj",
    priority: "low"
  },
  {
    title: "Illegal Construction Chowk",
    description: "Illegal construction violating norms.",
    category: "other",
    location: "Chowk, Prayagraj",
    priority: "medium"
  }
];

const seedComplaints = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/webster';
    console.log(`🔗 Connecting to MongoDB...`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find({ role: 'user' }).select('_id name email');
    console.log(`📊 Found ${users.length} users`);
    
    // Get specific user IDs you mentioned
    const userIds = [
      "69516b9124cf777171830835", // Rajesh Kumar
      "69516b9124cf777171830836", // Priya Sharma
      "69516b9124cf777171830837", // Amit Patel
      "69516b9124cf777171830838", // Sneha Gupta
      "69516b9124cf777171830839", // Vikram Singh
      "69516b9124cf77717183083a", // Anjali Reddy
      "69516b9124cf77717183083b", // Rahul Verma
      "69516e5382587c58dade85fd"  // Tejas Mishra
    ];

    // Clear existing complaints
    const deleteResult = await Issue.deleteMany({});
    console.log(`🗑️ Cleared ${deleteResult.deletedCount} existing complaints`);

    // Create 100-130 complaints
    const complaintsToInsert = [];
    const statuses = ['pending', 'in-progress', 'resolved'];
    const priorities = ['low', 'medium', 'high'];
    
    // Create additional random complaints to reach 100-130
    const totalComplaints = 110 + Math.floor(Math.random() * 20); // 110-130 complaints
    
    // Use provided complaints first
    for (let i = 0; i < Math.min(complaints.length, totalComplaints); i++) {
      const complaint = complaints[i];
      
      // Assign random user from the specific IDs
      const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
      const randomUser = users.find(u => u._id.toString() === randomUserId);
      
      if (!randomUser) {
        console.log(`User with ID ${randomUserId} not found, skipping complaint`);
        continue;
      }

      // Random status and priority if not specified
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const priority = complaint.priority || priorities[Math.floor(Math.random() * priorities.length)];
      
      // Random vote count (0-50)
      const voteCount = Math.floor(Math.random() * 50);
      
      // Random creation date (within last 6 months)
      const daysAgo = Math.floor(Math.random() * 180);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const updatedAt = new Date(createdAt.getTime() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));
      
      complaintsToInsert.push({
        user: randomUser._id,
        title: complaint.title,
        description: complaint.description,
        category: complaint.category,
        location: complaint.location,
        priority: priority,
        status: status,
        voteCount: voteCount,
        images: [],
        comments: [],
        createdAt: createdAt,
        updatedAt: updatedAt
      });
    }

    // Create additional random complaints if needed
    if (complaintsToInsert.length < totalComplaints) {
      const additionalCount = totalComplaints - complaintsToInsert.length;
      console.log(`Creating ${additionalCount} additional random complaints`);
      
      const categories = ['road', 'sanitation', 'water', 'electricity', 'security', 'transport', 'other'];
      
      const complaintTemplates = [
        "Issue with {category} in {location}",
        "Problems with {category} services in {location}",
        "Need attention for {category} in {location}",
        "{category} maintenance required in {location}",
        "Complaint regarding {category} in {location}"
      ];
      
      // Map for display purposes
      const categoryDisplay = {
        'road': 'road & infrastructure',
        'sanitation': 'sanitation',
        'water': 'water supply',
        'electricity': 'electricity',
        'security': 'security',
        'transport': 'transport',
        'other': 'other issues'
      };
      
      for (let i = 0; i < additionalCount; i++) {
        const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
        const randomUser = users.find(u => u._id.toString() === randomUserId);
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const randomLocation = prayagrajLocations[Math.floor(Math.random() * prayagrajLocations.length)];
        const template = complaintTemplates[Math.floor(Math.random() * complaintTemplates.length)];
        
        const title = template
          .replace('{category}', categoryDisplay[randomCategory])
          .replace('{location}', randomLocation.split(',')[0]);
        
        const description = `There is an ongoing issue with ${categoryDisplay[randomCategory]} services in ${randomLocation}. This problem has been persisting for some time and needs immediate attention from the authorities. Residents are facing difficulties due to this issue.`;
        
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const voteCount = Math.floor(Math.random() * 50);
        
        const daysAgo = Math.floor(Math.random() * 180);
        const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        const updatedAt = new Date(createdAt.getTime() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));
        
        if (randomUser) {
          complaintsToInsert.push({
            user: randomUser._id,
            title: title,
            description: description,
            category: randomCategory, // Use backend enum value
            location: randomLocation,
            priority: priority,
            status: status,
            voteCount: voteCount,
            images: [],
            comments: [],
            createdAt: createdAt,
            updatedAt: updatedAt
          });
        }
      }
    }

    // Insert complaints
    const result = await Issue.insertMany(complaintsToInsert);
    console.log(`✅ Inserted ${result.length} complaints`);

    // Display statistics
    console.log('\n📊 Complaint Statistics:');
    
    const byStatus = result.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});
    
    const byCategory = result.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {});
    
    const byPriority = result.reduce((acc, c) => {
      acc[c.priority] = (acc[c.priority] || 0) + 1;
      return acc;
    }, {});
    
    console.log('By Status:', byStatus);
    console.log('By Category:', byCategory);
    console.log('By Priority:', byPriority);
    
    // User-wise statistics
    const userStats = {};
    result.forEach(complaint => {
      const user = users.find(u => u._id.toString() === complaint.user.toString());
      if (user) {
        const userName = user.name;
        userStats[userName] = (userStats[userName] || 0) + 1;
      }
    });
    
    console.log('\n👤 Complaints by User:');
    Object.entries(userStats).forEach(([user, count]) => {
      console.log(`  ${user}: ${count} complaints`);
    });

    await mongoose.disconnect();
    console.log('\n🎉 Complaints seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding complaints:', error);
    process.exit(1);
  }
};

// Run the seeder
seedComplaints();