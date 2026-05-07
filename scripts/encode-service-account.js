#!/usr/bin/env node

/**
 * Helper script to convert service-account-key.json to base64
 * for use in Vercel environment variables
 * 
 * Usage: node scripts/encode-service-account.js
 */

import fs from 'fs';
import path from 'path';

const SERVICE_ACCOUNT_PATH = path.resolve(process.cwd(), 'service-account-key.json');

try {
  // Check if file exists
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('❌ Error: service-account-key.json not found in project root');
    console.error('   Please ensure the file exists before running this script.');
    process.exit(1);
  }

  // Read and validate JSON
  const fileContent = fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8');
  
  try {
    JSON.parse(fileContent); // Validate it's valid JSON
  } catch (error) {
    console.error('❌ Error: service-account-key.json is not valid JSON');
    console.error('   Please check the file format.');
    process.exit(1);
  }

  // Convert to base64
  const base64Encoded = Buffer.from(fileContent).toString('base64');

  console.log('\n✅ Successfully encoded service-account-key.json to base64\n');
  console.log('━'.repeat(80));
  console.log('Copy the following value and add it to Vercel as GOOGLE_SERVICE_ACCOUNT_KEY:');
  console.log('━'.repeat(80));
  console.log('\n' + base64Encoded + '\n');
  console.log('━'.repeat(80));
  console.log('\nSteps to add to Vercel:');
  console.log('1. Go to your Vercel project → Settings → Environment Variables');
  console.log('2. Add a new variable:');
  console.log('   Name: GOOGLE_SERVICE_ACCOUNT_KEY');
  console.log('   Value: <paste the base64 string above>');
  console.log('3. Select environments: Production, Preview, Development');
  console.log('4. Click "Save"\n');

} catch (error) {
  console.error('❌ Error reading service-account-key.json:', error.message);
  process.exit(1);
}
