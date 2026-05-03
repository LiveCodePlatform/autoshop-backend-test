import s3Client from "../../config/cloudflareR2.config.js";
import { Upload } from "@aws-sdk/lib-storage";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

/**
 * Uploads a file buffer to Cloudflare R2
 * @param {Object} file - Multer file object
 * @param {string} folderName - Folder name (e.g., 'inventory')
 * @returns {Promise<{url: string, spaceKey: string}>}
 */
export const uploadImageToR2 = async (file, folderName) => {
  if (!file || !file.buffer) {
    throw new Error("Invalid file buffer provided for upload.");
  }

  const fileExtension = file.originalname.split(".").pop();
  const uniqueFileName = `${uuidv4()}-${Date.now()}.${fileExtension}`;
  const key = folderName ? `${folderName}/${uniqueFileName}` : uniqueFileName;

  const uploadParams = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    const uploader = new Upload({
      client: s3Client,
      params: uploadParams,
    });

    await uploader.done();

    // Construct the public URL
    const publicUrl = process.env.R2_PUBLIC_URL;
    const url = publicUrl 
      ? `${publicUrl.replace(/\/$/, '')}/${key}` 
      : `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    return {
      url,
      spaceKey: key,
    };
  } catch (err) {
    console.error("Cloudflare R2 upload error:", err);
    throw new Error(`Cloudflare R2 upload failed: ${err.message}`);
  }
};

/**
 * Deletes an object from Cloudflare R2
 * @param {string} spaceKey - The key of the object to delete
 */
export const deleteImageFromR2 = async (spaceKey) => {
  if (!spaceKey) return;

  const deleteParams = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: spaceKey,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(deleteParams));
  } catch (err) {
    console.error("Cloudflare R2 delete error:", err);
  }
};
