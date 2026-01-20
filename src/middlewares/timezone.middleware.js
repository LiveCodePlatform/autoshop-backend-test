import moment from "moment-timezone";

/**
 * Helper function to convert dates to Myanmar Time (MMT)
 * @private
 */
const convertDatesToMMT = (data) => {
  if (!data) return data;

  const clonedData = JSON.parse(JSON.stringify(data));

  if (Array.isArray(clonedData)) {
    return clonedData.map((item) => convertDatesToMMT(item));
  }

  if (typeof clonedData === "object" && clonedData !== null) {
    // Specify the exact fields you want to convert
    const dateFields = [
      "createdAt",
      "updatedAt",
      "deletedAt",
      "passwordChangedAt",
      "loginAt",
      "lastActiveAt",
    ];

    for (const key in clonedData) {
      if (dateFields.includes(key)) {
        const value = clonedData[key];
        // Ensure the value is a string before converting
        if (typeof value === "string") {
          clonedData[key] = moment.utc(value).tz("Asia/Yangon").format();
        }
      } else if (
        typeof clonedData[key] === "object" &&
        clonedData[key] !== null
      ) {
        clonedData[key] = convertDatesToMMT(clonedData[key]);
      }
    }
  }
  return clonedData;
};

/**
 * Timezone Middleware
 * Converts date fields to Myanmar Time (MMT) for GET requests
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
export const mmTimeZoneMiddleware = (req, res, next) => {
  // Only apply the conversion for GET requests
  if (req.method === "GET") {
    const originalJson = res.json;
    res.json = (data) => {
      const convertedData = convertDatesToMMT(data);
      originalJson.call(res, convertedData);
    };
  }
  next();
};

export default mmTimeZoneMiddleware;
