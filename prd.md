# REVIEWBUDDY
## Product Requirements Document (PRD)
### QR Code + NFC Based Smart Review Generation Platform

**Document Version:** 2.0  
**Project Name:** ReviewBuddy (Temporary Name)  
**Product Type:** Internal Review Generation and Management Platform  
**Development Stage:** MVP / V1  
**Initial Target Market:** Local Businesses in India  
**Initial Language:** English  
**Primary Development Tool:** Antigravity AI

---

# 1. PROJECT OVERVIEW

## 1.1 Product Vision

ReviewBuddy is a QR code and NFC-based review generation platform designed to help local businesses make it easier for their customers to write genuine reviews on Google.

Businesses receive customized QR codes and NFC tags. Customers can scan a QR code or tap an NFC tag to open a personalized business page.

On this page, customers answer a set of customized questions about their actual experience. Based on their answers, the system generates a natural-language review draft that customers can preview, edit, copy, and voluntarily submit through the business's Google review page.

The platform will initially be managed entirely by an administrator.

Business owners will not have individual accounts or dashboard access in V1.

## 1.2 Core Objective

Build a lightweight, affordable, scalable and easy-to-maintain platform that:

- Helps customers write reviews more easily.
- Allows customized questionnaires for different businesses.
- Generates natural review drafts without paid AI APIs.
- Supports QR codes and NFC tags.
- Allows multiple QR/NFC placements for one business.
- Provides an internal administrator dashboard.
- Tracks anonymous customer interactions.
- Can migrate to another hosting provider or database in the future.

## 1.3 Product Scope

The MVP is an internally operated product, not a public self-service SaaS platform.

The administrator will manually onboard businesses, configure their profiles, create questionnaires, generate QR codes, and configure NFC tags.

Future versions may introduce business-owner accounts, subscription management, additional languages, advanced analytics and automated onboarding.

---

# 2. TECHNOLOGY STACK

The application MUST use the following technology stack.

## 2.1 Frontend

**React.js and tailwind css**

Responsibilities:

- Administrator dashboard.
- Business management interface.
- Questionnaire configuration.
- QR/NFC management interface.
- Analytics dashboard.
- Customer-facing review experience.
- Responsive layouts.

Use reusable components and a consistent design system.

React Router should be used for frontend routing.

Use a lightweight state management approach. React Context or another simple solution is sufficient for the MVP. Do not introduce unnecessary state management libraries.

## 2.2 Backend

**Node.js + Express.js**

Responsibilities:

- REST API.
- Administrator authentication.
- Business CRUD operations.
- Questionnaire management.
- Review generation.
- QR/NFC identifier management.
- Redirect handling.
- Analytics tracking.
- Database operations.
- Input validation and security.

The backend must be organized into routes, controllers, services, middleware and models.

## 2.3 Database

**MongoDB Atlas**

Use MongoDB Atlas as the primary database.

**ODM: Mongoose**

All database operations must be performed through Mongoose models and a dedicated database access layer.

Requirements:

- Use environment variables for the MongoDB connection string.
- Create reusable Mongoose schemas.
- Use proper references between related documents.
- Add indexes for frequently queried fields.
- Use pagination for large datasets.
- Validate data before database operations.
- Handle database errors consistently.

Do not hardcode database credentials.

## 2.4 Future Database Migration

The architecture should make future database migration manageable.

MongoDB Atlas is the initial database. The system may later migrate to another MongoDB provider or to PostgreSQL through Neon or Supabase.

To support this:

- Keep database operations inside repositories or dedicated data-access services.
- Keep business logic separate from Mongoose models.
- Avoid placing Mongoose queries directly inside frontend code or unrelated business services.
- Keep IDs and relationships consistent.
- Document the data model.
- Provide database backup and export procedures.

Important: Migration to PostgreSQL would require data transformation and changes to the database implementation. Do not claim that changing the connection URL alone is sufficient.

## 2.5 Supporting Libraries

Suggested libraries:

- React Router: frontend navigation.
- Axios or Fetch: API communication.
- Mongoose: MongoDB ODM.
- Zod or Joi: backend request validation.
- bcrypt or bcryptjs: password hashing.
- jsonwebtoken or secure session-based authentication: administrator authentication.
- qrcode: QR code generation.
- Recharts or Chart.js: analytics charts.
- Helmet: Express security headers.
- express-rate-limit: rate limiting.
- Multer: image uploads.
- dotenv: environment configuration.

Choose compatible, maintained versions and avoid unnecessary dependencies.

---

# 3. USER ROLES

V1 will have two types of users.

## 3.1 Administrator

The administrator has complete control over the application.

Permissions:

- Secure login and logout.
- View dashboard.
- Create businesses.
- Edit businesses.
- Activate or deactivate businesses.
- Upload business logos.
- Configure Google review URLs.
- Create customized questionnaires.
- Configure review tone and length.
- Generate QR codes.
- Manage NFC identifiers.
- View analytics.
- Search and paginate business records.
- View individual business information.

There should initially be one administrator account.

The application should be designed so additional administrator accounts can be introduced later.

## 3.2 Customer

Customers do not need accounts.

They can:

- Scan a QR code.
- Tap an NFC tag.
- Open the business landing page.
- Answer questions.
- Generate a review draft.
- Preview and edit the draft.
- Copy the draft.
- Continue to the Google review page.

No customer registration should be required.

## 3.3 Business Owner

Business-owner accounts are explicitly excluded from V1.

All business configurations are handled by the administrator.

---

# 4. COMPLETE CUSTOMER JOURNEY

The following is the primary customer workflow.

1. Customer scans the business QR code or taps an NFC tag.
2. Application identifies the business and tracking source.
3. Customer sees the business landing page.
4. Customer clicks the start button.
5. Customer answers customized questions.
6. Application generates a review draft.
7. Customer previews and edits the draft.
8. Customer clicks the copy button.
9. Application copies the review to the clipboard.
10. Customer clicks Continue to Google.
11. Application redirects to the business's Google review page.
12. Customer manually pastes, edits if necessary, and submits the review.

The customer must remain in control of the final review.

The application must never automatically publish reviews or attempt to manipulate Google's review interface.

---

# 5. CUSTOMER-FACING INTERFACE

## 5.1 Business Landing Page

Create a clean, modern and mobile-first landing page.

Required elements:

- Business logo.
- Business name.
- Short welcome message.
- Brief explanation of the process.
- Primary Start button.

Example:

"How was your experience at ABC Restaurant?

We would love to hear about your experience.

Answer a few quick questions and create your own review.

[Share Your Experience]"

The business name, logo and welcome message must come from the database.

Do not hardcode business details.

## 5.2 Questionnaire Interface

Every business must have its own completely customized questionnaire.

The administrator must be able to configure questions independently for each business.

Supported question types:

1. Single-choice question.
2. Multiple-choice question.
3. Optional short text response.

Each question should support:

- Question title.
- Answer options.
- Required/optional setting.
- Display order.
- Active/inactive status.
- Question type.

The administrator must be able to:

- Add questions.
- Edit questions.
- Delete questions.
- Reorder questions.
- Add answer options.
- Edit answer options.
- Remove answer options.
- Mark questions as required or optional.

There should be no restriction requiring businesses to use predefined industry templates.

Every questionnaire must be customizable from scratch.

### Responsive design

The default questionnaire should use modern stacked question cards.

A table-style layout may be supported as an optional future layout, but the interface must remain easy to use on mobile screens.

Include:

- Progress indicator.
- Clear selected-answer states.
- Large touch-friendly controls.
- Back and Next buttons where appropriate.
- Validation for required questions.

## 5.3 Review Tone Settings

The administrator can configure the desired writing style for each business.

Available tones:

- Natural and conversational.
- Friendly and casual.
- Professional.
- Enthusiastic.
- Simple and straightforward.

Tone controls wording and writing style only.

It must never determine whether the review is positive or negative.

## 5.4 Review Length Settings

Available options:

**Short:** Approximately 1–2 sentences.

**Medium:** Approximately 3–4 sentences.

**Detailed:** Approximately 5–6 sentences.

The administrator configures the default length for each business.

---

# 6. REVIEW GENERATION ENGINE

## 6.1 Core Requirement

The application must generate review drafts without relying on external AI services.

Do not integrate:

- OpenAI API.
- Gemini API.
- Claude API.
- Other paid AI generation services.

Use a deterministic rule-based review-generation engine.

## 6.2 Generation Process

1. Receive questionnaire answers.
2. Validate submitted answers.
3. Identify the selected answer options.
4. Match answers to predefined phrase templates.
5. Apply the configured tone.
6. Apply the configured length.
7. Combine suitable sentences.
8. Remove duplicated or conflicting statements.
9. Generate the final review draft.

## 6.3 Template Library

Create a reusable template library.

Templates should be categorized by:

- Business category.
- Question type.
- Answer category.
- Review tone.
- Sentence purpose.

The system should support multiple variations for similar answers to reduce repetitive output.

## 6.4 Review Accuracy Rules

The generator must:

- Use only customer-provided information.
- Never invent products or services.
- Never invent staff names.
- Never invent customer experiences.
- Never automatically turn negative feedback into positive feedback.
- Never force a positive review tone when the answers do not support it.
- Never add unsupported claims.
- Allow the customer to edit the draft.
- Allow the customer to discard the generated draft.

If there is insufficient information to generate a meaningful draft, show a helpful message and allow the customer to add more detail.

---

# 7. REVIEW PREVIEW AND COPY EXPERIENCE

After generation, display a dedicated review preview page.

Required elements:

- Generated review text.
- Editable text area.
- Copy Review button.
- Continue to Google button.
- Clear instructions.

Example:

"Your review is ready!

You can make any changes before sharing it.

[Editable Review Text]

[Copy Review]

[Continue to Google]"

## 7.1 Clipboard Requirements

Use the browser Clipboard API when available.

Clipboard access may require a secure context and a user interaction.

If clipboard access fails:

- Show a clear error or fallback message.
- Keep the review text visible.
- Allow manual selection and copying.
- Do not block the customer from continuing.

Do not automatically navigate away before the customer has had an opportunity to copy the draft.

## 7.2 Google Redirect

Each business has its own Google review URL.

The redirect must use the Google review URL stored for that business.

The customer must manually paste and submit the review.

Do not attempt to automatically fill Google's review form.

---

# 8. GOOGLE REVIEW POLICY AND CUSTOMER TRUST

The platform must support genuine customer feedback.

Requirements:

- All customers must have equal access to the review opportunity.
- Do not redirect positive-feedback customers to Google while redirecting negative-feedback customers elsewhere.
- Do not offer incentives in exchange for positive reviews.
- Do not generate fabricated customer experiences.
- Do not automatically publish reviews.
- Do not claim a review has been posted merely because a customer clicked the Google redirect.
- Customers must be free to edit or discard the draft.

The product should help customers express their actual experiences, not manipulate business ratings.

---

# 9. QR CODE MANAGEMENT

## 9.1 Multiple QR Codes per Business

A business can have multiple QR codes.

Example:

ABC Restaurant:

- Reception QR.
- Billing counter QR.
- Dining table 1 QR.
- Dining table 2 QR.
- Takeaway counter QR.

All these QR codes must open the same business review experience.

Each QR code must have a unique tracking identifier.

## 9.2 QR Code Creation

The administrator should be able to:

- Create a QR code.
- Assign a name.
- Select the associated business.
- Add an optional placement description.
- Generate the QR image.
- Preview the QR code.
- Download PNG.
- Download SVG if supported.
- Activate or deactivate the QR code.

QR codes should be generated locally using a Node.js QR library.

Do not depend on an external paid QR generation API.

## 9.3 QR Code URL Structure

Use unique redirect URLs.

Example:

https://yourdomain.com/r/abc123

https://yourdomain.com/r/xyz456

The redirect identifier should map to the correct business and source record.

Do not expose MongoDB document IDs as the only public identifier.

Use sufficiently unpredictable public identifiers.

## 9.4 Printable QR Codes

Provide an option to download a simple printable QR design.

Include:

- Business name.
- QR code.
- Short instruction such as "Scan to share your experience".
- Clean branding.
- High-contrast QR code.

Future versions may support custom branding and different printable layouts.

---

# 10. NFC TAG MANAGEMENT

NFC tags must use the same redirect architecture as QR codes.

Each NFC tag should have:

- Unique identifier.
- Tag name.
- Associated business.
- Placement description.
- Active/inactive status.
- Created date.

The administrator should be able to create and deactivate NFC records.

The application should provide a unique URL to program into each physical NFC tag.

Example:

https://yourdomain.com/r/nfc123

The NFC tag should store a URL, not the entire review experience.

This allows the destination to be changed on the server without rewriting the tag, provided the tag's URL itself remains unchanged.

The platform does not need to physically write NFC tags through the web application in V1.

NFC programming and physical tag installation will initially be handled manually by the administrator.

---

# 11. ADMINISTRATOR DASHBOARD

The admin dashboard is the central control panel.

Design it as a polished, modern dashboard.

## 11.1 Dashboard Overview

Display summary cards for:

- Total businesses.
- Active businesses.
- Total QR codes.
- Total NFC tags.
- Total scans.
- Landing page views.
- Questionnaire starts.
- Questionnaire completions.
- Review drafts generated.
- Google review redirects.

Provide basic charts showing:

- Scan activity over time.
- Questionnaire completion trends.
- QR versus NFC activity.
- Individual source performance.

Do not label Google redirects as published reviews.

## 11.2 Sidebar Navigation

Suggested navigation:

1. Dashboard.
2. Businesses.
3. QR Codes.
4. NFC Tags.
5. Analytics.
6. Settings.
7. Logout.

The interface must be responsive.

On desktop, use a persistent sidebar.

On mobile, use a collapsible navigation menu.

## 11.3 Business Management

Create a dedicated businesses page.

Required functionality:

- List businesses.
- Search businesses.
- Server-side pagination.
- Create business.
- Edit business.
- View business details.
- Activate/deactivate businesses.
- Manage business configurations.

Suggested table columns:

- Business name.
- Category.
- Status.
- QR count.
- NFC count.
- Scan count.
- Created date.
- Actions.

Search should support business name and category.

Use server-side pagination to avoid loading every business record at once.

## 11.4 Create Business

Required fields:

- Business name.
- Business category.
- Business logo.
- Description.
- Welcome message.
- Google review URL.
- Review tone.
- Review length.
- Status.

Optional fields:

- Phone number.
- Business email.
- Business address.

The administrator must be able to save the business and configure its questionnaire afterward.

## 11.5 Business Detail Page

Create a dedicated detail page for each business.

Organize it into tabs:

1. Overview.
2. Business Information.
3. Questions.
4. Review Settings.
5. QR Codes.
6. NFC Tags.
7. Analytics.

The administrator should be able to manage everything related to a business from this page.

---

# 12. ANALYTICS AND TRACKING

## 12.1 Anonymous Tracking

The application should collect anonymous usage events.

Track:

- QR/NFC scan.
- Landing page view.
- Questionnaire started.
- Questionnaire completed.
- Review draft generated.
- Copy button clicked.
- Google redirect clicked.

## 12.2 Individual Source Tracking

Every QR code and NFC tag must have a separate source identifier.

This allows the administrator to compare placements.

Example:

- Reception QR: 120 scans.
- Billing QR: 85 scans.
- Dining table QR: 240 scans.
- Reception NFC: 40 scans.

All of them still point to the same business profile.

## 12.3 Data Collection Restrictions

Do not collect:

- Customer name.
- Customer phone number.
- Customer email.
- Customer account information.
- Customer personal details.

Do not save full questionnaire answers by default.

Store only anonymous aggregate usage events.

Avoid storing raw IP addresses.

Use anonymous session identifiers with appropriate retention controls.

## 12.4 Analytics Accuracy

The dashboard must distinguish between:

- QR/NFC scans.
- Landing views.
- Questionnaire completions.
- Draft generations.
- Copy clicks.
- Google redirects.

A Google redirect does not confirm that a customer published a review.

---

# 13. DATABASE ARCHITECTURE

Use MongoDB Atlas with Mongoose.

Create the following collections.

## 13.1 Admins

Fields:

- _id
- username
- email
- passwordHash
- role
- isActive
- lastLoginAt
- createdAt
- updatedAt

Passwords must always be securely hashed.

## 13.2 Businesses

Fields:

- _id
- businessName
- slug
- category
- logo
- description
- welcomeMessage
- googleReviewUrl
- phone
- email
- address
- reviewSettings
- status
- createdAt
- updatedAt

reviewSettings:

- tone
- length

## 13.3 Questions

Fields:

- _id
- businessId
- questionText
- questionType
- isRequired
- displayOrder
- options
- status
- createdAt
- updatedAt

Options should contain:

- optionId
- optionText
- displayOrder

Questions should reference their associated business.

## 13.4 TrackingSources

Fields:

- _id
- businessId
- publicCode
- sourceName
- sourceType
- placementDescription
- status
- createdAt
- updatedAt

sourceType:

- qr
- nfc

Each source must have a unique publicCode.

## 13.5 AnalyticsEvents

Fields:

- _id
- businessId
- trackingSourceId
- eventType
- anonymousSessionId
- createdAt

Add indexes for:

- businessId.
- trackingSourceId.
- eventType.
- createdAt.

Use retention policies or scheduled cleanup where appropriate.

## 13.6 ReviewTemplates

Fields:

- _id
- businessCategory
- tone
- answerKey
- sentenceTemplate
- status
- createdAt
- updatedAt

The template library must support multiple variations.

## 13.7 Settings

Fields:

- _id
- settingKey
- settingValue
- updatedAt

Use this collection for application-wide configurable settings.

## 13.8 Database Design Requirements

- Use Mongoose schema validation.
- Use timestamps where appropriate.
- Add unique indexes where necessary.
- Add indexes for common queries.
- Avoid embedding unlimited analytics events inside business documents.
- Use references for independently managed entities.
- Prevent duplicate public QR/NFC identifiers.
- Implement pagination for large collections.
- Avoid unnecessary database queries.

---

# 14. BACKEND API STRUCTURE

Use REST APIs.

Suggested endpoint groups:

## Authentication

POST /api/auth/login

POST /api/auth/logout

GET /api/auth/me

## Businesses

GET /api/businesses

POST /api/businesses

GET /api/businesses/:id

PUT /api/businesses/:id

PATCH /api/businesses/:id/status

DELETE /api/businesses/:id

## Questions

GET /api/businesses/:id/questions

POST /api/businesses/:id/questions

PUT /api/questions/:questionId

DELETE /api/questions/:questionId

PATCH /api/businesses/:id/questions/reorder

## QR and NFC

GET /api/businesses/:id/sources

POST /api/businesses/:id/sources

PUT /api/sources/:sourceId

PATCH /api/sources/:sourceId/status

GET /api/sources/:sourceId/qr

## Customer Experience

GET /api/public/sources/:publicCode

GET /api/public/businesses/:businessId

GET /api/public/businesses/:businessId/questions

POST /api/public/reviews/generate

POST /api/public/events

## Analytics

GET /api/analytics/overview

GET /api/analytics/business/:businessId

GET /api/analytics/source/:sourceId

These are suggested API contracts. Adjust implementation details where necessary, but maintain clear separation between public and authenticated administrator endpoints.

All public endpoints must validate input and apply appropriate rate limits.

---

# 15. REDIRECT SYSTEM

Implement a dedicated redirect endpoint.

Example:

GET /r/:publicCode

Process:

1. Receive publicCode.
2. Find the corresponding TrackingSource.
3. Verify that the source is active.
4. Verify that its associated business exists and is active.
5. Record a scan event.
6. Redirect to the customer-facing business page.

If the source is invalid or inactive, show a friendly error page.

Do not expose internal database identifiers unnecessarily.

Do not allow arbitrary user-provided redirect URLs. Redirect destinations must come from validated business records.

---

# 16. SECURITY REQUIREMENTS

Security must be implemented from the beginning.

## Authentication

- Use secure password hashing.
- Regenerate sessions after authentication.
- Implement session expiration.
- Add login rate limiting.
- Protect administrator endpoints.
- Validate authentication on the backend.
- Never rely only on frontend route protection.

Use either secure server-side sessions or a carefully implemented token-based system.

For an internal single-admin MVP, secure HTTP-only session cookies are a suitable choice.

## API Security

- Use Helmet.
- Configure CORS with explicit allowed origins.
- Validate request bodies.
- Sanitize inputs where appropriate.
- Add rate limiting.
- Avoid exposing stack traces in production.
- Use consistent error responses.

## MongoDB Security

- Never expose the Atlas connection string to React.
- Keep credentials in environment variables.
- Restrict Atlas network access appropriately.
- Use a dedicated database user with only required permissions.
- Never commit secrets to Git.

## File Upload Security

- Validate MIME type and extension.
- Restrict file size.
- Generate safe filenames.
- Prevent executable uploads.
- Store only permitted image types.
- Do not trust user-supplied filenames.

## Customer Security

- Do not collect unnecessary personal information.
- Protect public endpoints against abuse.
- Use unpredictable source identifiers.
- Prevent questionnaire submissions from being associated with unauthorized businesses.
- Do not expose administrator-only information through public APIs.

---

# 17. UI/UX DESIGN REQUIREMENTS

The platform must look like a polished modern SaaS application.

Avoid generic templates and outdated dashboard designs.

## Administrator Interface

Design characteristics:

- Modern layout.
- Clean typography.
- Consistent spacing.
- Professional neutral color palette.
- Sidebar navigation.
- Rounded cards.
- Subtle shadows.
- Clear visual hierarchy.
- Responsive tables.
- Attractive charts.
- Helpful empty states.
- Loading skeletons.
- Confirmation dialogs.
- Toast notifications.

## Customer Interface

The customer experience should be simpler than the administrator interface.

Design characteristics:

- Mobile-first.
- Fast loading.
- Minimal distractions.
- Clear instructions.
- Large buttons.
- Easy-to-select options.
- Smooth transitions.
- Readable typography.
- Accessible color contrast.

Avoid unnecessary animations and heavy libraries.

The customer should be able to complete the process without needing an explanation from staff.

---

# 18. HOSTING AND DEPLOYMENT

The initial goal is to use free hosting services where practical.

Possible hosting arrangement:

- React frontend: Vercel or another compatible static/frontend host.
- Express backend: Render or another Node.js-compatible hosting provider.
- Database: MongoDB Atlas M0 free cluster.
- Domain: Optional initially; recommended before a public pilot.

Verify current free-tier limitations before selecting providers.

Do not assume that a free backend host provides uninterrupted uptime.

The application must handle:

- Backend cold starts.
- Database connection failures.
- API timeouts.
- Temporary network errors.
- Invalid sessions.
- Missing uploaded files.

Use environment variables for:

- MONGODB_URI
- PORT
- NODE_ENV
- FRONTEND_URL
- SESSION_SECRET
- JWT_SECRET, if JWT is used
- UPLOAD configuration
- Other private credentials

Do not put secrets in the React environment.

## Migration and Backups

Provide:

- MongoDB export instructions.
- Database backup procedure.
- Database restoration procedure.
- Deployment configuration documentation.
- Environment setup instructions.

The project should be deployable to another Node.js-compatible hosting service without significant application restructuring.

---

# 19. PERFORMANCE AND RELIABILITY

Requirements:

- Mobile pages should load quickly.
- Optimize images.
- Use lazy loading where appropriate.
- Use server-side pagination.
- Avoid unnecessary database queries.
- Reuse database connections.
- Add database indexes.
- Use efficient analytics aggregation.
- Handle API failures gracefully.
- Prevent duplicate event submissions where practical.

QR/NFC landing pages should remain lightweight because customers may use mobile networks.

---

# 20. DEVELOPMENT PHASES

## Phase 1: Project Foundation

- Inspect existing project.
- Initialize React frontend.
- Initialize Express backend.
- Configure MongoDB Atlas.
- Configure Mongoose.
- Set up environment variables.
- Create database models.
- Establish frontend/backend communication.
- Create the base UI system.

## Phase 2: Administrator Authentication

- Admin login.
- Logout.
- Protected routes.
- Authentication middleware.
- Session security.
- Initial administrator creation.

## Phase 3: Business Management

- Business listing.
- Create business.
- Edit business.
- View business.
- Activate/deactivate.
- Logo upload.
- Search.
- Pagination.

## Phase 4: Questionnaire Management

- Create questions.
- Edit questions.
- Delete questions.
- Configure options.
- Reorder questions.
- Configure required/optional questions.
- Configure review tone.
- Configure review length.

## Phase 5: Review Generation

- Create deterministic template engine.
- Implement answer mapping.
- Implement tone variations.
- Implement review length.
- Add preview.
- Add editing.
- Add clipboard functionality.
- Add manual-copy fallback.
- Add Google redirect.

## Phase 6: QR/NFC Management

- Generate unique public codes.
- Generate QR codes.
- Download QR codes.
- Create NFC records.
- Display NFC programming URLs.
- Activate/deactivate sources.
- Implement redirect endpoint.

## Phase 7: Analytics

- Implement anonymous event tracking.
- Build overview dashboard.
- Track individual QR/NFC placements.
- Add charts.
- Add conversion statistics.
- Add date filters.

## Phase 8: Testing and Deployment

- Test all admin functionality.
- Test all customer flows.
- Test QR scanning.
- Test NFC URLs.
- Test clipboard behavior.
- Test Google redirects.
- Test mobile responsiveness.
- Test database failure handling.
- Test security.
- Deploy the application.

---

# 21. ACCEPTANCE CRITERIA

The MVP is complete only when all the following requirements work:

1. Administrator can log in securely.
2. Administrator can create and edit businesses.
3. Administrator can search and paginate businesses.
4. Every business can have a unique profile.
5. Every business can have a unique Google review URL.
6. Every business can have its own custom questionnaire.
7. Questions and answer options can be edited and reordered.
8. Tone and review length can be configured independently.
9. The review engine generates drafts without external AI APIs.
10. Customers can preview and edit their drafts.
11. Customers can copy drafts with a manual-copy fallback.
12. Customers can continue to the correct Google review page.
13. Multiple QR codes can point to the same business.
14. Multiple NFC tags can point to the same business.
15. Individual QR/NFC sources can be tracked.
16. Invalid sources display a friendly error.
17. Analytics are visible in the administrator dashboard.
18. Customer personal information is not collected by default.
19. All administrator routes are protected.
20. The application works on common mobile and desktop browsers.
21. Database backups and restoration are documented.
22. The application can be redeployed to another compatible Node.js hosting provider.

---

# 22. OUT OF SCOPE FOR V1

Do not implement these features unless explicitly requested:

- Business-owner login.
- Customer login.
- Customer contact collection.
- Private feedback collection.
- AI API integrations.
- Automatic Google review posting.
- Review scraping.
- Review reply management.
- Subscription billing.
- Payment gateway.
- Automated NFC hardware writing.
- Marathi translation.
- Multi-language support.
- Public self-service registration.
- Advanced marketing automation.

Keep the architecture flexible enough to support future expansion.

---

# 23. FUTURE ROADMAP

Potential future improvements:

**V2**
- Marathi language support.
- Additional Indian languages.
- Business-owner dashboard.
- More questionnaire layouts.
- Advanced analytics.
- Printable QR templates.

**V3**
- Subscription and billing system.
- Self-service business onboarding.
- Multiple administrator accounts.
- Automated customer support.
- Advanced review template customization.
- Additional review platforms, subject to their policies and supported workflows.

**V4**
- More advanced analytics.
- Multi-location business management.
- White-label branding.
- Larger-scale deployment infrastructure.

These are future possibilities, not MVP commitments.

---

# 24. ANTIGRAVITY IMPLEMENTATION INSTRUCTIONS

You are the primary development agent responsible for building ReviewBuddy.

Follow this PRD as the main source of truth.

## Before coding

1. Inspect the complete existing project directory.
2. Identify existing functionality and dependencies.
3. Identify broken or incomplete components.
4. Check the current Node.js and React setup.
5. Check database connectivity.
6. Report any major architectural issues.
7. Create an implementation plan.

Do not overwrite existing working functionality without inspecting it.

## Development rules

- Use React and tailwind css for the frontend.
- Use Node.js and Express for the backend.
- Use MongoDB Atlas as the database.
- Use Mongoose for data modeling.
- Use REST APIs.
- Keep frontend and backend code organized.
- Use reusable components.
- Implement secure authentication.
- Validate all inputs.
- Use environment variables.
- Avoid unnecessary dependencies.
- Do not use paid AI APIs.
- Do not use mock data as a replacement for actual database functionality.
- Do not create non-functional buttons.
- Do not mark features complete until they have been tested.

## Development workflow

Build the application in phases.

After each phase:

1. Verify the implementation.
2. Test the major workflows.
3. Fix errors.
4. Report completed features.
5. Identify remaining work.
6. Continue to the next phase.

Do not try to generate the entire application in one unverified code-generation step.

## Final delivery

At completion, provide:

- Full source code.
- Project directory structure.
- MongoDB schema documentation.
- API documentation.
- Environment variable template.
- Database setup instructions.
- Administrator setup instructions.
- Deployment guide.
- Backup and restore guide.
- Security checklist.
- Testing report.
- Known limitations.

The final application must be functional, database-backed, responsive, secure and ready for a controlled pilot with real businesses.

**Most important:** Build the actual working application, not just a beautiful UI prototype.

---

# END OF PRD

**Project Name: ReviewBuddy (Temporary)**  
**Stack: React + tailwind css + Node.js + Express + MongoDB Atlas + Mongoose**  
**Version: MVP / V1**