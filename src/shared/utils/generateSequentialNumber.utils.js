/**
 * Purchasing Utility Functions
 * Pure utility functions for purchasing-related operations
 */

/**
 * Generic number generator utility
 * Generates sequential numbers with date-based prefixes
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.queryFn - Function to query the latest record
 *   Should accept: (query, options) => Promise<Array|Object>
 *   For Mongoose models: (query, options) => model.findOne(query, null, options)
 *   For repositories: (query, options) => repository.find(query, options)
 * @param {string} options.prefix - Number prefix (e.g., "PO", "ORD", "TRF")
 * @param {string} options.fieldName - Field name to query and extract from (e.g., "poNumber", "orderNumber", "transferNumber")
 * @param {number} options.sequencePadding - Number of digits for sequence (e.g., 4, 6)
 * @param {string} options.dateFormat - Date format: "daily" (YYYY-MM-DD) or "yearly" (YYYY)
 * @param {Object} options.additionalFilters - Additional query filters (e.g., { isDeleted: false })
 * @param {number} options.maxSequence - Optional maximum sequence limit (throws error if exceeded)
 * @param {string} options.maxSequenceError - Custom error message when max sequence exceeded
 * @returns {Promise<string>} Generated number
 */
export const generateSequentialNumber = async ({
  queryFn,
  prefix,
  fieldName,
  sequencePadding,
  dateFormat = "daily",
  additionalFilters = {},
  maxSequence = null,
  maxSequenceError = null,
}) => {
  const now = new Date();
  const year = now.getFullYear();

  let datePart = "";
  let expectedParts = 0;

  if (dateFormat === "daily") {
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    datePart = `${year}-${month}-${day}`;
    expectedParts = 5; // ["PREFIX", "YYYY", "MM", "DD", "NNNNNN"]
  } else if (dateFormat === "yearly") {
    datePart = String(year);
    expectedParts = 3; // ["PREFIX", "YYYY", "NNNN"]
  } else {
    throw new Error(
      `Invalid dateFormat: ${dateFormat}. Must be "daily" or "yearly"`
    );
  }

  const prefixStr = `${prefix}-${datePart}-`;

  // Build query
  const query = {
    [fieldName]: new RegExp(
      `^${prefixStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}` // Escape special regex chars
    ),
    ...additionalFilters,
  };

  // Query options
  const queryOptions = {
    sort: { createdAt: -1 },
  };

  // Execute query
  const result = await queryFn(query, queryOptions);

  // Handle different return types (array from repository.find vs object from model.findOne)
  let latestRecord = null;
  if (Array.isArray(result)) {
    latestRecord = result.length > 0 ? result[0] : null;
  } else {
    latestRecord = result;
  }

  let sequence = 1;
  if (latestRecord && latestRecord[fieldName]) {
    // Extract sequence number from format
    const parts = latestRecord[fieldName].split("-");
    if (parts.length === expectedParts) {
      // Last part is the sequence number
      const latestSequence = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(latestSequence)) {
        sequence = latestSequence + 1;
      }
    }
  }

  // Validate sequence doesn't exceed limit
  if (maxSequence !== null && sequence > maxSequence) {
    const errorMsg =
      maxSequenceError ||
      `Maximum sequence limit reached. Maximum ${maxSequence} allowed.`;
    throw new Error(errorMsg);
  }

  // Format: PREFIX-DATEPART-NNNN (e.g., PO-2024-01-14-000001 or TRF-2024-0001)
  return `${prefixStr}${sequence.toString().padStart(sequencePadding, "0")}`;
};

export default {
  generateSequentialNumber,
};
