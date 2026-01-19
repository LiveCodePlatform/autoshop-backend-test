# Error Architecture: errorTypes.js vs error.controller.js

## 🔄 They Serve Different Purposes

### `errorTypes.js` - **For THROWING errors** (in your code)
**Purpose**: Define error classes to explicitly throw in your application code

**When to use**: When you want to throw an error in controllers, services, etc.

```javascript
// In your controller/service
import { NotFoundError, ValidationError } from '../errors/errorTypes.js';

// Explicitly throw errors in your code
if (!expense) {
  throw new NotFoundError("Expense", expenseId);
}

if (!email.includes('@')) {
  throw new ValidationError("Invalid email format", "email");
}
```

---

### `error.controller.js` - **For HANDLING errors** (global error handler)
**Purpose**: Transform unexpected errors (MongoDB, Mongoose, JWT) into user-friendly errors

**When to use**: Automatically catches errors in the global error handler

```javascript
// In error.controller.js (global handler)
// Catches unexpected errors from:
// - MongoDB CastError → CustomError(400)
// - Mongoose ValidationError → CustomError(400)
// - JWT TokenExpiredError → CustomError(401)
// etc.
```

---

## 📊 Comparison Table

| Aspect | `errorTypes.js` | `error.controller.js` |
|--------|----------------|---------------------|
| **Purpose** | Define error classes | Handle/transform errors |
| **When Used** | When you throw errors | When errors are caught |
| **Location** | In your code (controllers, services) | Global error handler |
| **Example** | `throw new NotFoundError("User")` | `castErrorHandler(err)` |
| **Error Source** | Your application code | MongoDB, Mongoose, JWT |

---

## 🔄 How They Work Together

### Flow 1: Explicit Error (using errorTypes.js)
```
Your Code:
  throw new NotFoundError("Expense", expenseId)
    ↓
Global Error Handler (error.controller.js):
  Receives NotFoundError (already AppError)
    ↓
  Sends JSON response to client
```

### Flow 2: Unexpected Error (caught by error.controller.js)
```
Mongoose:
  ValidationError (Mongoose error)
    ↓
Global Error Handler (error.controller.js):
  Transforms: ValidationError → CustomError(400)
    ↓
  Sends JSON response to client
```

---

## 💡 Best Practice

### Use `errorTypes.js` for:
- ✅ Explicit errors in your code
- ✅ Better semantics: `NotFoundError` vs `new CustomError(404, ...)`
- ✅ Consistent error codes
- ✅ Type-specific properties (field, resource, etc.)

### Use `error.controller.js` for:
- ✅ Catching unexpected errors (MongoDB, Mongoose, JWT)
- ✅ Transforming technical errors to user-friendly ones
- ✅ Global error handling (middleware)

---

## 🎯 Example: Both Working Together

### In Your Controller (using errorTypes.js):
```javascript
import { NotFoundError, ValidationError } from '../errors/errorTypes.js';

export const getExpense = async (req, res, next) => {
  const { id } = req.params;
  
  // Explicit error using errorTypes
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ValidationError("Invalid expense ID format", "id"));
  }
  
  const expense = await Expense.findById(id);
  
  // Explicit error using errorTypes
  if (!expense) {
    return next(new NotFoundError("Expense", id));
  }
  
  res.json(expense);
};
```

### In error.controller.js (handling unexpected errors):
```javascript
// If Mongoose throws a ValidationError (unexpected)
// error.controller.js transforms it:

if (transformedError.name === "ValidationError") {
  transformedError = validationErrorHandler(transformedError);
  // Creates CustomError(400, "Invalid input data: ...")
}
```

---

## 🤔 Should errorTypes.js Be Simpler?

If you think `errorTypes.js` is too similar to `error.controller.js`, you have options:

### Option 1: Keep Both (Recommended)
- `errorTypes.js` - For explicit errors in your code
- `error.controller.js` - For handling unexpected errors

### Option 2: Simplify errorTypes.js
Only keep the most common error types:
- `ValidationError`
- `NotFoundError`
- `UnauthorizedError`
- `ForbiddenError`

### Option 3: Just Use AppError
If you prefer simplicity, just use `AppError` directly:
```javascript
import AppError from '../errors/AppError.js';

throw new AppError(404, "Expense not found", "NOT_FOUND");
```

---

## ✅ Recommendation

**Keep both, but understand their roles:**
1. **`errorTypes.js`** - For you to throw errors explicitly (better code)
2. **`error.controller.js`** - For global handler to catch unexpected errors (safety net)

They complement each other, not duplicate!

---

## 📝 Summary

| | errorTypes.js | error.controller.js |
|---|--------------|-------------------|
| **You write** | Error classes to throw | Error handlers |
| **You use** | In controllers/services | In global middleware |
| **Handles** | Explicit errors | Unexpected errors |
| **Example** | `throw new NotFoundError()` | `castErrorHandler(err)` |

**Both are useful and serve different purposes!** 🎉
