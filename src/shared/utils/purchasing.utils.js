/**
 * Purchasing Utility Functions
 * Pure utility functions for purchasing-related operations
 */

/**
 * Generate PO number
 * Format: PO-YYYY-MM-DD-NNNNNN (e.g., PO-2024-01-14-000001)
 * 
 * @param {Object} PurchasingModel - The Purchasing mongoose model
 * @returns {Promise<string>} Generated PO number
 */
export const generatePONumber = async (PurchasingModel) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const prefix = `PO-${year}-${month}-${day}-`;

  // Find the latest PO for today
  // Use regex to match PO numbers starting with today's date prefix
  const latestPO = await PurchasingModel.findOne({
    poNumber: new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), // Escape special regex chars
  })
    .sort({ createdAt: -1 }) // Sort by creation date instead of poNumber string
    .select("poNumber");

  let sequence = 1;
  if (latestPO && latestPO.poNumber) {
    // Extract sequence number from format: PO-YYYY-MM-DD-NNNNNN
    const parts = latestPO.poNumber.split("-");
    if (parts.length === 5) {
      // Format: ["PO", "YYYY", "MM", "DD", "NNNNNN"]
      const latestSequence = parseInt(parts[4], 10);
      if (!isNaN(latestSequence)) {
        sequence = latestSequence + 1;
      }
    }
  }

  // Format: PO-YYYY-MM-DD-NNNNNN (e.g., PO-2024-01-14-000001)
  return `${prefix}${sequence.toString().padStart(6, "0")}`;
};

export default {
  generatePONumber,
};
