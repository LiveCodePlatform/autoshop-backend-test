import s3Client from "../../config/cloudflareR2.config.js";
import { Upload } from "@aws-sdk/lib-storage";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

export const uploadImageToR2 = async (file, folderName) => {
  if (
    !file ||
    !file.buffer ||
    !Buffer.isBuffer(file.buffer) ||
    file.buffer.length === 0
  ) {
    throw new Error("Invalid or empty file buffer provided for upload.");
  }
  if (!file.originalname) {
    throw new Error("File originalname is missing.");
  }
  if (!file.mimetype) {
    throw new Error("File mimetype is missing.");
  }

  const fileExtension = file.originalname.split(".").pop();
  const uniqueFileName = `${uuidv4()}-${Date.now()}.${fileExtension}`;
  const key = folderName ? `${folderName}/${uniqueFileName}` : uniqueFileName;

  const uploadParams = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // Note: Cloudflare R2 handles public access via bucket policies/custom domains,
    // so ACL: "public-read" is usually not needed or supported in the same way as S3.
  };

  try {
    const uploader = new Upload({
      client: s3Client,
      params: uploadParams,
    });

    uploader.on("httpUploadProgress", (progress) => {
      console.log("Cloudflare R2 upload progress:", progress);
    });

    const data = await uploader.done(); // Execute the upload

    // Cloudflare R2 requires a public domain (.r2.dev or custom) to access files publicly.
    const publicUrl = process.env.R2_PUBLIC_URL; 
    const url = publicUrl ? `${publicUrl.replace(/\/$/, '')}/${key}` : `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    return {
      url,
      spaceKey: key,
    };
  } catch (err) {
    console.error("Cloudflare R2 upload error:", err);
    throw new Error(
      `Cloudflare R2 upload failed: ${err.message || "Unknown error"}`
    );
  }
};

export const deleteImageFromR2 = async (spaceKey) => {
  if (typeof spaceKey !== "string" || spaceKey.trim() === "") {
    throw new Error("A valid spaceKey must be provided for deletion.");
  }

  const deleteParams = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: spaceKey,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(deleteParams));
    console.log("Deleted image from Cloudflare R2.", { spaceKey });
  } catch (err) {
    console.error("Cloudflare R2 delete error:", err);
    throw new Error(
      `Cloudflare R2 delete failed: ${err.message || "Unknown error"}`
    );
  }
};
