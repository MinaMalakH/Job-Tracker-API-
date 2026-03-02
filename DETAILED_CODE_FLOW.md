# Detailed Code Flow & Request-Response Cycles

## 📡 END-TO-END FLOW ANALYSIS

---

## 1️⃣ USER REGISTRATION & LOGIN FLOW

### Request Path: `POST /api/auth/register`

```
CLIENT REQUEST
│
├─ POST /api/auth/register
│  Body: { email: "user@example.com", password: "securePass123" }
│
▼

[authRoute.ts]
│
├─ router.post("/register", register)  ← Routes to controller
│
▼

[authController.ts - register function]
│
├─ Calls: AuthService.register(req.body)
│
▼

[authService.ts - register method]
│
├─ 1. Check if email already exists
│    └─ User.findOne({ email })
│       └─ If found: throw BadRequestError("Email already in use")
│
├─ 2. Hash password
│    └─ hashPassword(password) [bcryptjs with 12 salt rounds]
│
├─ 3. Create user in MongoDB
│    └─ User.create({ email, password: hashedPassword, ... })
│
├─ 4. Remove password from response
│    └─ Destructure: { password: _, ...userWithoutPassword }
│
▼ Returns

[authController.ts - register function (continued)]
│
├─ res.status(201).json({
│    success: true,
│    data: user,  ← UserWithoutPassword
│    message: "User registered successfully"
│  })
│
▼

CLIENT RESPONSE
│
└─ Status 201 Created
   {
     "success": true,
     "data": {
       "_id": "...",
       "email": "user@example.com",
       "name": null,
       "phone": null,
       "createdAt": "2024-..."
     },
     "message": "User registered successfully"
   }
```

### Request Path: `POST /api/auth/login`

```
CLIENT REQUEST
│
├─ POST /api/auth/login
│  Body: { email: "user@example.com", password: "securePass123" }
│
▼

[authRoute.ts]
│
├─ router.post("/login", login)
│
▼

[authController.ts - login function]
│
├─ Calls: AuthService.login(email, password)
│
▼

[authService.ts - login method]
│
├─ 1. Find user by email (MUST use .select("+password"))
│    └─ User.findOne({ email }).select("+password")
│       └─ If not found: throw BadRequestError("Invalid credentials")
│
├─ 2. Compare password
│    └─ comparePassword(providedPassword, storedHashedPassword) [bcryptjs]
│       └─ If not match: throw BadRequestError("Invalid credentials")
│
├─ 3. Generate tokens
│    ├─ accessToken = generateAccessToken(user)  [15m expiry]
│    └─ refreshToken = generateRefreshToken(user)  [7d expiry]
│
├─ 4. Return without password
│    └─ { password: _, ...userWithoutPassword }
│
▼ Returns

[authController.ts - login function (continued)]
│
├─ res.status(200).json({
│    success: true,
│    data: { user, accessToken, refreshToken },
│    message: "Login successful"
│  })
│
▼

CLIENT RESPONSE
│
└─ Status 200 OK
   {
     "success": true,
     "data": {
       "user": {
         "_id": "...",
         "email": "user@example.com",
         "name": null,
         "phone": null,
         "createdAt": "2024-..."
       },
       "accessToken": "eyJhbGc...",  ← Valid for 15 min
       "refreshToken": "eyJhbGc..."   ← Valid for 7 days
     },
     "message": "Login successful"
   }
```

---

## 2️⃣ CREATE & MANAGE JOB APPLICATIONS FLOW

### Request Path: `POST /api/applications` (Create Application)

```
CLIENT REQUEST
│
├─ POST /api/applications
│  Headers: { Authorization: "Bearer <accessToken>" }
│  Body: {
│    company: "Google",
│    position: "Software Engineer",
│    location: "Mountain View, CA",
│    jobUrl: "https://...",
│    platform: "LinkedIn",
│    salaryRange: { min: 150000, max: 200000, currency: "USD" }
│  }
│
▼

[applicationsRoute.ts]
│
├─ router.use(authenticate)  ← All routes protected!
│
├─ router.post("/", createApplication)
│
▼

[authenticate middleware - auth.ts]
│
├─ 1. Extract token from "Authorization: Bearer <token>"
│    └─ authHeader.split(" ")[1]
│
├─ 2. Verify JWT signature
│    └─ verifyAccessToken(token)
│       └─ If valid: decoded = { userId, email, iat, exp }
│       └─ If invalid/expired: throw BadRequestError("Invalid or Expired Token") [Status 400]
│          ⚠️ BUG: Should be 401, not 400!
│
├─ 3. Attach user to request
│    └─ req.user = decoded
│
├─ 4. Call next()
│
▼

[applicationController.ts - createApplication function]
│
├─ 1. Check authentication
│    └─ if (!req.user) throw Error("User not authenticated")
│
├─ 2. Call ApplicationService.createApplication()
│
▼

[applicationService.ts - createApplication method]
│
├─ 1. Create timeline entry
│    └─ timeline: [{ status: "applied", date: new Date() }]
│
├─ 2. Insert into MongoDB
│    └─ Application.create({ userId, company, position, ... })
│
├─ 3. Auto-update lastUpdated (pre-save hook)
│    └─ applicationSchema.pre("save", function() {
│        this.lastUpdated = new Date();
│      })
│
▼ Returns

[applicationController.ts - createApplication function (continued)]
│
├─ res.status(201).json({
│    success: true,
│    data: application,
│    message: "Application created successfully"
│  })
│
▼

CLIENT RESPONSE
│
└─ Status 201 Created
   {
     "success": true,
     "data": {
       "_id": "507f1f77bcf86cd799439011",
       "userId": "507f1f77bcf86cd799439012",
       "company": "Google",
       "position": "Software Engineer",
       "location": "Mountain View, CA",
       "status": "applied",
       "appliedDate": "2024-03-02T...",
       "lastUpdated": "2024-03-02T...",
       "timeline": [{ "status": "applied", "date": "2024-03-02T..." }],
       "createdAt": "2024-03-02T..."
     },
     "message": "Application created successfully"
   }
```

### Request Path: `GET /api/applications` (Get All Applications with Filters)

```
CLIENT REQUEST
│
├─ GET /api/applications?status=interview&platform=LinkedIn&page=1&limit=20
│  Headers: { Authorization: "Bearer <accessToken>" }
│
▼

[applicationsRoute.ts]
│
├─ router.use(authenticate)
├─ router.get("/", getAllApplications)
│
▼

[authenticate middleware]  ← Same as above, validates token
│

▼

[applicationController.ts - getAllApplications]
│
├─ 1. Extract query parameters
│    └─ const { status, platform, company, sortBy } = req.query
│       ⚠️ BUG: No pagination parameters extracted! (page, limit)
│
├─ 2. Call ApplicationService.getUserApplications()
│    └─ Passes filters object
│
▼

[applicationService.ts - getUserApplications]
│
├─ 1. Build MongoDB query object
│    └─ query = { userId }
│    └─ if status: query.status = status
│    └─ if platform: query.platform = platform
│    └─ etc.
│
├─ 2. Build sort object
│    └─ Default: { appliedDate: -1 }  [Newest first]
│    └─ If sortBy="-lastUpdated": { lastUpdated: -1 }
│
├─ 3. Execute query
│    └─ Application.find(query).sort(sort).lean()
│       ⚠️ BUG: No .limit() or .skip() - returns ALL matching documents!
│       Problem: If user has 10,000 applications, all returned!
│
▼ Returns

[applicationController.ts - getAllApplications (continued)]
│
├─ res.status(200).json({
│    success: true,
│    data: applications,
│    count: applications.length  ← Total count
│  })
│
▼

CLIENT RESPONSE
│
└─ Status 200 OK
   {
     "success": true,
     "data": [
       {
         "_id": "...",
         "company": "Google",
         "position": "Software Engineer",
         "status": "interview",
         ...
       },
       ...
     ],
     "count": 42
   }
```

---

## 3️⃣ RESUME UPLOAD & EXTRACTION FLOW

### Request Path: `POST /api/resumes/upload` (Upload Resume)

```
CLIENT REQUEST
│
├─ POST /api/resumes/upload
│  Headers: 
│    Authorization: "Bearer <accessToken>"
│    Content-Type: multipart/form-data
│  Body: { file: <PDF or DOCX file> }
│
▼

[resumesRoute.ts]
│
├─ router.use(authenticate)
├─ router.post("/upload", upload.single("file"), uploadResume)
│  └─ Multer middleware parses file into req.file
│
▼

[authenticate middleware]  ← Validates token
│
▼

[Multer middleware]
│
├─ 1. Validate file type
│    └─ Only PDF, DOC, DOCX allowed
│
├─ 2. Validate file size
│    └─ ⚠️ BUG: NO SIZE LIMIT! Can upload > 100MB
│
├─ 3. Store in req.file
│    ├─ originalname: "my-resume.pdf"
│    ├─ buffer: <binary data>
│    ├─ mimetype: "application/pdf"
│    └─ size: <bytes>
│
▼

[resumeController.ts - uploadResume]
│
├─ Calls ResumeService.uploadResume(userId, file)
│
▼

[resumeService.ts - uploadResume]
│
├─ 1. Validate file
│    └─ if (!file.buffer || buffer.length === 0): throw BadRequestError
│       ⚠️ BUG: No size check! (MAX_FILE_SIZE 10MB)
│
├─ 2. Extract text from file
│    ├─ If PDF: PDFParse(file.buffer)
│    ├─ If DOCX: mammoth.extractRawText({ buffer })
│    └─ On error: console.error() then continue silently
│       ⚠️ BUG: Should warn user if extraction fails!
│
├─ 3. Prepare filename for Cloudinary
│    └─ Replace spaces, remove extension
│    └─ fileName = "my-resume"
│
├─ 4. Upload to Cloudinary
│    └─ cloudinary.uploader.upload_stream({
│         folder: "job-tracker/resumes",
│         public_id: "${userId}-${Date.now()}-${fileName}",
│         allowed_formats: ["pdf", "doc", "docx"],
│         type: "upload"
│       })
│
├─ 5. Generate two URLs
│    ├─ fileUrl: For preview in browser
│    └─ fileDownloadUrl: Forces download (with fl_attachment flag)
│
├─ 6. Save to MongoDB Resume collection
│    └─ Resume.create({
│         userId,
│         fileName,
│         fileUrl,
│         fileDownloadUrl,
│         publicId,
│         extractedText,
│         version: "v1",
│         isDefault: false
│       })
│
│    └─ Triggers pre-save hook: Set all other resumes isDefault=false
│       ⚠️ INEFFICIENT: Multiple DB queries on every resume save!
│
▼ Returns

[resumeController.ts - uploadResume (continued)]
│
├─ res.status(201).json({
│    success: true,
│    data: resume,
│    message: "Resume uploaded successfully"
│  })
│
▼

CLIENT RESPONSE
│
└─ Status 201 Created
   {
     "success": true,
     "data": {
       "_id": "...",
       "userId": "...",
       "fileName": "my-resume.pdf",
       "fileUrl": "https://res.cloudinary.com/...",
       "fileDownloadUrl": "https://res.cloudinary.com/.../fl_attachment:my-resume.pdf/...",
       "publicId": "job-tracker/resumes/user-id-timestamp-my-resume",
       "extractedText": "[Large text content extracted from PDF/DOCX...]",
       "version": "v1",
       "uploadedAt": "2024-03-02T...",
       "isDefault": false
     },
     "message": "Resume uploaded successfully"
   }
```

---

## 4️⃣ AI-POWERED RESUME ANALYSIS FLOW

### Request Path: `POST /api/ai/analyze-resume` (Queue-Based Processing)

```
CLIENT REQUEST
│
├─ POST /api/ai/analyze-resume
│  Headers: { Authorization: "Bearer <accessToken>" }
│  Body: {
│    resumeId: "607f1f77bcf86cd799439011",
│    jobDescription: "We're looking for...",
│    applicationId: "507f1f77bcf86cd799439012"
│  }
│
▼

[aiRoute.ts]
│
├─ router.use(authenticate)
├─ router.post("/analyze-resume", analyzeResume)
│
▼

[authenticate middleware]  ← Same as before
│
▼

[aiController.ts - analyzeResume]
│
├─ 1. Validate input
│    └─ if (!resumeText && !resumeId): throw BadRequestError()
│
├─ 2. Get resume text
│    ├─ If resumeId provided:
│    │  └─ ResumeService.getResumeById(userId, resumeId)
│    │     └─ Resume.findOne({ _id: resumeId, userId })
│    │     └─ Extract resume.extractedText
│    │
│    └─ Or use provided text directly
│
├─ 3. Queue job (Bull + Redis)
│    └─ aiQueue.add("analyze-resume", {
│         resumeId,
│         resumeText,
│         jobDescription,
│         applicationId,
│         userId
│       })
│
│    └─ Returns job object with job.id
│
├─ 4. Return immediately (202 Accepted)
│    └─ res.status(202).json({
│         success: true,
│         data: { jobId: job.id, status: "queued" },
│         message: "Analysis job queued. Use /api/ai/job/{jobId} to check status"
│       })
│
▼

CLIENT RESPONSE (Immediate)
│
└─ Status 202 Accepted
   {
     "success": true,
     "data": {
       "jobId": "123",
       "status": "queued"
     },
     "message": "Analysis job queued. Use /api/ai/job/123 to check status later."
   }

▼

[BACKGROUND PROCESSING - aiProcessor.ts]
│
├─ Bull Queue Worker picks up job
│
├─ aiQueue.process("analyze-resume", async (job) => { ... })
│
├─ 1. Load resume text (if resumeId given)
│    └─ Resume.findById(resumeId)
│    └─ Validate ownership: resume.userId === userId
│    └─ Use resume.extractedText
│
├─ 2. Call AI Service
│    └─ AiService.analyzeResume(resumeText, jobDescription)
│
▼

[aiService.ts - analyzeResume]
│
├─ 1. Build prompt (with user data injected)
│    ├─ ⚠️ BUG: No escaping of resumeText/jobDescription!
│    │  Risk: Prompt injection attacks
│    │
│    └─ const prompt = `
│         Analyze this resume against job description...
│
│         RESUME:
│         """
│         ${resumeText}  ← Could contain """ or injection payloads
│         """
│
│         JOB DESCRIPTION:
│         """
│         ${jobDescription}  ← Could contain """ or injection payloads
│         """
│         `;
│
├─ 2. Call OpenAI/Groq API
│    └─ ⚠️ BUG: Missing import for openai!
│    └─ openai.chat.completions.create({
│         model: "llama-3.3-70b-versatile",
│         messages: [
│           { role: "system", content: "You are a resume consultant..." },
│           { role: "user", content: prompt }
│         ],
│         temperature: 0.4,
│         max_tokens: 1500,
│         response_format: { type: "json_object" }
│       })
│
├─ 3. Parse JSON response
│    └─ response = completion.choices[0].message.content
│    └─ analysis = JSON.parse(response)
│
│    └─ Validate structure:
│        ├─ analysis.keywords (array)
│        ├─ analysis.missingKeywords (array)
│        ├─ analysis.skillsToEmphasize (array)
│        ├─ analysis.experienceToHighlight (array)
│        ├─ analysis.recommendedChanges (array)
│        └─ analysis.matchScore (0-100 number)
│
├─ 4. Save to Application (if applicationId provided)
│    └─ Application.findOneAndUpdate(
│         { _id: applicationId, userId },
│         { $set: {
│             aiSuggestions: {
│               ...analysis,
│               generatedAt: new Date()
│             }
│           }
│         }
│       )
│
▼

[aiProcessor.ts - Job Complete]
│
├─ Log: "Job ${job.id} completed"
├─ Bull marks job as succeeded
├─ Job can be queried via /api/ai/job/{jobId}
│

▼

CLIENT (Poll for Result)
│
├─ GET /api/ai/job/123
│  Headers: { Authorization: "Bearer <accessToken>" }
│
│  Response:
│  {
│    "success": true,
│    "data": {
│      "jobId": "123",
│      "status": "completed",
│      "result": {
│        "keywords": ["python", "nodejs", "mongodb"],
│        "missingKeywords": ["kubernetes", "docker"],
│        "skillsToEmphasize": ["API design", "database optimization"],
│        "experienceToHighlight": ["Led 3-person team to deliver..."],
│        "recommendedChanges": [
│          "Add cloud deployment experience",
│          "Quantify impact of optimizations"
│        ],
│        "matchScore": 82
│      }
│    }
│  }
│
```

---

## 5️⃣ AUTOMATIC FOLLOW-UP REMINDER FLOW

### Scheduled Task: `runDailyFollowUps()` (Cron - 9 AM Daily)

```
[index.ts - Server Startup]
│
├─ import runDailyFollowUps from "./jobs/followUpCron"
├─ runDailyFollowUps()  ← Schedules cron job
│
▼

[followUpCron.ts]
│
├─ cron.schedule("0 9 * * * ", async () => {
│    console.log("Running daily follow-up check...");
│
│    ├─ 1. Get current date
│    │  └─ today = new Date()
│    │
│    ├─ 2. Query applications needing follow-up
│    │  └─ Application.find({
│    │       status: { $in: ["applied", "screening"] },
│    │       followUpSent: { $ne: true },  ← ⚠️ BUG: Field doesn't exist in schema!
│    │       appliedDate: {
│    │         $lte: new Date(today - 7 days)  ← Older than 7 days
│    │       }
│    │     })
│    │
│    ├─ 3. For each application:
│    │  └─ await NotificationService.sendFollowUpReminder(application)
│    │
│    └─ 4. Log completed count
│       └─ console.log(`Processed ${applications.length} follow-up reminders`)
│  })
│
▼

[notificationService.ts - sendFollowUpReminder]
│
├─ 1. Get user by ID
│    └─ User.findById(application.userId)
│
├─ 2. Build email options
│    └─ {
│         from: process.env.EMAIL_USER,
│         to: user.email,
│         subject: `Follow-up Reminder: ${position} at ${company}`,
│         html: `<p>Hi ${user.name}...</p>`
│       }
│
├─ 3. Send email via Nodemailer
│    └─ ⚠️ NO ERROR HANDLING: If email fails, notification still saved!
│    └─ transporter.sendMail(mailOptions)
│
├─ 4. Save notification to MongoDB
│    └─ Notification.create({
│         userId: application.userId,
│         applicationId: application._id,
│         type: "follow_up",
│         message: `Follow-up reminder sent for ${position} at ${company}`,
│         sentAt: now,
│         read: false
│       })
│
├─ 5. Mark follow-up as sent
│    └─ ⚠️ BUG: Updating non-existent field!
│    └─ Application.findByIdAndUpdate(application._id, {
│         $set: {
│           followUpSent: true,  ← Field doesn't exist in schema!
│           followUpDate: new Date()  ← Field doesn't exist in schema!
│         }
│       })
│
│  Result: Field update silently fails; no error thrown
│  Impact: Cron job will send same reminder multiple times!
│
▼

[USER RECEIVES EMAIL]
│
└─ Gmail inbox:
   From: noreply@jobtracker.com
   Subject: Follow-up Reminder: Software Engineer at Google
   Body: "It's been over a week since you applied to Software Engineer at Google.
          No response yet — consider sending a polite follow-up email!"

```

---

## 6️⃣ ANALYTICS & MONTHLY STATS FLOW

### Request Path: `GET /api/applications/stats` (Calculate & Store Stats)

```
CLIENT REQUEST
│
├─ GET /api/applications/stats
│  Headers: { Authorization: "Bearer <accessToken>" }
│
▼

[applicationController.ts - getStats]
│
├─ 1. Trigger stat update (fresh data)
│    └─ AnalyticService.updateMonthlyStats(userId)
│
├─ 2. Fetch stored stats
│    └─ AnalyticService.getUserStats(userId)
│
▼

[analyticsService.ts - updateMonthlyStats]
│
├─ 1. Get current month range
│    └─ monthStart = new Date(year, month, 1)
│
├─ 2. Query applications from this month
│    └─ Application.find({
│         userId: ObjectId(userId),
│         appliedDate: { $gte: monthStart }
│       })
│
├─ 3. Calculate statistics
│    └─ const stats = {
│         total_applications: apps.length,
│         applied_count: apps.filter(a => a.status === "applied").length,
│         screening_count: apps.filter(a => a.status === "screening").length,
│         interview_count: apps.filter(a => a.status === "interview").length,
│         offer_count: apps.filter(a => a.status === "offer").length,
│         rejected_count: apps.filter(a => a.status === "offer").length,  ← ⚠️ BUG!
│         avg_response_days: /* calculation */
│       }
│
│    BUG IMPACT:
│    ├─ rejected_count is WRONG (duplicates offer_count)
│    ├─ offer_count is counted twice
│    ├─ Statistics dashboard shows incorrect numbers
│
├─ 4. Upsert to PostgreSQL
│    └─ pgPool.query(`
│         INSERT INTO application_stats(user_id, month, ..., rejected_count)
│         VALUES($1, $2, ..., $9)
│         ON CONFLICT (user_id, month) DO UPDATE
│         SET rejected_count = EXCLUDED.rejected_count, ...
│       `, [userId, monthStart, ..., stats.rejected_count])
│
│    Result: WRONG DATA persisted in PostgreSQL!
│
▼

[analyticsService.ts - getUserStats]
│
├─ 1. Query PostgreSQL
│    └─ SELECT * FROM application_stats
│       WHERE user_id = $1
│       ORDER BY month DESC
│
│    └─ Returns monthly stats for all months
│
▼ Returns

[applicationController.ts - getStats (continued)]
│
├─ res.status(200).json({
│    success: true,
│    data: stats,
│    message: "Application statistics retrieved"
│  })
│
▼

CLIENT RESPONSE
│
└─ Status 200 OK
   {
     "success": true,
     "data": [
       {
         "user_id": "...",
         "month": "2024-03-01",
         "total_applications": 15,
         "applied_count": 5,
         "screening_count": 3,
         "interview_count": 4,
         "offer_count": 2,
         "rejected_count": 2,  ← WRONG! (Should be 0 if no rejections)
         "avg_response_days": 5.2
       },
       ...
     ],
     "message": "Application statistics retrieved"
   }
```

---

## Error Flow When Things Go Wrong

### Scenario: User Tries to Access Protected Route Without Token

```
CLIENT REQUEST
│
├─ GET /api/applications
│  Headers: {}  ← NO Authorization header
│
▼

[applicationsRoute.ts]
│
├─ router.use(authenticate)
│
▼

[authenticate middleware - auth.ts]
│
├─ const authHeader = req.headers.authorization
│ └─ authHeader = undefined
│
├─ if (!authHeader || !authHeader.startsWith("Bearer")) {
│    return next(new BadRequestError("No token Provided"))
│  }
│
│  ⚠️ BUG: Should be UnauthorizedError with 401 status!
│  Current: BadRequestError with 400 status
│
▼

[errorHandler middleware - errorHandler.ts]
│
├─ Catches BadRequestError
├─ statusCode = 400  [Should be 401]
├─ message = "No token Provided"
│
├─ console.error(`[400] GET /api/applications - No token Provided`)
│
├─ res.status(400).json({
│    success: false,
│    error: "No token Provided"
│  })
│
▼

CLIENT RESPONSE
│
└─ Status 400 Bad Request  [Should be 401]
   {
     "success": false,
     "error": "No token Provided"
   }


CLIENT INTERPRETATION: "My request was malformed" ✗
CORRECT INTERPRETATION:  "I need to authenticate first" ✓
```

---

## Summary of Data Flows

| Flow | Async? | Queue | Database Writes | Key Files |
|------|--------|-------|-----------------|-----------|
| Auth Register/Login | No | N/A | MongoDB | authService, JWT |
| Create Application | No | N/A | MongoDB | applicationService |
| Upload Resume | Yes | Cloudinary | MongoDB | resumeService, Multer |
| AI Analysis | **Yes** | Bull Queue | MongoDB | aiService, aiProcessor |
| Send Follow-up | **Yes** | Cron | MongoDB, Email | notificationService |
| Calculate Stats | No | N/A | MongoDB → PostgreSQL | analyticsService |

**Critical Dependencies**:
- ✅ MongoDB - Application, Resume, User, Notification data
- ✅ PostgreSQL - Monthly statistics
- ✅ Redis - Bull queue for AI processing
- ✅ Cloudinary - Resume file uploads
- ✅ OpenAI/Groq - LLM API for AI analysis
- ✅ Gmail SMTP - Email notifications
- ✅ Node-Cron - Daily scheduler

