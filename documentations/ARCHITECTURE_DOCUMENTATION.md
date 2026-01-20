# Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Directory Structure & Responsibilities](#directory-structure--responsibilities)
3. [Component Relationships](#component-relationships)
4. [Data Flow](#data-flow)
5. [Layer Responsibilities](#layer-responsibilities)
6. [Best Practices](#best-practices)

---

## Overview

This project follows the **SRC Pattern (Enhanced/Upgraded Version)**, a layered architecture that separates concerns into distinct layers:

- **HTTP Layer** (Controllers) → **Business Logic Layer** (Services) → **Data Access Layer** (Repositories) → **Database** (Models)

Each layer has a specific responsibility and communicates only with adjacent layers, ensuring maintainability, testability, and scalability.

---

## Directory Structure & Responsibilities

### 📁 `src/controllers/`
**Purpose**: HTTP request/response handling - Entry point for all API requests

**What goes here:**
- HTTP request handlers (GET, POST, PUT, DELETE, etc.)
- Request/response formatting
- Status code setting
- Error forwarding (via `next()`)

**What does NOT go here:**
- ❌ Business logic
- ❌ Database queries
- ❌ Data validation (use validators)
- ❌ Data transformation (use DTOs)

**Example Structure:**
```javascript
// ✅ CORRECT: Controller only handles HTTP
class InventoryController {
  createInventory = asyncErrorHandler(async (req, res, next) => {
    const result = await this.service.createInventory(req.body);
    res.status(201).json({
      success: true,
      message: "Inventory created successfully",
      data: result.toJSON(),
    });
  });
}

// ❌ WRONG: Business logic in controller
class InventoryController {
  createInventory = asyncErrorHandler(async (req, res, next) => {
    // ❌ Don't do this - business logic belongs in service
    if (req.body.productCode) {
      const existing = await Inventory.findOne({ productCode: req.body.productCode });
      if (existing) {
        return res.status(400).json({ error: "Product code exists" });
      }
    }
  });
}
```

**Files:**
- `inventory.controller.js` - Inventory HTTP handlers
- `user.controller.js` - User HTTP handlers
- `order.controller.js` - Order HTTP handlers

---

### 📁 `src/services/`
**Purpose**: Business logic layer - The "brain" of the application

**What goes here:**
- Business rules and validation
- Data orchestration (combining multiple repositories)
- Transaction management
- Business-specific calculations
- Cross-cutting concerns (logging, caching decisions)

**What does NOT go here:**
- ❌ HTTP request/response handling
- ❌ Direct database queries (use repositories)
- ❌ Request validation (use validators)

**Example Structure:**
```javascript
// ✅ CORRECT: Service contains business logic
export class InventoryService {
  async createInventory(data) {
    // Business logic: Check uniqueness
    const existing = await this.repository.findOne({ 
      productCode: data.productCode 
    });
    if (existing) {
      throw new ValidationError("Product code already exists");
    }
    
    // Transform using DTO
    const dto = new CreateInventoryDTO(data);
    const inventory = await this.repository.create(dto.toModel());
    
    return new InventoryResponseDTO(inventory);
  }
}
```

**Files:**
- `inventory.service.js` - Inventory business logic
- `user.service.js` - User business logic
- `order.service.js` - Order business logic

---

### 📁 `src/repositories/`
**Purpose**: Data access layer - Direct database interactions

**What goes here:**
- Database queries (CRUD operations)
- Query building
- Database-specific logic
- Raw database operations

**What does NOT go here:**
- ❌ Business logic
- ❌ HTTP handling
- ❌ Data transformation (use DTOs)
- ❌ Validation rules

**Example Structure:**
```javascript
// ✅ CORRECT: Repository only handles database operations
export class InventoryRepository {
  async create(data) {
    return await Inventory.create(data);
  }

  async findById(id) {
    return await Inventory.findById(id);
  }

  async find(query, options = {}) {
    const { sort, skip, limit } = options;
    let queryBuilder = Inventory.find(query);
    
    if (sort) queryBuilder = queryBuilder.sort(sort);
    if (skip !== undefined) queryBuilder = queryBuilder.skip(skip);
    if (limit !== undefined) queryBuilder = queryBuilder.limit(limit);
    
    return await queryBuilder.exec();
  }
}
```

**Files:**
- `inventory.repository.js` - Inventory database operations
- `user.repository.js` - User database operations
- `order.repository.js` - Order database operations

---

### 📁 `src/models/`
**Purpose**: Database schema definitions

**What goes here:**
- Mongoose/Sequelize schema definitions
- Schema validations
- Virtual fields
- Schema indexes
- Pre/post hooks (if needed)

**What does NOT go here:**
- ❌ Business logic
- ❌ HTTP handling
- ❌ Complex queries (use repositories)

**Example Structure:**
```javascript
// ✅ CORRECT: Model defines schema only
const inventorySchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    trim: true,
  },
  productCode: {
    type: String,
    required: true,
    unique: true,
  },
  // ... other fields
});

// Virtual fields
inventorySchema.virtual('profitMargin').get(function() {
  return ((this.sellingPrice - this.buyingPrice) / this.buyingPrice) * 100;
});

export default mongoose.model('Inventory', inventorySchema);
```

**Files:**
- `inventory.model.js` - Inventory schema
- `user.model.js` - User schema
- `order.model.js` - Order schema

---

### 📁 `src/routes/`
**Purpose**: API endpoint definitions and route mapping

**What goes here:**
- Route definitions (GET, POST, PUT, DELETE)
- Middleware attachment (validation, auth)
- Route parameter definitions
- Route grouping

**What does NOT go here:**
- ❌ Business logic
- ❌ Request handling logic (use controllers)

**Example Structure:**
```javascript
// ✅ CORRECT: Routes map endpoints to controllers
import { createInventory, getAllInventory } from '../controllers/inventory.controller.js';
import { validateCreateInventory } from '../validators/inventory.validator.js';

const router = Router();

router.get('/inventory', getAllInventory);
router.post('/inventory', validateCreateInventory, createInventory);

export default router;
```

**Files:**
- `index.js` - Main router (combines all routes)
- `inventory.route.js` - Inventory routes
- `user.route.js` - User routes

---

### 📁 `src/middleware/`
**Purpose**: Request/response processing middleware

**What goes here:**
- Authentication middleware
- Authorization middleware
- Error handling middleware
- Request logging middleware
- Rate limiting middleware
- Timezone middleware

**What does NOT go here:**
- ❌ Business logic
- ❌ Database queries

**Example Structure:**
```javascript
// ✅ CORRECT: Middleware processes requests/responses
export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Verify token...
  next();
};

export const globalErrorHandler = (error, req, res, next) => {
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
  });
};
```

**Files:**
- `auth.middleware.js` - Authentication
- `errorHandler.middleware.js` - Global error handling
- `rateLimiter.middleware.js` - Rate limiting
- `timezone.middleware.js` - Timezone handling

---

### 📁 `src/types/`
**Purpose**: Single Source of Truth - Base type/schema definitions

**What goes here:**
- Field name constants (e.g., `INVENTORY_FIELDS`)
- Enum definitions (e.g., `INVENTORY_STATUS`)
- Default values (e.g., `INVENTORY_DEFAULTS`)
- Type helper functions (e.g., `isValidStatus()`)

**What does NOT go here:**
- ❌ Validation rules (use validators)
- ❌ Business logic
- ❌ Database queries

**Example Structure:**
```javascript
// ✅ CORRECT: Types contain pure definitions only
export const INVENTORY_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  DISCONTINUED: "discontinued",
};

export const INVENTORY_FIELDS = {
  PRODUCT_NAME: "productName",
  PRODUCT_CODE: "productCode",
  STATUS: "status",
};

export const INVENTORY_DEFAULTS = {
  STATUS: INVENTORY_STATUS.ACTIVE,
  CATEGORY: "Unknown",
};

// Helper functions
export const isValidStatus = (status) => 
  Object.values(INVENTORY_STATUS).includes(status);
```

**Files:**
- `inventory.types.js` - Inventory type definitions
- `user.types.js` - User type definitions
- `order.types.js` - Order type definitions

---

### 📁 `src/validators/`
**Purpose**: Request validation schemas

**What goes here:**
- Joi/Yup/Zod validation schemas
- Validation constraints (min, max, required, etc.)
- Validation middleware functions
- Custom validation rules

**What does NOT go here:**
- ❌ Business logic validation (use services)
- ❌ Type definitions (use types)

**Example Structure:**
```javascript
// ✅ CORRECT: Validator uses types and defines validation rules
import { INVENTORY_FIELDS, INVENTORY_DEFAULTS, getValidStatuses } from '../types/inventory.types.js';

export const createInventorySchema = Joi.object({
  [INVENTORY_FIELDS.PRODUCT_NAME]: Joi.string()
    .min(1)
    .max(200)
    .required(),
  
  [INVENTORY_FIELDS.STATUS]: Joi.string()
    .valid(...getValidStatuses())
    .default(INVENTORY_DEFAULTS.STATUS),
});

export const validateCreateInventory = (req, res, next) => {
  const { error, value } = createInventorySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ errors: error.details });
  }
  req.body = value;
  next();
};
```

**Files:**
- `inventory.validator.js` - Inventory validation
- `user.validator.js` - User validation
- `order.validator.js` - Order validation

---

### 📁 `src/dtos/`
**Purpose**: Data Transfer Objects - Data transformation between layers

**What goes here:**
- Request DTOs (transform request → model format)
- Response DTOs (transform model → response format)
- Data transformation logic
- Field mapping and formatting

**What does NOT go here:**
- ❌ Business logic
- ❌ Validation (use validators)

**Example Structure:**
```javascript
// ✅ CORRECT: DTO transforms data between layers
import { INVENTORY_FIELDS, INVENTORY_DEFAULTS } from '../types/inventory.types.js';

export class CreateInventoryDTO {
  constructor(data) {
    this.productName = data[INVENTORY_FIELDS.PRODUCT_NAME];
    this.productCode = data[INVENTORY_FIELDS.PRODUCT_CODE]?.toUpperCase();
    this.status = data[INVENTORY_FIELDS.STATUS] || INVENTORY_DEFAULTS.STATUS;
  }

  toModel() {
    return {
      [INVENTORY_FIELDS.PRODUCT_NAME]: this.productName,
      [INVENTORY_FIELDS.PRODUCT_CODE]: this.productCode,
      [INVENTORY_FIELDS.STATUS]: this.status,
    };
  }
}

export class InventoryResponseDTO {
  constructor(model) {
    this.id = model._id;
    this.productName = model[INVENTORY_FIELDS.PRODUCT_NAME];
    // ... transform model to response format
  }

  toJSON() {
    return {
      id: this.id,
      productName: this.productName,
      // ... response format
    };
  }
}
```

**Files:**
- `inventory.dto.js` - Inventory DTOs
- `user.dto.js` - User DTOs
- `order.dto.js` - Order DTOs

---

### 📁 `src/errors/`
**Purpose**: Custom error classes

**What goes here:**
- Custom error class definitions
- Error type constants
- Error handling utilities

**Example Structure:**
```javascript
// ✅ CORRECT: Custom error classes
export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(400, message, "VALIDATION_ERROR");
    this.field = field;
  }
}

export class NotFoundError extends AppError {
  constructor(resource, id = null) {
    const message = id 
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    super(404, message, "NOT_FOUND");
  }
}
```

**Files:**
- `AppError.js` - Base error class
- `errorTypes.js` - Custom error types

---

### 📁 `src/constants/`
**Purpose**: Application-wide constants

**What goes here:**
- HTTP status codes
- Success/error messages
- Application constants
- Configuration constants

**Example Structure:**
```javascript
// ✅ CORRECT: Constants for reuse
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
};

export const SUCCESS_MESSAGES = {
  CREATED: (resource) => `${resource} created successfully`,
  UPDATED: (resource) => `${resource} updated successfully`,
};
```

**Files:**
- `statusCodes.js` - HTTP status codes
- `messages.js` - Success/error messages

---

### 📁 `src/shared/`
**Purpose**: Global utilities and helpers

**What goes here:**
- **`utils/`** - Pure functions (no side effects)
  - Date formatting
  - String manipulation
  - Number formatting
  - Async error handlers
- **`helpers/`** - Application logic helpers
  - Token helpers
  - Response helpers
  - File upload helpers

**Example Structure:**
```javascript
// ✅ CORRECT: Pure utility function
export const formatDate = (date) => {
  return new Date(date).toISOString();
};

// ✅ CORRECT: Application helper
export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET);
};
```

**Files:**
- `utils/asyncErrorHandler.js` - Async error wrapper
- `utils/dateFilter.utils.js` - Date utilities
- `helpers/token.helper.js` - Token utilities

---

### 📁 `src/config/`
**Purpose**: Application configuration

**What goes here:**
- Database configuration
- CORS configuration
- Environment variable setup
- External service configurations

**Example Structure:**
```javascript
// ✅ CORRECT: Configuration setup
export const configureCors = () => {
  return cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  });
};
```

**Files:**
- `index.js` - Main config export
- `db.config.js` - Database config
- `cors.config.js` - CORS config

---

### 📁 `src/loaders/`
**Purpose**: Dependency Injection wiring

**What goes here:**
- Service/repository instantiation
- Dependency injection setup
- Application initialization
- Singleton pattern implementation

**Example Structure:**
```javascript
// ✅ CORRECT: Dependency injection
let inventoryService = null;

export const getInventoryService = () => {
  if (!inventoryService) {
    const repository = getInventoryRepository();
    inventoryService = new InventoryService(repository);
  }
  return inventoryService;
};
```

**Files:**
- `index.js` - Main loader
- `services.loader.js` - Service DI
- `database.loader.js` - Database connection

---

### 📁 `src/app.js`
**Purpose**: Express application setup

**What goes here:**
- Express app initialization
- Middleware registration
- Route mounting
- Error handler setup

---

### 📁 `src/server.js`
**Purpose**: Server instance

**What goes here:**
- Server startup
- Port configuration
- Graceful shutdown

---

## Component Relationships

### Request Flow Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────────────────────────────────────────────────┐
│                    Express App                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Middleware Stack                                 │  │
│  │  - CORS                                           │  │
│  │  - Rate Limiting                                  │  │
│  │  - Body Parser                                    │  │
│  │  - Validation Middleware                          │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                               │
│                         ▼                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Routes                                           │  │
│  │  router.post('/inventory', validate, controller)│  │
│  └──────────────────────────────────────────────────┘  │
│                         │                               │
│                         ▼                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Controller Layer                                │  │
│  │  - Extracts request data                         │  │
│  │  - Calls service                                 │  │
│  │  - Formats response                              │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                               │
│                         ▼                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Service Layer                                   │  │
│  │  - Business logic                                 │  │
│  │  - Uses DTOs for transformation                 │  │
│  │  - Calls repositories                            │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                               │
│                         ▼                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Repository Layer                                 │  │
│  │  - Database queries                               │  │
│  │  - Uses models                                   │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                               │
│                         ▼                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Model Layer                                      │  │
│  │  - Schema definition                              │  │
│  │  - Database interaction                          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│  Database   │
└─────────────┘
```

### Dependency Graph

```
┌──────────────┐
│  Controllers │ ──┐
└──────┬───────┘   │
       │           │ Uses
       │           │
       ▼           │
┌──────────────┐   │
│   Services   │ ──┘
└──────┬───────┘
       │
       ├──► Uses ──┐
       │            │
       ▼            │
┌──────────────┐    │
│ Repositories │ ───┘
└──────┬───────┘
       │
       │ Uses
       ▼
┌──────────────┐
│    Models    │
└──────────────┘

┌──────────────┐     ┌──────────────┐
│  Validators  │ ───►│    Types     │
└──────────────┘     └──────────────┘
       │                    ▲
       │ Uses               │ Used by
       ▼                    │
┌──────────────┐     ┌──────────────┐
│   Routes     │     │     DTOs      │
└──────────────┘     └──────────────┘
       │                    │
       │ Uses               │ Uses
       ▼                    ▼
┌──────────────┐     ┌──────────────┐
│ Controllers  │     │    Types     │
└──────────────┘     └──────────────┘
```

---

## Data Flow

### Create Inventory Example

```
1. Client Request
   POST /api/v2/inventory
   {
     "productName": "Laptop",
     "productCode": "LAP001",
     "buyingPrice": 500,
     "sellingPrice": 700
   }

2. Route Layer (routes/inventory.route.js)
   router.post('/inventory', validateCreateInventory, createInventory)
   ↓
   Validates request using validateCreateInventory middleware

3. Validator Layer (validators/inventory.validator.js)
   - Uses types from types/inventory.types.js
   - Validates: productName (required, min 1, max 200)
   - Validates: productCode (required, min 1, max 100)
   - Validates: buyingPrice (required, min 0)
   - Validates: sellingPrice (required, min 0)
   ↓
   If valid, passes to controller

4. Controller Layer (controllers/inventory.controller.js)
   createInventory(req, res, next)
   - Extracts: req.body
   - Calls: service.createInventory(req.body)
   ↓
   Waits for service response

5. Service Layer (services/inventory.service.js)
   createInventory(data)
   - Creates DTO: new CreateInventoryDTO(data)
   - Business logic: Check uniqueness of productCode
   - Calls: repository.create(dto.toModel())
   - Returns: new InventoryResponseDTO(inventory)
   ↓
   Returns DTO to controller

6. Repository Layer (repositories/inventory.repository.js)
   create(data)
   - Calls: Inventory.create(data)
   ↓
   Returns model instance

7. Model Layer (models/inventory.model.js)
   - Validates schema
   - Saves to database
   ↓
   Returns saved document

8. Response Flow (back up the chain)
   Model → Repository → Service (DTO) → Controller → Client
   
   Response:
   {
     "success": true,
     "message": "Inventory item created successfully",
     "data": {
       "id": "...",
       "productName": "Laptop",
       "productCode": "LAP001",
       ...
     }
   }
```

---

## Layer Responsibilities

### Controller Layer
- ✅ Extract request data (params, query, body)
- ✅ Call service methods
- ✅ Format HTTP responses
- ✅ Set HTTP status codes
- ✅ Handle errors (pass to error handler)

### Service Layer
- ✅ Implement business logic
- ✅ Validate business rules
- ✅ Orchestrate multiple repositories
- ✅ Transform data using DTOs
- ✅ Throw custom errors

### Repository Layer
- ✅ Execute database queries
- ✅ Build query filters
- ✅ Handle pagination
- ✅ Handle sorting
- ✅ Return raw model instances

### Model Layer
- ✅ Define schema structure
- ✅ Define field types and constraints
- ✅ Define indexes
- ✅ Define virtual fields
- ✅ Define pre/post hooks

### DTO Layer
- ✅ Transform request → model format
- ✅ Transform model → response format
- ✅ Apply field mappings
- ✅ Apply formatting rules

### Validator Layer
- ✅ Validate request structure
- ✅ Validate field types
- ✅ Validate constraints (min, max, required)
- ✅ Return validation errors

### Types Layer
- ✅ Define field name constants
- ✅ Define enums
- ✅ Define default values
- ✅ Provide helper functions

---

## Best Practices

### ✅ DO

1. **Controllers should be thin**
   - Only handle HTTP concerns
   - Delegate all logic to services

2. **Services should contain business logic**
   - All business rules belong here
   - Use DTOs for data transformation

3. **Repositories should be database-focused**
   - Only database queries
   - No business logic

4. **Use types as single source of truth**
   - All field names come from types
   - All enums come from types

5. **Use DTOs for data transformation**
   - Request → Model: Use CreateDTO
   - Model → Response: Use ResponseDTO

6. **Use dependency injection**
   - Get services from loaders
   - Don't create instances directly

### ❌ DON'T

1. **Don't put business logic in controllers**
   ```javascript
   // ❌ WRONG
   createInventory = async (req, res) => {
     const existing = await Inventory.findOne({ productCode: req.body.productCode });
     if (existing) {
       return res.status(400).json({ error: "Exists" });
     }
   };
   
   // ✅ CORRECT
   createInventory = async (req, res) => {
     const result = await this.service.createInventory(req.body);
     res.status(201).json({ data: result.toJSON() });
   };
   ```

2. **Don't put database queries in services**
   ```javascript
   // ❌ WRONG
   async createInventory(data) {
     return await Inventory.create(data);
   }
   
   // ✅ CORRECT
   async createInventory(data) {
     return await this.repository.create(data);
   }
   ```

3. **Don't hardcode field names**
   ```javascript
   // ❌ WRONG
   if (data.productCode) { ... }
   
   // ✅ CORRECT
   import { INVENTORY_FIELDS } from '../types/inventory.types.js';
   if (data[INVENTORY_FIELDS.PRODUCT_CODE]) { ... }
   ```

4. **Don't skip layers**
   ```javascript
   // ❌ WRONG: Controller calling repository directly
   createInventory = async (req, res) => {
     const inventory = await this.repository.create(req.body);
   };
   
   // ✅ CORRECT: Controller → Service → Repository
   createInventory = async (req, res) => {
     const inventory = await this.service.createInventory(req.body);
   };
   ```

---

## Quick Reference

### Where to put what?

| Task | Location |
|------|----------|
| HTTP request handling | `controllers/` |
| Business logic | `services/` |
| Database queries | `repositories/` |
| Schema definition | `models/` |
| Route definitions | `routes/` |
| Request validation | `validators/` |
| Data transformation | `dtos/` |
| Type definitions | `types/` |
| Error classes | `errors/` |
| Constants | `constants/` |
| Utilities | `shared/utils/` |
| Helpers | `shared/helpers/` |
| Configuration | `config/` |
| Dependency injection | `loaders/` |

---

## Summary

This architecture provides:
- ✅ **Separation of Concerns**: Each layer has a single responsibility
- ✅ **Testability**: Easy to test each layer independently
- ✅ **Maintainability**: Changes are isolated to specific layers
- ✅ **Scalability**: Easy to add new features following the pattern
- ✅ **Type Safety**: Single source of truth for types and fields
- ✅ **Consistency**: Standardized patterns across the codebase

Follow these patterns consistently, and your codebase will remain clean, maintainable, and scalable! 🚀
