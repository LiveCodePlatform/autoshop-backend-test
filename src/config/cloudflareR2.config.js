import { S3Client } from "@aws-sdk/client-s3";

// Ensure all required environment variables are present
const requiredEnvs = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
];

for (const env of requiredEnvs) {
  if (!process.env[env]) {
    console.warn(`Warning: Missing environment variable ${env} for Cloudflare R2.`);
  }
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export default s3Client;
