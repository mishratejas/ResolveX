import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();
const execAsync = promisify(exec);

const seeders = [
  'seedStaff.js',
  'seedUsers.js', 
  'seedComplaints.js'
];

const runSeeder = async (seederFile) => {
  console.log(`\n🚀 Running ${seederFile}...`);
  console.log('='.repeat(50));
  
  try {
    const { stdout, stderr } = await execAsync(`node seeders/${seederFile}`);
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log(`✅ ${seederFile} completed successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ Error running ${seederFile}:`, error.message);
    return false;
  }
};

const seedAll = async () => {
  console.log('🎯 STARTING COMPLETE DATABASE SEEDING');
  console.log('='.repeat(50));
  
  let successCount = 0;
  
  for (const seeder of seeders) {
    const success = await runSeeder(seeder);
    if (success) successCount++;
    
    // Wait 1 second between seeders
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 SEEDING COMPLETE: ${successCount}/${seeders.length} successful`);
  
  if (successCount === seeders.length) {
    console.log('🎉 All seeders ran successfully!');
  } else {
    console.log('⚠️ Some seeders failed. Check the logs above.');
  }
  
  process.exit(successCount === seeders.length ? 0 : 1);
};

// Run all seeders
seedAll();