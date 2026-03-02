# Bug Fixes & Code Corrections Manual

## 🔧 CRITICAL FIXES - Apply Immediately

---

## FIX #1: Add Missing Import in aiService.ts

**File**: `src/services/aiService.ts`  
**Line**: Top of file (missing import)  
**Status**: ❌ BROKEN - Will crash at runtime

### Current Code:

```typescript
import { BadRequestError } from "../middleware/errorHandler";
// ❌ MISSING: import openai from "../config/openai";
```

### Fixed Code:

```typescript
import openai from "../config/openai";
import { BadRequestError } from "../middleware/errorHandler";
```

**Why**: The code uses `openai.chat.completions.create()` but never imports the openai instance.

---

## FIX #2: Wrong Status Filter in analyticsService.ts

**File**: `src/services/analyticsService.ts`  
**Line**: 21  
**Status**: ❌ LOGIC ERROR - Wrong statistics calculated

### Current Code (Lines 14-24):

```typescript
const stats = {
  total_applications: apps.length,
  applied_count: apps.filter((a) => a.status === "applied").length,
  screening_count: apps.filter((a) => a.status === "screening").length,
  interview_count: apps.filter((a) => a.status === "interview").length,
  offer_count: apps.filter((a) => a.status === "offer").length,
  rejected_count: apps.filter((a) => a.status === "offer").length, // ❌ WRONG!
  avg_response_days: 0,
};
```

### Fixed Code:

```typescript
const stats = {
  total_applications: apps.length,
  applied_count: apps.filter((a) => a.status === "applied").length,
  screening_count: apps.filter((a) => a.status === "screening").length,
  interview_count: apps.filter((a) => a.status === "interview").length,
  offer_count: apps.filter((a) => a.status === "offer").length,
  rejected_count: apps.filter((a) => a.status === "rejected").length, // ✅ FIXED
  avg_response_days: 0,
};
```

**Why**: Rejected_count was filtering for "offer" status instead of "rejected", so it's identical to offer_count.

---

## FIX #3: Missing followUpSent Field in Application Schema

**File**: `src/models/Application.ts`  
**Line**: Add new fields to schema  
**Status**: ❌ DATABASE MISMATCH - Field referenced but not in schema

### Current Code (Missing fields):

```typescript
export interface IApplication extends Document {
  userId: Types.ObjectId;
  company: string;
  position: string;
  // ... lots of fields ...
  createdAt: Date;
  // ❌ MISSING: followUpSent, followUpDate
}

const applicationSchema = new Schema<IApplication>({
  // ... schema fields ...
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // ❌ MISSING FIELDS IN SCHEMA
});
```

### Fixed Code - Add to Interface:

```typescript
export interface IApplication extends Document {
  userId: Types.ObjectId;
  company: string;
  position: string;
  jobDescription?: string;
  jobUrl?: string;
  platform?: string;
  location?: string;
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  status: string;
  appliedDate: Date;
  lastUpdated: Date;
  timeline: Array<{
    status: string;
    date: Date;
    notes?: string;
  }>;
  notes?: string;
  resumeUsed?: Types.ObjectId;
  coverLetter?: string;
  aiSuggestions?: {
    keywords: string[];
    tailoredResume?: string;
    generatedAt?: Date;
  };
  followUpDate?: Date;
  followUpSent?: boolean; // ✅ ADD THIS
  createdAt: Date;
}
```

### Fixed Code - Add to Schema:

```typescript
const applicationSchema = new Schema<IApplication>({
  // ... existing fields ...
  createdAt: {
    type: Date,
    default: Date.now,
  },
  followUpSent: {
    // ✅ ADD THIS
    type: Boolean,
    default: false,
  },
  followUpDate: {
    // ✅ ADD THIS TOO
    type: Date,
  },
});
```

**Why**: The cron job and notification service reference these fields but they don't exist in the schema.

---

## FIX #4: JWT Secret Defaults Are Insecure

**File**: `src/utils/jwt.ts`  
**Line**: 5-6  
**Status**: 🔴 SECURITY RISK - Weak fallback secrets

### Current Code:

```typescript
const ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_SECRET || "access-secret-change-me";
const REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_SECRET || "refresh-secret-change-me";
```

### Fixed Code:

```typescript
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_TOKEN_SECRET) {
  throw new Error(
    "JWT_ACCESS_SECRET must be set in environment variables. Generate: openssl rand -base64 32",
  );
}

if (!REFRESH_TOKEN_SECRET) {
  throw new Error(
    "JWT_REFRESH_SECRET must be set in environment variables. Generate: openssl rand -base64 32",
  );
}
```

**Why**: If env vars aren't set, the default weak secrets "access-secret-change-me" are used, making tokens forgeable.

---

## FIX #5: Missing File Size Validation in Resume Upload

**File**: `src/services/resumeService.ts`  
**Line**: 19-25  
**Status**: ⚠️ SECURITY RISK - No file size limit

### Current Code:

```typescript
static async uploadResume(
  userId: string,
  file: Express.Multer.File,
  version?: string,
): Promise<IResume> {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw new BadRequestError("No valid file uploaded");
  }
  // ❌ NO SIZE CHECK - Can upload 100MB+ files!
```

### Fixed Code:

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

static async uploadResume(
  userId: string,
  file: Express.Multer.File,
  version?: string,
): Promise<IResume> {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw new BadRequestError("No valid file uploaded");
  }

  if (file.buffer.length > MAX_FILE_SIZE) {  // ✅ ADD THIS
    throw new BadRequestError(
      `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
    );
  }

  // ... rest of code ...
```

**Why**: Without size limits, users can upload huge files consuming storage quota and causing DOSes.

---

## FIX #6: Error Handling After Text Extraction Failure

**File**: `src/services/resumeService.ts`  
**Line**: 30-40  
**Status**: ⚠️ LOGIC - Silently continues on extraction failure

### Current Code:

```typescript
let extractedText = "";
try {
  if (file.mimetype === "application/pdf") {
    const data = await PDFParse(file.buffer);
    extractedText = data.text || "";
  } else if (...) {
    // ...
  }
} catch (error: any) {
  console.error("Text extraction failed:", error);  // ❌ Silently fails!
}

// Continue even if extractedText is empty...
```

### Fixed Code:

```typescript
let extractedText = "";
let extractionFailed = false;

try {
  if (file.mimetype === "application/pdf") {
    const data = await PDFParse(file.buffer);
    extractedText = data.text || "";
  } else if (
    file.mimetype === "application/msword" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    extractedText = result.value || "";
  } else {
    throw new BadRequestError("Unsupported file format. Use PDF or DOCX.");
  }
} catch (error: any) {
  console.error("Text extraction failed:", error);
  extractionFailed = true; // ✅ Track failure
}

if (extractionFailed && !extractedText) {
  console.warn("Warning: Could not extract text from resume file"); // ✅ Warn user
}
```

**Why**: If text extraction fails silently, later AI analysis will fail with a cryptic "No resume text" error.

---

## FIX #7: Add Pagination to getUserApplications

**File**: `src/services/applicationService.ts`  
**Line**: 39-65  
**Status**: ⚠️ PERFORMANCE - Returns ALL records without limit

### Current Code:

```typescript
static async getUserApplications(
  userId: string,
  filters: {
    status?: string;
    platform?: string;
    company?: string;
    sortBy?: string;
  },
): Promise<IApplication[]> {
  const query: any = { userId };
  // ... build query ...
  return Application.find(query).sort(sort).lean();  // ❌ NO LIMIT!
}
```

### Fixed Code:

```typescript
interface ApplicationFilters {
  status?: string;
  platform?: string;
  company?: string;
  sortBy?: string;
  page?: number;  // ✅ ADD
  limit?: number; // ✅ ADD
}

static async getUserApplications(
  userId: string,
  filters: ApplicationFilters,
): Promise<{ applications: IApplication[]; total: number; page: number }> {  // ✅ Return metadata
  const query: any = { userId };

  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.platform) {
    query.platform = filters.platform;
  }
  if (filters.company) {
    query.company = filters.company;
  }

  let sort: Record<string, 1 | -1> = { appliedDate: -1 };
  if (filters.sortBy) {
    const [field, order] = filters.sortBy.startsWith("-")
      ? [filters.sortBy.slice(1), -1]
      : [filters.sortBy, 1];
    sort = { [field]: order as 1 | -1 };
  }

  const page = Math.max(1, filters.page || 1);  // ✅ Default page 1
  const limit = Math.min(100, filters.limit || 20); // ✅ Max 100 per page
  const skip = (page - 1) * limit;  // ✅ Calculate offset

  const [applications, total] = await Promise.all([
    Application.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Application.countDocuments(query),
  ]);

  return { applications, total, page };  // ✅ Return pagination info
}
```

### Update Controller:

```typescript
export const getAllApplications = async (
  req: authenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new Error("User not authenticated");
    }

    const { status, platform, company, sortBy, page, limit } = req.query;

    const filters = {
      status: status as string | undefined,
      platform: platform as string | undefined,
      company: company as string | undefined,
      sortBy: sortBy as string | undefined,
      page: page ? parseInt(page as string) : undefined, // ✅ ADD
      limit: limit ? parseInt(limit as string) : undefined, // ✅ ADD
    };

    const result = await ApplicationService.getUserApplications(
      // ✅ Updated method
      req.user.userId,
      filters,
    );

    res.status(200).json({
      success: true,
      data: result.applications,
      pagination: {
        // ✅ ADD
        total: result.total,
        page: result.page,
        limit: filters.limit || 20,
        pages: Math.ceil(result.total / (filters.limit || 20)),
      },
    });
  } catch (error) {
    next(error);
  }
};
```

**Why**: Without pagination, returning 10,000 applications crashes the API and client browsers.

---

## FIX #8: Change HTTP Status Code for Authentication Errors

**File**: `src/middleware/auth.ts`  
**Line**: 15-17  
**Status**: ⚠️ REST - Using wrong HTTP status

### Current Code:

```typescript
export const authenticate = (
  req: authenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return next(new BadRequestError("No token Provided")); // ❌ 400 Bad Request?
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(new BadRequestError("Invalid or Expired Token")); // ❌ 400 Bad Request?
  }
};
```

### Fixed Code - Create UnauthorizedError:

```typescript
// Add to errorHandler.ts:
export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401); // ✅ Status 401
  }
}
```

### Fixed Code - Update auth middleware:

```typescript
import { UnauthorizedError } from "./errorHandler"; // ✅ Import

export const authenticate = (
  req: authenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return next(new UnauthorizedError("No token provided")); // ✅ 401
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(new UnauthorizedError("Invalid or expired token")); // ✅ 401
  }
};
```

**Why**: HTTP 401 means "authentication failed"; 400 means "bad request format". Different semantics.

---

## FIX #9: Add Prompt Escape/Sanitization in AI Service

**File**: `src/services/aiService.ts`  
**Lines**: 70-90, 140-170, etc.  
**Status**: ⚠️ SECURITY - Prompt injection vulnerability

### Current Code (vulnerable):

```typescript
const prompt = `
You are a professional resume consultant with 15+ years of experience.

RESUME TEXT:
"""
${resumeText}  // ❌ No escaping!
"""

JOB DESCRIPTION:
"""
${jobDescription}  // ❌ No escaping!
"""

Provide a detailed analysis in **strict JSON format only**...
`;
```

### Fixed Code:

```typescript
// Helper function - add at top of file
function escapePromptText(text: string): string {
  // Prevent triple quotes from breaking out of string
  return text.replace(/"""/g, '`"`');
}

// Then use it:
const escapedResumeText = escapePromptText(resumeText);
const escapedJobDescription = escapePromptText(jobDescription);

const prompt = `
You are a professional resume consultant with 15+ years of experience.

RESUME TEXT:
"""
${escapedResumeText}  // ✅ Escaped
"""

JOB DESCRIPTION:
"""
${escapedJobDescription}  // ✅ Escaped
"""

Provide a detailed analysis in **strict JSON format only**...
`;
```

**Why**: If job description contains prompt injection payloads, attacker can manipulate AI behavior.

---

## FIX #10: Fix Resume Schema Pre-save Hook

**File**: `src/models/Resume.ts`  
**Line**: 55-63  
**Status**: ⚠️ PERFORMANCE - Multiple DB queries on save

### Current Code:

```typescript
// Ensure only onw default per user  // ❌ Typo: "onw" should be "one"
resumeSchema.pre("save", async function () {
  if (this.isDefault) {
    await this.collection.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } },
    );
  }
});
```

### Fixed Code:

```typescript
// Ensure only one default resume per user
resumeSchema.pre("save", async function (next) {
  try {
    if (this.isDefault && this.isModified("isDefault")) {
      // Only run if isDefault was actually modified and set to true
      await Resume.updateMany(
        { userId: this.userId, _id: { $ne: this._id } },
        { $set: { isDefault: false } },
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Or better - use static method instead of pre-save
resumeSchema.statics.setAsDefault = async function (
  resumeId: string,
  userId: string,
) {
  await this.updateMany({ userId }, { $set: { isDefault: false } });
  await this.findByIdAndUpdate(resumeId, { $set: { isDefault: true } });
};
```

**Why**: Pre-save hooks on every save is inefficient; better to have explicit method.

---

## Summary Table

| Bug                       | Severity | File                  | Line | Status   |
| ------------------------- | -------- | --------------------- | ---- | -------- |
| Missing openai import     | 🔴 P0    | aiService.ts          | 1    | CRITICAL |
| Wrong status filter       | 🔴 P0    | analyticsService.ts   | 21   | CRITICAL |
| JWT secret defaults       | 🔴 P0    | jwt.ts                | 5-6  | CRITICAL |
| Missing schema fields     | 🔴 P0    | Application.ts        | -    | CRITICAL |
| No file size validation   | 🟠 P1    | resumeService.ts      | 19   | HIGH     |
| Silent extraction failure | 🟠 P1    | resumeService.ts      | 30   | HIGH     |
| No pagination             | 🟠 P1    | applicationService.ts | 41   | HIGH     |
| Wrong HTTP status         | 🟡 P2    | auth.ts               | 15   | MEDIUM   |
| Prompt injection risk     | 🟡 P2    | aiService.ts          | 70   | MEDIUM   |
| Schema hook inefficient   | 🟡 P2    | Resume.ts             | 55   | MEDIUM   |
