# Inventory Transformation Plan - SRC Pattern

## Overview

Transform Inventory feature from fat controller to SRC pattern:

- **Repository**: Data access layer
- **Service**: Business logic layer
- **Controller**: HTTP layer only
- **Routes**: Add validators (minimal changes)

## Current State ✅

### Already Completed

- ✅ `src/types/inventory.types.js` - Single source of truth
- ✅ `src/validators/inventory.validator.js` - Request validation
- ✅ `src/dtos/inventory.dto.js` - Data transformation
- ✅ `src/model/inventory.model.js` - Database schema
- ✅ `src/routes/inventory.route.js` - Route definitions

### What Needs to Be Created

- [ ] `src/repositories/inventory.repository.js` - Inventory data access
- [ ] `src/repositories/warehouseStock.repository.js` - Warehouse stock queries (for stock availability)
- [ ] `src/repositories/storefrontInventory.repository.js` - Storefront stock queries (for stock availability)
- [ ] `src/services/inventory.service.js` - Business logic
- [ ] `src/controllers/inventory.controller.new.js` - New HTTP-only controller (side-by-side with old)
- [ ] `src/routes/inventory.route.new.js` - New routes with validators (side-by-side with old)
- [ ] Keep old files unchanged: `inventory.controller.js` and `inventory.route.js`

---

## Step-by-Step Implementation Plan

### Step 1: Create Inventory Repository ✅

**File:** `src/repositories/inventory.repository.js`

**Purpose:** Extract all Inventory database queries from controller

**Methods Needed:**

- `create(data)` - Create new inventory
- `findById(id)` - Find by ID
- `findOne(query)` - Find one (for uniqueness checks)
- `find(query, options)` - Find with pagination/sorting
- `countDocuments(query)` - Count for pagination
- `findByIdAndUpdate(id, updateData, options)` - Update inventory
- `save(document)` - Save document (for update with validators)

**Key Points:**

- No business logic, just database queries
- Handle query building (filters, pagination, sorting)
- Return raw model data

---

### Step 2: Create Warehouse Stock Repository ✅

**File:** `src/repositories/warehouseStock.repository.js`

**Purpose:** Extract WarehouseStock queries for stock availability feature

**Methods Needed:**

- `findByInventoryId(inventoryId)` - Get all warehouse stocks for an inventory item
- `find(query, options)` - Generic find with populate

**Key Points:**

- Used by `getInventoryById` for stock availability
- Needs populate for warehouseId relationship

---

### Step 3: Create Storefront Inventory Repository ✅

**File:** `src/repositories/storefrontInventory.repository.js`

**Purpose:** Extract StorefrontInventory queries for stock availability feature

**Methods Needed:**

- `findByInventoryId(inventoryId)` - Get all storefront stocks for an inventory item
- `find(query, options)` - Generic find with populate

**Key Points:**

- Used by `getInventoryById` for stock availability
- Needs populate for storefrontId relationship

---

### Step 4: Create Inventory Service ✅

**File:** `src/services/inventory.service.js`

**Purpose:** Extract all business logic from controller

**Methods Needed:**

#### 4.1 `createInventory(data)`

**Business Logic:**

- Transform data using `CreateInventoryDTO`
- Check uniqueness for: productCode, SKU, barcode, saleCode
- Create inventory
- Return `InventoryResponseDTO`

**Dependencies:**

- `InventoryRepository`
- `CreateInventoryDTO`
- `InventoryResponseDTO`
- `ValidationError` (from errorTypes)

#### 4.2 `getAllInventory(queryParams)`

**Business Logic:**

- Build query from queryParams (category, status, search)
- Handle pagination (page, limit)
- Handle sorting (sortBy, sortOrder)
- Execute query
- Transform results using `InventoryResponseDTO`
- Return data + pagination info

**Dependencies:**

- `InventoryRepository`
- `InventoryResponseDTO`

#### 4.3 `getInventoryById(id)`

**Business Logic:**

- Validate ID format (or let repository handle)
- Find inventory by ID
- If not found, throw `NotFoundError`
- Get warehouse stocks (using WarehouseStockRepository)
- Get storefront stocks (using StorefrontInventoryRepository)
- Format stock availability data
- Calculate total quantities
- Return inventory + stock availability

**Dependencies:**

- `InventoryRepository`
- `WarehouseStockRepository`
- `StorefrontInventoryRepository`
- `InventoryResponseDTO`
- `NotFoundError` (from errorTypes)

#### 4.4 `updateInventory(id, updateData)`

**Business Logic:**

- Find existing inventory (throw NotFoundError if not found)
- Transform update data using `UpdateInventoryDTO`
- Check uniqueness conflicts for: productCode, SKU, barcode, saleCode
- Validate sellingPrice >= buyingPrice (merge with existing values)
- Update inventory (use save() to run validators)
- Return `InventoryResponseDTO`

**Dependencies:**

- `InventoryRepository`
- `UpdateInventoryDTO`
- `InventoryResponseDTO`
- `ValidationError`, `NotFoundError` (from errorTypes)

**Key Points:**

- All business logic here
- Use DTOs for transformation
- Throw errors (don't catch - let global handler catch)
- Use error types for consistent errors

---

### Step 5: Create New Inventory Controller ✅

**File:** `src/controllers/inventory.controller.new.js` (NEW FILE)

**Purpose:** New HTTP-only controller following SRC pattern

**Strategy:** Side-by-side migration - keep old controller unchanged

**Changes:**

#### 5.1 New File Structure

**Create:** `src/controllers/inventory.controller.new.js`

**Keep:** `src/controllers/inventory.controller.js` (unchanged)

#### 5.2 Imports (New File)

```javascript
// ✅ ADD
import { InventoryService } from "../services/inventory.service.js";
import { HTTP_STATUS } from "../constants/statusCodes.js";
import { SUCCESS_MESSAGES } from "../constants/messages.js";
```

#### 5.3 Refactor Each Method

**createInventory:**

- Extract data from `req.body`
- Call `service.createInventory(data)`
- Format response using DTO `.toJSON()`
- Use constants for status codes and messages

**getAllInventory:**

- Extract query params from `req.query`
- Call `service.getAllInventory(queryParams)`
- Format response with pagination
- Use constants

**getInventoryById:**

- Extract `id` from `req.params`
- Call `service.getInventoryById(id)`
- Format response (includes stock availability)
- Use constants

**updateInventory:**

- Extract `id` from `req.params`
- Extract data from `req.body`
- Call `service.updateInventory(id, updateData)`
- Format response using DTO `.toJSON()`
- Use constants

**Key Points:**

- No database queries
- No business logic
- No data transformation (service handles via DTOs)
- No error handling (asyncErrorHandler + global handler)
- Just HTTP layer

---

### Step 6: Create New Routes ✅

**File:** `src/routes/inventory.route.new.js` (NEW FILE)

**Strategy:** Side-by-side migration - keep old routes unchanged

**Changes:**

- Create new route file with validators
- Import from new controller (`inventory.controller.new.js`)
- Add validator middleware to POST and PATCH routes
- GET routes don't need validators (no body)

**New Routes File:**

```javascript
import express from "express";
import {
  createInventory,
  getAllInventory,
  getInventoryById,
  updateInventory,
} from "../controllers/inventory.controller.new.js";
import {
  validateCreateInventory,
  validateUpdateInventory,
} from "../validators/inventory.validator.js";

const router = express.Router();

// Create new inventory item (with validator)
router.post("/inventory", validateCreateInventory, createInventory);

// Get all inventory items
router.get("/inventory", getAllInventory);

// Get inventory item by ID
router.get("/inventory/:id", getInventoryById);

// Update inventory metadata (with validator)
router.patch("/inventory/:id", validateUpdateInventory, updateInventory);

export default router;
```

**Old Routes File:**

- Keep `src/routes/inventory.route.js` unchanged
- Old routes continue to work with old controller

**Key Points:**

- Side-by-side approach
- New routes use new controller + validators
- Old routes remain functional
- Can switch between old/new via route mounting in `app.js`

---

## Detailed Implementation

### Repository Implementation Details

#### InventoryRepository

```javascript
import Inventory from "../model/inventory.model.js";

export class InventoryRepository {
  async create(data) {
    return await Inventory.create(data);
  }

  async findById(id) {
    return await Inventory.findById(id);
  }

  async findOne(query) {
    return await Inventory.findOne(query);
  }

  async find(query, options = {}) {
    const { sort, skip, limit } = options;
    let queryBuilder = Inventory.find(query);

    if (sort) queryBuilder = queryBuilder.sort(sort);
    if (skip !== undefined) queryBuilder = queryBuilder.skip(skip);
    if (limit !== undefined) queryBuilder = queryBuilder.limit(limit);

    return await queryBuilder.exec();
  }

  async countDocuments(query) {
    return await Inventory.countDocuments(query);
  }

  async findByIdAndUpdate(id, updateData, options) {
    return await Inventory.findByIdAndUpdate(id, updateData, options);
  }

  // Note: save() is called on document instance, not repository
  // Service will handle: existingInventory.save()
}
```

#### WarehouseStockRepository

```javascript
import WarehouseStock from "../models/warehouse.model.js";

export class WarehouseStockRepository {
  async findByInventoryId(inventoryId) {
    return await WarehouseStock.find({ inventoryId })
      .populate(
        "warehouseId",
        "locationName locationCode locationAddress type status"
      )
      .select("warehouseId quantity lastUpdated")
      .exec();
  }
}
```

#### StorefrontInventoryRepository

```javascript
import StorefrontInventory from "../models/storefrontInventory.model.js";

export class StorefrontInventoryRepository {
  async findByInventoryId(inventoryId) {
    return await StorefrontInventory.find({ inventoryId })
      .populate(
        "storefrontId",
        "locationName locationCode locationAddress type status"
      )
      .select("storefrontId quantity lastUpdated")
      .exec();
  }
}
```

---

### Service Implementation Details

#### Key Business Logic Patterns

**Uniqueness Check Pattern:**

```javascript
// Check productCode uniqueness
if (inventoryData.productCode) {
  const existing = await this.inventoryRepository.findOne({
    productCode: inventoryData.productCode.toUpperCase(),
  });
  if (existing) {
    throw new ValidationError("Product code already exists", "productCode");
  }
}
```

**Stock Availability Formatting:**

```javascript
// Format warehouse stock data
const warehouseStockAvailability = warehouseStocks
  .filter(
    (stock) => stock.warehouseId !== null && stock.warehouseId !== undefined
  )
  .map((stock) => ({
    locationId: stock.warehouseId._id,
    locationName: stock.warehouseId.locationName,
    locationCode: stock.warehouseId.locationCode,
    locationAddress: stock.warehouseId.locationAddress,
    locationType: stock.warehouseId.type,
    status: stock.warehouseId.status,
    quantity: stock.quantity,
    lastUpdated: stock.lastUpdated,
  }));
```

**Price Validation Pattern:**

```javascript
// Validate sellingPrice >= buyingPrice
const finalBuyingPrice =
  updatePayload.buyingPrice !== undefined
    ? updatePayload.buyingPrice
    : existing.buyingPrice;
const finalSellingPrice =
  updatePayload.sellingPrice !== undefined
    ? updatePayload.sellingPrice
    : existing.sellingPrice;

if (finalSellingPrice < finalBuyingPrice) {
  throw new ValidationError(
    `Selling price (${finalSellingPrice}) should be greater than or equal to buying price (${finalBuyingPrice})`,
    "sellingPrice"
  );
}
```

---

### Controller Implementation Details

**File:** `src/controllers/inventory.controller.new.js` (NEW FILE)

**Note:** This is a new file. Old controller (`inventory.controller.js`) remains unchanged.

#### Class-Based Pattern

```javascript
/**
 * New Inventory Controller - SRC Pattern
 * HTTP layer only - no business logic, no database queries
 *
 * Old controller: inventory.controller.js (unchanged)
 * New controller: inventory.controller.new.js (this file)
 */
import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import { InventoryService } from "../services/inventory.service.js";
import { HTTP_STATUS } from "../constants/statusCodes.js";
import { SUCCESS_MESSAGES } from "../constants/messages.js";

class InventoryController {
  constructor() {
    this.service = new InventoryService();
  }

  createInventory = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.createInventory(req.body);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.CREATED("Inventory item"),
      data: result.toJSON(),
    });
  });

  getAllInventory = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.getAllInventory(req.query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.RETRIEVED("Inventory items"),
      data: result.data.map((item) => item.toJSON()),
      pagination: result.pagination,
    });
  });

  getInventoryById = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.getInventoryById(id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.RETRIEVED("Inventory item"),
      data: result.toJSON(),
    });
  });

  updateInventory = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const result = await this.service.updateInventory(id, req.body);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.UPDATED("Inventory item"),
      data: result.toJSON(),
    });
  });
}

// Export instance
const inventoryController = new InventoryController();
export const {
  createInventory,
  getAllInventory,
  getInventoryById,
  updateInventory,
} = inventoryController;
```

---

## Special Considerations

### 1. Stock Availability Feature (`getInventoryById`)

**Current Implementation:**

- Gets inventory by ID
- Gets warehouse stocks with populate
- Gets storefront stocks with populate
- Formats stock data
- Calculates totals
- Returns inventory + stock availability

**New Implementation:**

- Service method handles all this logic
- Repositories handle queries
- Service formats data
- Controller just formats HTTP response

**Note:** This is the most complex part - needs careful handling.

---

### 2. Update with Validators

**Current Implementation:**

- Uses `findByIdAndUpdate` but then also uses `save()` to run validators
- Merges updateData with existing data

**New Implementation:**

- Service should:
  1. Find existing inventory
  2. Merge updateData with existing
  3. Use `save()` to run validators
  4. Return updated inventory

**Key Point:** Use `save()` instead of `findByIdAndUpdate` to ensure validators run.

---

### 3. ID Validation

**Current Implementation:**

- Controller validates MongoDB ObjectId format

**New Implementation Options:**

- Option A: Keep in controller (simple validation)
- Option B: Move to service (business logic)
- Option C: Use validator middleware for route params

**Recommendation:** Option B - Move to service (it's business logic)

---

## Testing Checklist

### Repository Tests ✅

- [ ] `create()` - Creates inventory successfully
- [ ] `findById()` - Finds by ID, returns null if not found
- [ ] `findOne()` - Finds one with query
- [ ] `find()` - Finds with pagination/sorting
- [ ] `countDocuments()` - Counts correctly

### Service Tests ✅

- [ ] `createInventory()` - Creates successfully, checks uniqueness
- [ ] `createInventory()` - Throws ValidationError on duplicate productCode
- [ ] `createInventory()` - Throws ValidationError on duplicate SKU
- [ ] `getAllInventory()` - Returns paginated results
- [ ] `getAllInventory()` - Filters by category/status/search
- [ ] `getInventoryById()` - Returns inventory with stock availability
- [ ] `getInventoryById()` - Throws NotFoundError if not found
- [ ] `updateInventory()` - Updates successfully
- [ ] `updateInventory()` - Throws NotFoundError if not found
- [ ] `updateInventory()` - Throws ValidationError on duplicate codes
- [ ] `updateInventory()` - Throws ValidationError if sellingPrice < buyingPrice

### Controller Tests ✅

- [ ] `createInventory` - Returns 201 with correct response format
- [ ] `getAllInventory` - Returns 200 with pagination
- [ ] `getInventoryById` - Returns 200 with stock availability
- [ ] `getInventoryById` - Returns 404 if not found
- [ ] `updateInventory` - Returns 200 with updated data
- [ ] `updateInventory` - Returns 404 if not found
- [ ] `updateInventory` - Returns 400 on validation errors

### Integration Tests ✅

- [ ] Full flow: POST → GET → PATCH → GET
- [ ] Stock availability data is correct
- [ ] Pagination works correctly
- [ ] Search/filter works correctly
- [ ] Uniqueness checks work correctly

---

## Migration Order

1. ✅ **Create Repositories** (3 files)

   - `inventory.repository.js`
   - `warehouseStock.repository.js`
   - `storefrontInventory.repository.js`

2. ✅ **Create Service** (1 file)

   - `inventory.service.js`
   - Test each method

3. ✅ **Create New Controller** (1 new file)

   - `inventory.controller.new.js` (NEW)
   - Keep `inventory.controller.js` unchanged

4. ✅ **Create New Routes** (1 new file)

   - `inventory.route.new.js` (NEW)
   - Keep `inventory.route.js` unchanged
   - Add validators to new routes

5. ✅ **Test Everything**
   - Unit tests
   - Integration tests
   - Manual testing

---

## Files to Create/Modify

### New Files (6)

- [ ] `src/repositories/inventory.repository.js`
- [ ] `src/repositories/warehouseStock.repository.js`
- [ ] `src/repositories/storefrontInventory.repository.js`
- [ ] `src/services/inventory.service.js`
- [ ] `src/controllers/inventory.controller.new.js` (NEW - side-by-side)
- [ ] `src/routes/inventory.route.new.js` (NEW - side-by-side)

### Unchanged Files (Keep As-Is)

- ✅ `src/controllers/inventory.controller.js` (keep old version)
- ✅ `src/routes/inventory.route.js` (keep old version)

---

## Success Criteria

✅ **Repository Layer:**

- All database queries extracted
- No business logic
- Clean, reusable methods

✅ **Service Layer:**

- All business logic extracted
- Uses DTOs for transformation
- Uses error types
- No direct database queries

✅ **Controller Layer:**

- Only HTTP handling
- No business logic
- No database queries
- Uses constants for status codes/messages

✅ **Routes:**

- Validators added
- No breaking changes to API

✅ **Testing:**

- All tests passing
- No regressions
- New code tested

---

## Side-by-Side Migration Strategy

### File Naming Convention

- **New files:** Use `.new.js` suffix
  - `inventory.controller.new.js`
  - `inventory.route.new.js`
- **Old files:** Keep unchanged
  - `inventory.controller.js` (unchanged)
  - `inventory.route.js` (unchanged)

### Route Mounting Strategy

**Option A: Feature Flag (Recommended)**

```javascript
// In app.js or routes/index.js
import inventoryRoutesOld from "./routes/inventory.route.js";
import inventoryRoutesNew from "./routes/inventory.route.new.js";

if (process.env.USE_NEW_INVENTORY_ROUTES === "true") {
  app.use("/api", inventoryRoutesNew);
} else {
  app.use("/api", inventoryRoutesOld);
}
```

**Option B: Different Paths (Testing)**

```javascript
// Mount both, use different paths for testing
app.use("/api", inventoryRoutesOld); // /api/inventory (old)
app.use("/api/v2", inventoryRoutesNew); // /api/v2/inventory (new)
```

**Option C: Direct Switch (After Testing)**

```javascript
// After thorough testing, switch to new routes
import inventoryRoutesNew from "./routes/inventory.route.new.js";
app.use("/api", inventoryRoutesNew);
// Old routes can be deleted later
```

### Benefits of Side-by-Side Approach

✅ **No Breaking Changes** - Old code continues to work
✅ **Safe Testing** - Test new implementation without risk
✅ **Easy Rollback** - Can switch back if issues found
✅ **Gradual Migration** - Can migrate other features independently
✅ **Comparison** - Easy to compare old vs new behavior

---

## Next Steps

1. **Review this plan** - Make sure it covers everything
2. **Start with Repositories** - Create all 3 repository files
3. **Create Service** - Implement all service methods
4. **Create New Controller** - Create `inventory.controller.new.js`
5. **Create New Routes** - Create `inventory.route.new.js` with validators
6. **Mount New Routes** - Add to app.js with feature flag or different path
7. **Test** - Thoroughly test new endpoints
8. **Compare** - Test both old and new implementations
9. **Switch** - After validation, switch to new routes
10. **Cleanup** - Later, remove old files when confident

---

**Ready to start implementation? Let's begin with the repositories! 🚀**
