# Job Tracker API - Complete Code Review & Analysis

## 📋 Project Overview

**Type**: Express.js TypeScript API for job application tracking  
**Stack**: Express, MongoDB, PostgreSQL, Redis, OpenAI/Groq, Node-Cron  
**Key Features**: Authentication, Resume Uploads, AI Analysis, Job Tracking, Follow-up Notifications

---

## 🔄 Code Flow Architecture

```
┌─ index.ts (Entry Point)
│  ├─ Connects MongoDB & PostgreSQL
│  ├─ Initializes Routes
│  ├─ Applies Middleware (Auth, Error Handler)
│  └─ Starts Express Server
│
├─ AUTH FLOW
│  ├─ authRoute.ts → authController.ts → authService.ts
│  ├─ Uses JWT tokens (access: 15m, refresh: 7d)
│  ├─ Password hashing with bcryptjs (12 rounds)
│  └─ Middleware: authenticate.ts validates Bearer tokens
│
├─ APPLICATION MANAGEMENT FLOW
│  ├─ applicationsRoute.ts → applicationController.ts
│  ├─ applicationService.ts (CRUD operations)
│  ├─ Application model (MongoDB)
│  └─ analyticsService.ts (PostgreSQL stats)
│
├─ RESUME MANAGEMENT FLOW
│  ├─ resumesRoute.ts → resumeController.ts
│  ├─ resumeService.ts (upload, extract text)
│  ├─ Resume model (MongoDB)
│  └─ Cloudinary integration for file storage
│
├─ AI PROCESSING FLOW
│  ├─ aiRoute.ts → aiController.ts
│  ├─ Queue-based: Bull + Redis
│  ├─ aiQueue.ts → aiProcessor.ts
│  ├─ aiService.ts (OpenAI/Groq calls)
│  └─ Jobs: analyze-resume, generate-cover-letter
│
├─ NOTIFICATION FLOW
│  ├─ followUpCron.ts (Daily 9 AM schedule)
│  ├─ notificationService.ts (Email + DB)
│  ├─ Nodemailer integration (Gmail)
│  └─ Notification model (MongoDB)
│
└─ ERROR HANDLING
   └─ errorHandler.ts middleware catches all errors
```

---

## 🐛 CRITICAL BUGS (Must Fix Immediately)

### 1. **CRITICAL: Wrong Status Filter in analyticsService.ts** ⚠️

**Location**: [src/services/analyticsService.ts](src/services/analyticsService.ts#L21)  
**Issue**: Counting "offer" status twice instead of "rejected"

```typescript
// ❌ WRONG
rejected_count: apps.filter((a) => a.status === "offer").length,

// ✅ SHOULD BE
rejected_count: apps.filter((a) => a.status === "rejected").length,
```

**Impact**: Analytics dashboard shows incorrect rejection counts; statistics are unreliable  
**Severity**: HIGH

---

### 2. **CRITICAL: Missing Schema Field Referenced in Cron Job**

**Location**: [src/jobs/followUpCron.ts](src/jobs/followUpCron.ts) + [src/models/Application.ts](src/models/Application.ts)  
**Issue**: Cron job marks `followUpSent: true` but field doesn't exist in schema

```typescript
// In followUpCron.ts, line 15:
followUpSent: { $ne: true },  // ← Field doesn't exist in schema!

// In notificationService.ts, line 41:
$set: { followUpSent: true, followUpDate: new Date() },  // ← Updating non-existent field
```

**Impact**: Follow-up reminders will send multiple times (no deduplication)  
**Severity**: HIGH

---

### 3. **CRITICAL: Weak JWT Secrets with Fallback Defaults**

**Location**: [src/utils/jwt.ts](src/utils/jwt.ts#L5-L6)  
**Issue**: Default JWT secrets exposed in code

```typescript
const ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_SECRET || "access-secret-change-me";
const REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_SECRET || "refresh-secret-change-me";
```

**Impact**: If env variables not set, tokens are easily forged  
**Severity**: CRITICAL - Security vulnerability

---

### 4. **ERROR: Missing Import in aiService.ts**

**Location**: [src/services/aiService.ts](src/services/aiService.ts#L1)  
**Issue**: Uses `openai` but doesn't import it

```typescript
// Missing at top of file:
import openai from "../config/openai";
```

**Impact**: Code will crash at runtime when calling OpenAI API  
**Severity**: CRITICAL

---

## ⚠️ HIGH PRIORITY ISSUES

### 5. **Schema Inconsistency: Application Model**

**Location**: [src/models/Application.ts](src/models/Application.ts#L75)  
**Issue**: `lastUpdated` auto-updated on every save, but pre-save hook may cause infinite loops

```typescript
applicationSchema.pre("save", async function () {
  this.lastUpdated = new Date();
});
```

**Problem**: Might trigger save hooks multiple times; Mongoose won't trigger pre-save for `findOneAndUpdate()`  
**Better Approach**: Use `set` timestamps in schema or handle in service layer only

---

### 6. **Type Safety Issue: Array Parameter Handling**

**Location**: [src/controllers/applicationController.ts](src/controllers/applicationController.ts#L79)  
**Pattern throughout**:

```typescript
Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
```

**Issue**: `req.params.id` is ALWAYS a string, never an array. This is defensive but unnecessary code.  
**Better**: Remove these checks or understand why they're there

---

### 7. **Missing Validation in Resume Upload**

**Location**: [src/services/resumeService.ts](src/services/resumeService.ts#L19-L20)  
**Issue**: File size not validated

```typescript
static async uploadResume(
  userId: string,
  file: Express.Multer.File,
  version?: string,
): Promise<IResume> {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw new BadRequestError("No valid file uploaded");
  }
  // ❌ NO FILE SIZE CHECK - Could upload huge files!
```

**Impact**: Cloudinary quota abuse; DOS attack vector  
**Better**: Add `const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB`

---

### 8. **Incomplete Resume Text Extraction Error Handling**

**Location**: [src/services/resumeService.ts](src/services/resumeService.ts#L30-L40)

```typescript
try {
  if (file.mimetype === "application/pdf") {
    const data = await PDFParse(file.buffer);
    extractedText = data.text || "";
  } else if (...) {
    // ...
  }
} catch (error: any) {
  console.error("Text extraction failed:", error);  // ❌ Silently continues!
}
```

**Issue**: If text extraction fails, continues with empty `extractedText`  
**Impact**: Resume analysis will fail later with confusing error "No resume text available"  
**Better**: Either throw error early or warn user extraction failed

---

## 🔐 SECURITY ISSUES

### 9. **Email Credentials Exposed in Plain Environment**

**Location**: [src/config/nodemailer.ts](src/config/nodemailer.ts)

```typescript
auth: {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,  // ❌ App password stored as env var
}
```

**Issue**: If `.env` is accidentally committed, Gmail credentials are exposed  
**Better**: Use OAuth2 or encrypted secrets management

---

### 10. **No Rate Limiting on AI API Calls**

**Location**: [src/services/aiService.ts](src/services/aiService.ts)  
**Issue**: Any authenticated user can spam AI API calls  
**Impact**: Expensive API costs, quota exhaustion  
**Better**: Add rate limiting middleware or per-user quotas

---

### 11. **SQL Injection Risk (Minor)**

**Location**: [src/services/analyticsService.ts](src/services/analyticsService.ts#L37-L50)  
**Issue**: Uses parameterized queries ✅ (Actually GOOD) - but direct string interpolation elsewhere could be risk  
**Status**: Currently safe due to parameterized queries

---

## 🚨 LOGIC ERRORS

### 12. **Incorrect Cron Job Schedule Format**

**Location**: [src/jobs/followUpCron.ts](src/jobs/followUpCron.ts#L7)

```typescript
cron.schedule("0 9 * * * ", async () => {  // ⚠️ Extra space + extra asterisk?
```

**Issue**: Cron format is "minute hour day month weekday" - this looks wrong  
**Correct Format**: `"0 9 * * *"` means "9:00 AM every day"  
**Current**: Has trailing space, might cause parse error  
**Severity**: Medium - will probably still work but sloppy

---

### 13. **Resume Pre-save Hook Typo & Logic**

**Location**: [src/models/Resume.ts](src/models/Resume.ts#L55)

```typescript
// Typo in comment: "Ensure only onw default per user"
// Should be: "Ensure only one default per user"

resumeSchema.pre("save", async function () {
  if (this.isDefault) {
    await this.collection.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } },
    );
  }
});
```

**Issue**:

- This causes multiple DB queries on every resume save
- Should use atomic MongoDB operations instead
- `this.collection` might not be available in all Mongoose versions

---

### 14. **Authentication Error Messages Are Generic**

**Location**: [src/middleware/auth.ts](src/middleware/auth.ts#L17)

```typescript
if (!authHeader || !authHeader.startsWith("Bearer")) {
  return next(new BadRequestError("No token Provided"));
}
```

**Issue**: Using 400 (Bad Request) instead of 401 (Unauthorized)  
**Impact**: Client can't distinguish between bad input vs auth failure  
**Better**: Create `UnauthorizedError` class

---

### 15. **Service Layer Doesn't Validate MongoDB ObjectIds Consistently**

**Location**: [src/services/applicationService.ts](src/services/applicationService.ts#L69-L74)

```typescript
static async getApplicationById(
  userId: string,
  applicationId: string,
): Promise<IApplication | null> {
  if (!Types.ObjectId.isValid(applicationId)) {
    throw new BadRequestError("Invalid Application ID");
  }
  // ...
}
```

**Good Practice**: But not done everywhere (e.g., in updateStatus)

---

## 📊 CODE QUALITY ISSUES

### 16. **Inconsistent Error Handling Patterns**

- Some places: `throw new BadRequestError(...)`
- Some places: `throw new Error(...)` then caught by middleware
- Some places: `console.error()` then silently continue

**Example**:

```typescript
// authController.ts
if (!req.user) {
  throw new Error("User not authenticated"); // ❌ Generic Error
}

// Should be consistent across all files
```

---

### 17. **Missing TypeScript Interfaces**

**Location**: Multiple query parameter handlers

```typescript
// In applicationController.ts
const { status, platform, company, sortBy } = req.query;

const filters = {
  status: status as string | undefined, // ❌ Manual casting
  platform: platform as string | undefined,
  // ...
};
```

**Better**: Create `ApplicationFilters` interface

---

### 18. **Unused/Redundant Code in aiProcessor.ts**

**Location**: [src/queues/aiProcessor.ts](src/queues/aiProcessor.ts)

```typescript
// Processor checks if resume exists:
if (!resume || resume.userId.toString() !== userId) {
  throw new Error("Resume not found or not owned by user");
}

// But ResumeService.getResumeById already does this check!
```

**Issue**: Duplicate security validation

---

### 19. **No Input Sanitization**

**Locations**: Resume upload, Application creation, AI prompts

```typescript
// In aiService.ts, the prompt includes user input:
const prompt = `
Resume: """${resumeText}"""  // ← What if resumeText contains """ ?
Job Description: """${jobDescription}"""  // ← Prompt injection risk
`;
```

**Issue**: No escaping or sanitization of LLM prompts  
**Impact**: Potential prompt injection attacks

---

### 20. **No Pagination on Large Data Queries**

**Location**: [src/services/applicationService.ts](src/services/applicationService.ts#L41)

```typescript
static async getUserApplications(userId: string, filters: {...}): Promise<IApplication[]> {
  // ... no limit() or skip() for pagination!
  return Application.find(query).sort(sort).lean();  // ❌ Returns ALL matches
}
```

**Issue**: If user has 10,000 applications, API returns all at once  
**Fix**: Add pagination parameters (page, limit)

---

## ✅ POSITIVE PRACTICES (Well Done)

1. ✅ Good separation of concerns (routes → controllers → services)
2. ✅ Using lean() queries for read-only operations (performance)
3. ✅ Parameterized SQL queries for PostgreSQL (prevents SQL injection)
4. ✅ Password hashing with bcryptjs (12 rounds is secure)
5. ✅ JWT token expiration times are reasonable
6. ✅ Resume file extraction for both PDF and DOCX
7. ✅ Queue-based AI processing (doesn't block HTTP requests)
8. ✅ Cron job for automatic follow-up reminders
9. ✅ Environment variable usage (mostly)
10. ✅ Error middleware catches all unhandled errors

---

## 🔧 REQUIRED FIXES (Priority Order)

| Priority | Issue                                            | Fix Time |
| -------- | ------------------------------------------------ | -------- |
| 🔴 P0    | Missing openai import in aiService.ts            | 2 min    |
| 🔴 P0    | Wrong status filter in analyticsService.ts       | 2 min    |
| 🔴 P0    | JWT secret defaults in jwt.ts                    | 5 min    |
| 🔴 P0    | Missing followUpSent field in Application schema | 10 min   |
| 🟠 P1    | No file size validation in resume upload         | 5 min    |
| 🟠 P1    | No pagination in getUserApplications             | 10 min   |
| 🟠 P1    | Add rate limiting for AI API calls               | 15 min   |
| 🟡 P2    | Error type should be 401 not 400 for auth        | 10 min   |
| 🟡 P2    | Prompt injection risk in AI prompts              | 10 min   |
| 🟡 P2    | Resume text extraction error handling            | 5 min    |

---

## 📝 Testing Gaps

1. **No unit tests** found in test directory (only setup.ts)
2. **No integration tests** for auth flow
3. **No validation tests** for input sanitization
4. **No concurrency tests** for Redis queue

---

## 🚀 Performance Optimization Opportunities

1. Add database indexes for frequently queried fields
2. Implement caching layer (Redis) for user stats
3. Batch email sending in notification service
4. Add request logging/monitoring
5. Implement request timeout limits

---

## 📚 Configuration Issues

- `.env` variables checking but not all used (e.g., NODE_ENV)
- Missing default values for optional configs
- No config validation on startup
