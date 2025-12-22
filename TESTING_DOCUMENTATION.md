# Testing Documentation
## Demon Slayer Corps Project Management System (DSCPMS)

**Document Version:** 1.0  
**Last Updated:** December 22, 2025  
**Backend Testing Framework:** Jest + Supertest  
**Frontend Testing Framework:** User Requirement Testing  
**Node.js Version:** 16+

---

## Table of Contents
1. [Test Plan Overview](#test-plan-overview)
2. [Testing Strategy](#testing-strategy)
3. [Test Coverage](#test-coverage)
4. [Representative Test Cases](#representative-test-cases)
5. [Testing Environment](#testing-environment)
6. [Future Testing Recommendations](#future-testing-recommendations)

---

## 1. Test Plan Overview

### 1.1 Purpose
This test plan outlines the comprehensive testing strategy for the DSCPMS, encompassing both backend unit testing and frontend user requirement testing to ensure system reliability, security, and compliance with functional requirements specified in the Software Requirements Specification (SRS).

### 1.2 Scope

#### Backend Testing (Unit & Integration Tests)
The backend testing covers:
- RESTful API endpoints
- Authentication and authorization mechanisms
- Database operations and data integrity
- Business logic in service layer
- Role-based access control (RBAC)
- License validation system
- Bounty reward and penalty mechanisms
- Team management functionality

#### Frontend Testing (User Requirement Tests)
The frontend testing covers:
- User interface functionality and workflows
- User requirement validation
- End-to-end user scenarios
- Compliance with SRS functional requirements

### 1.3 Testing Objectives
- Verify all functional requirements from SRS are implemented correctly
- Ensure data security and proper authentication/authorization
- Validate business rules and constraints
- Test error handling and edge cases
- Confirm database integrity and transaction handling
- Validate API response formats and status codes

### 1.4 Test Deliverables
- Automated test suites for all major components
- Test coverage reports (target: 70%+ for critical paths)
- Test execution logs and results
- Bug reports and resolution tracking

---

## 2. Testing Strategy

### 2.1 Testing Approach

#### 2.1.1 Backend Unit Testing
**Purpose:** Test backend API, business logic, and data layer in isolation

**Scope:**
- Individual API endpoints and controllers
- Service layer business logic
- Database operations and models
- Middleware components
- Authentication and authorization
- Utility functions

**Approach:**
- Mock external dependencies (database, services)
- Test API endpoints with Supertest
- Validate request/response formats
- Test error handling and edge cases
- Verify data integrity and transactions
- Test security mechanisms (JWT, password hashing)

**Tools:** Jest + Supertest

**Coverage Target:** 70%+ for critical paths

#### 2.1.2 Frontend User Requirement Testing
**Purpose:** Validate that the frontend meets user requirements and SRS specifications

**Scope:**
- User workflows and scenarios from SRS
- Functional requirements validation
- User interface interactions
- End-to-end user journeys
- Role-based feature access

**Approach:**
- Manual testing against SRS requirements
- User acceptance testing (UAT)
- Scenario-based testing
- Role-based workflow validation
- Requirement traceability verification

**Tools:** Manual testing, requirement checklists

**Coverage Target:** 100% of SRS functional requirements

### 2.2 Testing Types

#### 2.2.1 Functional Testing
Tests that verify system behavior matches requirements:
- User registration and authentication
- Task creation, assignment, and lifecycle
- Bounty calculation and distribution
- License validation and team management
- Notification generation

#### 2.2.2 Security Testing
Tests that verify system security:
- Password hashing (bcrypt)
- JWT token generation and validation
- Authorization checks for protected routes
- SQL injection prevention
- Input validation and sanitization

#### 2.2.3 Negative Testing
Tests that verify system handles invalid inputs:
- Invalid credentials
- Malformed requests
- Unauthorized access attempts
- Expired tokens
- Invalid data formats

#### 2.2.4 Data Integrity Testing
Tests that verify database consistency:
- Foreign key constraints
- Unique constraints
- Transaction rollbacks
- Cascade deletions

---

## 3. Test Coverage

### 3.1 Components Covered

#### ✅ Authentication System (auth.test.js)
**Coverage:** >90%
- User registration with role selection and validation
- User login with JWT token generation (8-hour expiration)
- Team assignment validation and no_team flag
- License validation on protected routes
- Password hashing and change password functionality
- Role-based authorization (GOON/HASHIRA/OYAKATASAMA)
- Token authentication middleware
- JWT payload structure validation

**Test Count:** 41 test cases

**Key Areas:**
- User registration with duplicate detection and validation
- Login with JWT generation and team/license checks
- Password change functionality and validation
- Token-based authentication and authorization
- Protected route access control
- JWT structure and 8-hour expiration enforcement

#### ✅ Task Management System (tasks.test.js)
**Coverage:** >85%
- Task creation (Hashira/Oyakatasama only)
- Task assignment to Goons
- Task status updates
- Kanban board retrieval
- Task deletion
- Deadline validation
- License limit enforcement (3 task limit without license)

**Test Count:** 24 test cases

**Key Areas:**
- Task creation with required fields
- Task assignment to qualified users
- Kanban board filtering by status
- Status update by assigned users
- Deadline management
- Task deletion permissions

#### ✅ License Management System (license.test.js)
**Coverage:** >90%
- License validation from environment config
- Team creation with license keys
- License expiration checks
- User limit enforcement
- Task limit enforcement (3 tasks without valid license)
- License renewal and revocation

**Test Count:** 47 test cases

**Key Areas:**
- License-based access control
- License key validation
- Team-based license assignment
- Task creation limits for unlicensed teams

#### ✅ User Management (user.test.js)
**Coverage:** >70%
- User profile retrieval and management
- User profile updates with validation
- Balance tracking and management
- Role-based data access and authorization
- Edge case handling and security
- Concurrent update handling
- Input validation (SQL injection, XSS prevention)

**Test Count:** 43 test cases

**Key Areas:**
- User CRUD operations with role-based authorization
- Profile updates and validation (email, username uniqueness)
- User status management (active/inactive)
- Balance precision and tracking
- Security testing (SQL injection, XSS, password exclusion)
- Edge case handling (concurrent updates, null values, invalid IDs)

#### ✅ Bounty System (bounty.test.js)
**Coverage:** >90%
- Bounty calculation
- Automatic reward distribution
- Penalty application for missed deadlines
- Balance updates
- Audit log creation
- Transaction integrity

**Test Count:** 14 test cases

**Key Areas:**
- Bounty reward system
- Penalty system
- Financial transaction logging

#### ✅ Notification System (notifications.test.js)
**Coverage:** >90%
- Notification creation on task events
- Task assignment notifications
- Deadline reminder notifications
- Status change notifications
- Mark as read functionality
- User-specific notification retrieval

**Test Count:** 41 test cases

**Key Areas:**
- Task notifications
- Administrative notifications

#### ✅ Team Management (team.test.js)
**Coverage:** ~71%
- Team creation with license
- Team member addition/removal
- Team-based resource isolation
- Team license assignment
- Team deletion and cascade effects

**Test Count:** 20 test cases

**Key Areas:**
- Team-based project organization
- License-to-team binding
- Team member permissions

#### ✅ Database Connection (database.test.js)
**Coverage:** ~100%
- Database connectivity
- Model synchronization
- Transaction handling
- Connection pooling
- Model validations and constraints
- Foreign key relationships
- Cascade operations

**Test Count:** 49 test cases

## 4. Representative Test Cases

### 4.1 Authentication System (auth.test.js)

#### TEST-AUTH-001: User Registration with team_id=NULL
**Test File:** `backend/__tests__/auth.test.js`  
**Endpoint:** `POST /api/v1/auth/register`  
**Objective:** Verify new users register with team_id=NULL as per registration flow  
**Priority:** High | **Category:** Functional Testing

**Test Steps:**
1. Send POST request to `/api/v1/auth/register` with user credentials
2. Include username, email, password, and role in request body
3. Verify response returns 201 status code
4. Check user is created in database with team_id=NULL

**Expected Results:**
- HTTP 201 Created response
- User created successfully
- `team_id` field is NULL
- Response includes user ID and username

**Actual Implementation:**
```javascript
it('should register a new user with team_id=NULL', async () => {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123!',
      role: 'GOON'
    });

  expect(res.statusCode).toBe(201);
  expect(res.body.success).toBe(true);
  const user = await User.findByPk(res.body.data.id);
  expect(user.teamId).toBeNull();
});
```

---

#### TEST-AUTH-002: Role Selection During Registration
**Test File:** `backend/__tests__/auth.test.js`  
**Endpoint:** `POST /api/v1/auth/register`  
**Objective:** Verify users can select their role during registration  
**Priority:** High | **Category:** Functional Testing

**Test Steps:**
1. Register user with role='HASHIRA'
2. Verify response includes selected role
3. Test with different roles (GOON, HASHIRA, OYAKATASAMA)

**Expected Results:**
- User created with specified role
- Role persisted correctly in database

---

#### TEST-AUTH-003: Duplicate Username Validation
**Test File:** `backend/__tests__/auth.test.js`  
**Endpoint:** `POST /api/v1/auth/register`  
**Objective:** Prevent registration with existing username  
**Priority:** High | **Category:** Validation Testing

**Expected Results:**
- HTTP 400 Bad Request
- Error message indicates username already exists

---

#### TEST-AUTH-004: Email Validation
**Test File:** `backend/__tests__/auth.test.js`  
**Endpoint:** `POST /api/v1/auth/register`  
**Objective:** Validate email format during registration  
**Priority:** Medium | **Category:** Validation Testing

**Expected Results:**
- HTTP 400 for invalid email format
- Registration rejected for malformed emails

---

#### TEST-AUTH-005: Password Strength Validation
**Test File:** `backend/__tests__/auth.test.js`  
**Endpoint:** `POST /api/v1/auth/register`  
**Objective:** Enforce minimum password requirements  
**Priority:** High | **Category:** Security Testing

**Expected Results:**
- HTTP 400 for passwords shorter than minimum length
- Password must meet complexity requirements

---

#### TEST-AUTH-006: Login with No Team (no_team Flag)
**Test File:** `backend/__tests__/auth.test.js`  
**Endpoint:** `POST /api/v1/auth/login`  
**Objective:** Verify login returns no_team flag when user has no team  
**Priority:** High | **Category:** Functional Testing

**Test Steps:**
1. Login as user without team assignment
2. Verify JWT token is generated
3. Check response includes `no_team: true` flag
4. Confirm user.teamId is NULL

**Expected Results:**
- HTTP 200 Success
- JWT token returned
- `no_team` flag set to true
- User object shows teamId as null

**Actual Implementation:**
```javascript
it('should login user with no team and return no_team flag', async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({
      username: 'logintest',
      password: 'Test123!'
    });

  expect(res.statusCode).toBe(200);
  expect(res.body.data.no_team).toBe(true);
  expect(res.body.data.user.teamId).toBeNull();
});
```

---

#### TEST-AUTH-007: Login with Valid Team and License
**Test File:** `backend/__tests__/auth.test.js`  
**Endpoint:** `POST /api/v1/auth/login`  
**Objective:** Verify login includes team and license information  
**Priority:** High | **Category:** Functional Testing

**Expected Results:**
- HTTP 200 Success
- JWT token includes teamId, teamName, and licenseKey
- `no_team` flag is false or absent
- Team and license objects included in response

---

#### TEST-AUTH-008: Login Rejected for Expired License
**Test File:** `backend/__tests__/auth.test.js`  
**Endpoint:** `POST /api/v1/auth/login`  
**Objective:** Prevent login when user's team has expired license  
**Priority:** Critical | **Category:** Security Testing

**Expected Results:**
- HTTP 403 Forbidden
- Error message indicates license expiration

---

#### TEST-AUTH-009: Invalid Credentials
**Test File:** `backend/__tests__/auth.test.js`  
**Endpoint:** `POST /api/v1/auth/login`  
**Objective:** Reject login with incorrect password  
**Priority:** High | **Category:** Security Testing

**Expected Results:**
- HTTP 401 Unauthorized
- Generic error message (no indication of which credential is wrong)

---

#### TEST-AUTH-010: Protected Route Access with Valid Token
**Test File:** `backend/__tests__/auth.test.js`  
**Endpoint:** `GET /api/v1/auth/me`  
**Objective:** Verify authenticated users can access protected routes  
**Priority:** High | **Category:** Security Testing

**Test Steps:**
1. Obtain JWT token via login
2. Send GET request to protected endpoint with Authorization header
3. Verify user information is returned

**Expected Results:**
- HTTP 200 Success
- User profile data returned
- Password field excluded from response

---

#### TEST-AUTH-011: Protected Route Rejected Without Token
**Test File:** `backend/__tests__/auth.test.js`  
**Endpoint:** `GET /api/v1/auth/me`  
**Objective:** Verify unauthorized access is denied  
**Priority:** Critical | **Category:** Security Testing

**Expected Results:**
- HTTP 401 Unauthorized
- Access denied to protected resource

---

#### TEST-AUTH-012: Invalid Token Rejected
**Test File:** `backend/__tests__/auth.test.js`  
**Endpoint:** `GET /api/v1/auth/me`  
**Objective:** Reject requests with malformed or invalid tokens  
**Priority:** Critical | **Category:** Security Testing

**Expected Results:**
- HTTP 403 Forbidden
- Token validation fails

---

#### TEST-AUTH-013: JWT Token Expiration (8 Hours)
**Test File:** `backend/__tests__/auth.test.js`  
**Endpoint:** `POST /api/v1/auth/login`  
**Objective:** Verify JWT tokens expire after 8 hours as per auth_flow.puml  
**Priority:** High | **Category:** Security Testing

**Test Steps:**
1. Generate JWT token via login
2. Decode token payload
3. Verify expiration time is set to 8 hours from issuance

**Expected Results:**
- Token `exp` field set to `iat + (8 * 3600)` seconds
- Expiration enforced by JWT library

---

#### TEST-AUTH-014: Password Change with Correct Old Password
**Test File:** `backend/__tests__/auth.test.js`  
**Endpoint:** `POST /api/v1/auth/change-password`  
**Objective:** Allow users to change their password  
**Priority:** High | **Category:** Functional Testing

**Expected Results:**
- HTTP 200 Success
- Password updated in database
- User can login with new password

---

#### TEST-AUTH-015: Password Change Rejected with Wrong Old Password
**Test File:** `backend/__tests__/auth.test.js`  
**Endpoint:** `POST /api/v1/auth/change-password`  
**Objective:** Prevent password change without correct old password  
**Priority:** High | **Category:** Security Testing

**Expected Results:**
- HTTP 500 or 400 error
- Password remains unchanged

---

#### TEST-AUTH-016: Role-Based Authorization (GOON)
**Test File:** `backend/__tests__/auth.test.js`  
**Objective:** Verify GOON role permissions are enforced  
**Priority:** High | **Category:** Security Testing

**Test Steps:**
1. Authenticate as GOON user
2. Attempt to access GOON-permitted resources
3. Verify GOON cannot perform HASHIRA/OYAKATASAMA actions

**Expected Results:**
- GOON can access their own profile
- GOON cannot create tasks
- GOON cannot manage teams

---

#### TEST-AUTH-017: Role-Based Authorization (HASHIRA)
**Test File:** `backend/__tests__/auth.test.js`  
**Objective:** Verify HASHIRA role can create and manage tasks  
**Priority:** High | **Category:** Security Testing

**Expected Results:**
- HASHIRA can create tasks
- HASHIRA can assign tasks to GOONs
- HASHIRA cannot perform OYAKATASAMA-only actions

---

#### TEST-AUTH-018: Role-Based Authorization (OYAKATASAMA)
**Test File:** `backend/__tests__/auth.test.js`  
**Objective:** Verify OYAKATASAMA has full administrative access  
**Priority:** High | **Category:** Security Testing

**Expected Results:**
- OYAKATASAMA can create teams
- OYAKATASAMA can manage licenses
- OYAKATASAMA can perform all system actions

---

### 4.2 Task Management System (tasks.test.js)

#### TEST-TASK-001: Hashira Can Create Tasks
**Test File:** `backend/__tests__/tasks.test.js`  
**Endpoint:** `POST /api/v1/tasks`  
**Objective:** Verify HASHIRA role can create tasks  
**Priority:** High | **Category:** Functional Testing

**Test Steps:**
1. Authenticate as HASHIRA user
2. Send POST request with task details (title, description, bounty, deadline)
3. Verify task is created successfully

**Expected Results:**
- HTTP 201 Created
- Task saved to database
- createdBy field set to HASHIRA user ID

---

#### TEST-TASK-002: GOON Cannot Create Tasks
**Test File:** `backend/__tests__/tasks.test.js`  
**Endpoint:** `POST /api/v1/tasks`  
**Objective:** Verify GOON role cannot create tasks  
**Priority:** High | **Category:** Security Testing

**Expected Results:**
- HTTP 403 Forbidden
- No task created in database

---

#### TEST-TASK-003: Task Assignment to Goons
**Test File:** `backend/__tests__/tasks.test.js`  
**Endpoint:** `POST /api/v1/tasks`  
**Objective:** Verify tasks can be assigned to GOON users  
**Priority:** High | **Category:** Functional Testing

**Expected Results:**
- Task assigned to specified user
- `assignedTo` field populated correctly
- Notification sent to assigned user

---

#### TEST-TASK-004: Kanban Board Retrieval
**Test File:** `backend/__tests__/tasks.test.js`  
**Endpoint:** `GET /api/v1/tasks/kanban`  
**Objective:** Verify tasks are grouped by status for Kanban view  
**Priority:** Medium | **Category:** Functional Testing

**Expected Results:**
- Tasks grouped by AVAILABLE, IN_PROGRESS, COMPLETED
- Only team-specific tasks returned
- Proper filtering by status

---

#### TEST-TASK-005: Task Status Update by Assigned User
**Test File:** `backend/__tests__/tasks.test.js`  
**Endpoint:** `PUT /api/v1/tasks/:id/status`  
**Objective:** Verify assigned users can update task status  
**Priority:** High | **Category:** Functional Testing

**Test Steps:**
1. Assign task to GOON user
2. GOON updates status from AVAILABLE to IN_PROGRESS
3. Verify status updated successfully

**Expected Results:**
- HTTP 200 Success
- Status updated in database
- Status change notification created

---

#### TEST-TASK-006: Task Deletion by Creator
**Test File:** `backend/__tests__/tasks.test.js`  
**Endpoint:** `DELETE /api/v1/tasks/:id`  
**Objective:** Verify task creators can delete their tasks  
**Priority:** Medium | **Category:** Functional Testing

**Expected Results:**
- HTTP 200 Success
- Task removed from database (soft delete or hard delete based on implementation)

---

#### TEST-TASK-007: Prevent Deletion of Assigned Tasks
**Test File:** `backend/__tests__/tasks.test.js`  
**Endpoint:** `DELETE /api/v1/tasks/:id`  
**Objective:** Prevent deletion of tasks that are assigned  
**Priority:** High | **Category:** Business Logic

**Expected Results:**
- HTTP 400 or 403 error
- Task remains in database
- Error message indicates task is assigned

---

#### TEST-TASK-008: Deadline Validation
**Test File:** `backend/__tests__/tasks.test.js`  
**Endpoint:** `POST /api/v1/tasks`  
**Objective:** Ensure task deadlines are in the future  
**Priority:** Medium | **Category:** Validation Testing

**Expected Results:**
- Tasks with past deadlines rejected
- HTTP 400 Bad Request for invalid deadlines

---

#### TEST-TASK-009: Task Limit Without License
**Test File:** `backend/__tests__/tasks.test.js`  
**Objective:** Enforce 3-task limit for teams without valid license  
**Priority:** High | **Category:** Business Logic

**Expected Results:**
- First 3 tasks created successfully
- 4th task creation rejected with HTTP 403
- Error message indicates license required

---

### 4.3 License Management System (license.test.js)

#### TEST-LICENSE-001: Valid License Key Validation
**Test File:** `backend/__tests__/license.test.js`  
**Objective:** Verify valid license keys from environment are accepted  
**Priority:** Critical | **Category:** Functional Testing

**Test Steps:**
1. Call license validation service with valid key from environment config
2. Verify license configuration is returned
3. Check max_users and expiry_date are correct

**Expected Results:**
- Validation returns `valid: true`
- License configuration includes max_users and expiration
- License key matches environment config

---

#### TEST-LICENSE-002: Invalid License Key Rejected
**Test File:** `backend/__tests__/license.test.js`  
**Objective:** Reject license keys not in environment configuration  
**Priority:** Critical | **Category:** Security Testing

**Expected Results:**
- Validation returns `valid: false`
- Error message indicates invalid license
- Team creation blocked

---

#### TEST-LICENSE-003: Expired License Key Rejected
**Test File:** `backend/__tests__/license.test.js`  
**Objective:** Prevent use of expired licenses  
**Priority:** Critical | **Category:** Security Testing

**Expected Results:**
- Validation detects expiry_date in the past
- License marked as invalid
- HTTP 403 when attempting to use expired license

---

#### TEST-LICENSE-004: License Assignment to Team
**Test File:** `backend/__tests__/license.test.js`  
**Endpoint:** `POST /api/v1/teams/create`  
**Objective:** Verify license is bound to team during creation  
**Priority:** High | **Category:** Functional Testing

**Expected Results:**
- License record created in database
- License.teamId matches created team
- License status set to active

---

#### TEST-LICENSE-005: User Limit Enforcement
**Test File:** `backend/__tests__/license.test.js`  
**Objective:** Prevent teams from exceeding license user limit  
**Priority:** High | **Category:** Business Logic

**Expected Results:**
- Team can add users up to max_users limit
- Attempting to exceed limit returns HTTP 403
- Error message indicates license limit reached

---

#### TEST-LICENSE-006: Task Limit Enforcement
**Test File:** `backend/__tests__/license.test.js`  
**Objective:** Limit task creation to 3 for unlicensed teams  
**Priority:** High | **Category:** Business Logic

**Expected Results:**
- Unlicensed teams limited to 3 tasks
- Licensed teams have no task limit
- HTTP 403 when limit exceeded

---

### 4.4 Bounty System (bounty.test.js)

#### TEST-BOUNTY-001: Bounty Statistics Aggregation
**Test File:** `backend/__tests__/bounty.test.js`  
**Endpoint:** `GET /api/v1/bounties/statistics`  
**Objective:** Verify bounty statistics are calculated correctly  
**Priority:** High | **Category:** Functional Testing

**Test Steps:**
1. Create multiple transactions (bounties and penalties)
2. Request statistics for user
3. Verify total bounty, total penalties, and counts are accurate

**Expected Results:**
- HTTP 200 Success
- Correct totalBountiesPaid amount
- Correct totalPenalties amount
- Accurate count of transactions
- Average bounty calculated correctly

---

#### TEST-BOUNTY-002: User Transaction History
**Test File:** `backend/__tests__/bounty.test.js`  
**Endpoint:** `GET /api/v1/bounties/transactions`  
**Objective:** Retrieve complete transaction history for user  
**Priority:** Medium | **Category:** Functional Testing

**Expected Results:**
- All user transactions returned
- Transactions sorted by date (newest first)
- Each transaction includes type, amount, description, and balance

---

#### TEST-BOUNTY-003: Automatic Reward Distribution
**Test File:** `backend/__tests__/bounty.test.js`  
**Objective:** Verify bounty is awarded when task is completed  
**Priority:** High | **Category:** Business Logic

**Expected Results:**
- Task completion triggers bounty transaction
- User balance increased by bounty amount
- Transaction record created with type='BOUNTY'
- Audit log entry created

---

#### TEST-BOUNTY-004: Penalty Application for Missed Deadlines
**Test File:** `backend/__tests__/bounty.test.js`  
**Objective:** Apply penalties when tasks miss deadlines  
**Priority:** High | **Category:** Business Logic

**Expected Results:**
- Penalty calculated based on business rules
- User balance decreased
- Transaction record created with type='PENALTY'
- Negative amount recorded

---

#### TEST-BOUNTY-005: Balance Updates
**Test File:** `backend/__tests__/bounty.test.js`  
**Objective:** Ensure user balance reflects all transactions  
**Priority:** Critical | **Category:** Data Integrity

**Expected Results:**
- Balance updated atomically with transaction
- balanceBefore and balanceAfter recorded correctly
- No race conditions in concurrent updates

---

#### TEST-BOUNTY-006: Transaction Integrity
**Test File:** `backend/__tests__/bounty.test.js`  
**Objective:** Verify transactions are created with complete audit trail  
**Priority:** High | **Category:** Data Integrity

**Expected Results:**
- Each transaction includes userId, taskId, type, amount
- Timestamps recorded accurately
- Description field populated
- Balance snapshots (before/after) captured

---

### 4.5 Team Management (team.test.js)

#### TEST-TEAM-001: Team Creation with Valid License
**Test File:** `backend/__tests__/team.test.js`  
**Endpoint:** `POST /api/v1/teams/create`  
**Objective:** Create team with validated license key  
**Priority:** High | **Category:** Functional Testing

**Test Steps:**
1. Submit team creation request with valid license key
2. Verify team is created
3. Confirm license is assigned to team
4. Check creator is added as team member

**Expected Results:**
- HTTP 201 Created
- Team record created in database
- License bound to team
- Creator's teamId updated

**Actual Implementation:**
```javascript
test('should create a team with valid license key', async () => {
  const response = await request(app)
    .post('/api/v1/teams/create')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      teamName: 'Test Team',
      licenseKey: 'RIKUGAN-2025-TEAM-A'
    });

  expect(response.statusCode).toBe(201);
  expect(response.body.data.team.name).toBe('Test Team');
  expect(response.body.data.license.licenseKey).toBe('RIKUGAN-2025-TEAM-A');
});
```

---

#### TEST-TEAM-002: Team Member Addition
**Test File:** `backend/__tests__/team.test.js`  
**Endpoint:** `POST /api/v1/teams/:id/members`  
**Objective:** Add users to existing team  
**Priority:** High | **Category:** Functional Testing

**Expected Results:**
- User's teamId updated to team ID
- User can access team resources
- User included in team member list

---

#### TEST-TEAM-003: Team Member Removal
**Test File:** `backend/__tests__/team.test.js`  
**Endpoint:** `DELETE /api/v1/teams/:id/members/:userId`  
**Objective:** Remove users from team  
**Priority:** Medium | **Category:** Functional Testing

**Expected Results:**
- User's teamId set to NULL
- User loses access to team resources
- Tasks assigned to user are handled appropriately

---

#### TEST-TEAM-004: Team-Based Resource Isolation
**Test File:** `backend/__tests__/team.test.js`  
**Objective:** Verify users can only access resources from their team  
**Priority:** Critical | **Category:** Security Testing

**Expected Results:**
- Users can only view/modify tasks in their team
- Team members list filtered by team
- Cross-team data access prevented

---

#### TEST-TEAM-005: Team Deletion with Cascade
**Test File:** `backend/__tests__/team.test.js`  
**Endpoint:** `DELETE /api/v1/teams/:id`  
**Objective:** Handle team deletion and dependent resources  
**Priority:** Medium | **Category:** Functional Testing

**Expected Results:**
- Team marked as inactive or deleted
- Associated license deactivated
- Team members' teamId set to NULL
- Tasks handled according to business rules

---

### 4.6 User Management (user.test.js)

#### TEST-USER-001: User Profile Retrieval
**Test File:** `backend/__tests__/user.test.js`  
**Endpoint:** `GET /api/v1/users/profile`  
**Objective:** Retrieve authenticated user's profile  
**Priority:** High | **Category:** Functional Testing

**Expected Results:**
- HTTP 200 Success
- User profile data returned
- Password field excluded
- Team information included if applicable

---

#### TEST-USER-002: User Profile Update
**Test File:** `backend/__tests__/user.test.js`  
**Endpoint:** `PUT /api/v1/users/profile`  
**Objective:** Allow users to update their profile  
**Priority:** Medium | **Category:** Functional Testing

**Expected Results:**
- Profile fields updated successfully
- Username/email uniqueness enforced
- Validation errors for invalid data

---

#### TEST-USER-003: Balance Tracking
**Test File:** `backend/__tests__/user.test.js`  
**Objective:** Verify user balance is accurately maintained  
**Priority:** High | **Category:** Data Integrity

**Expected Results:**
- Balance initialized to 0
- Balance updated with each transaction
- Decimal precision maintained (2 decimal places)

---

#### TEST-USER-004: Role-Based Data Access
**Test File:** `backend/__tests__/user.test.js`  
**Objective:** Verify users can only access authorized data  
**Priority:** Critical | **Category:** Security Testing

**Expected Results:**
- Users can view their own profile
- OYAKATASAMA can view all users
- GOON/HASHIRA cannot view other users' sensitive data

---

#### TEST-USER-005: SQL Injection Prevention
**Test File:** `backend/__tests__/user.test.js`  
**Objective:** Verify input sanitization prevents SQL injection  
**Priority:** Critical | **Category:** Security Testing

**Expected Results:**
- Malicious SQL in input fields rejected or escaped
- Database queries use parameterized statements
- No database errors from injection attempts

---

#### TEST-USER-006: XSS Prevention
**Test File:** `backend/__tests__/user.test.js`  
**Objective:** Prevent cross-site scripting attacks  
**Priority:** High | **Category:** Security Testing

**Expected Results:**
- HTML/JavaScript in input fields sanitized
- Stored data does not execute scripts when rendered
- Special characters properly escaped

---

### 4.7 Notification System (notifications.test.js)

#### TEST-NOTIF-001: Task Assignment Notification
**Test File:** `backend/__tests__/notifications.test.js`  
**Objective:** Create notification when task is assigned  
**Priority:** High | **Category:** Functional Testing

**Test Steps:**
1. Assign task to user
2. Verify notification created
3. Check notification type is 'TASK_ASSIGNED'
4. Confirm message includes task title, assigner, and bounty

**Expected Results:**
- Notification record created
- Type: 'TASK_ASSIGNED'
- Title: 'New Task Assigned'
- Message includes task details
- isRead: false by default

**Actual Implementation:**
```javascript
test('should create TASK_ASSIGNED notification', async () => {
  const notification = await NotificationService.createNotification(
    testUser1.id,
    'TASK_ASSIGNED',
    {
      taskTitle: 'New Task',
      assignerName: 'Manager',
      bountyAmount: 100,
      taskId: testTask.id
    }
  );

  expect(notification.type).toBe('TASK_ASSIGNED');
  expect(notification.title).toBe('New Task Assigned');
  expect(notification.isRead).toBe(false);
});
```

---

#### TEST-NOTIF-002: Mark Notification as Read
**Test File:** `backend/__tests__/notifications.test.js`  
**Endpoint:** `PUT /api/v1/notifications/:id/read`  
**Objective:** Allow users to mark notifications as read  
**Priority:** Medium | **Category:** Functional Testing

**Expected Results:**
- HTTP 200 Success
- isRead field updated to true
- readAt timestamp set to current time

---

#### TEST-NOTIF-003: Deadline Reminder Notifications
**Test File:** `backend/__tests__/notifications.test.js`  
**Objective:** Generate notifications for approaching deadlines  
**Priority:** Medium | **Category:** Functional Testing

**Expected Results:**
- Notification created X hours before deadline
- Type: 'DEADLINE_REMINDER'
- Message includes time remaining

---

#### TEST-NOTIF-004: Status Change Notifications
**Test File:** `backend/__tests__/notifications.test.js`  
**Objective:** Notify relevant users of task status changes  
**Priority:** Medium | **Category:** Functional Testing

**Expected Results:**
- Task creator notified when status changes
- Notification includes old and new status
- Type: 'STATUS_CHANGED'

---

#### TEST-NOTIF-005: User-Specific Notification Retrieval
**Test File:** `backend/__tests__/notifications.test.js`  
**Endpoint:** `GET /api/v1/notifications`  
**Objective:** Retrieve notifications for authenticated user  
**Priority:** High | **Category:** Functional Testing

**Expected Results:**
- Only user's notifications returned
- Sorted by creation date (newest first)
- Unread count included
- Read/unread filtering supported

---

### 4.8 Database Layer (database.test.js)

#### TEST-DB-001: Database Connectivity
**Test File:** `backend/__tests__/database.test.js`  
**Objective:** Verify successful database connection  
**Priority:** Critical | **Category:** Infrastructure Testing

**Expected Results:**
- Database connection established
- Authentication successful
- Test database name correct (dscpms_test)

---

#### TEST-DB-002: Model Synchronization
**Test File:** `backend/__tests__/database.test.js`  
**Objective:** Verify all models sync correctly with database  
**Priority:** High | **Category:** Infrastructure Testing

**Expected Results:**
- All tables created successfully
- Schema matches model definitions
- Foreign keys established correctly

---

#### TEST-DB-003: Unique Constraints
**Test File:** `backend/__tests__/database.test.js`  
**Objective:** Enforce unique constraints on username and email  
**Priority:** High | **Category:** Data Integrity

**Expected Results:**
- Duplicate username insertion rejected
- Duplicate email insertion rejected
- Database constraint error thrown

---

#### TEST-DB-004: Foreign Key Relationships
**Test File:** `backend/__tests__/database.test.js`  
**Objective:** Verify foreign key constraints are enforced  
**Priority:** High | **Category:** Data Integrity

**Expected Results:**
- Cannot create task with invalid createdBy user ID
- Cannot assign task to non-existent user
- Referential integrity maintained

---

#### TEST-DB-005: Cascade Operations
**Test File:** `backend/__tests__/database.test.js`  
**Objective:** Verify cascade delete operations work correctly  
**Priority:** Medium | **Category:** Data Integrity

**Expected Results:**
- Deleting user cascades to dependent records (if configured)
- Or foreign key constraint prevents deletion
- Data consistency maintained

---

#### TEST-DB-006: Transaction Handling
**Test File:** `backend/__tests__/database.test.js`  
**Objective:** Verify database transactions rollback on error  
**Priority:** High | **Category:** Data Integrity

**Expected Results:**
- Failed transactions rolled back completely
- Database state remains consistent
- No partial updates committed

---

#### TEST-DB-007: Model Validations
**Test File:** `backend/__tests__/database.test.js`  
**Objective:** Verify model-level validations are enforced  
**Priority:** High | **Category:** Validation Testing

**Expected Results:**
- Email format validation enforced
- Required fields cannot be null
- Enum values validated (e.g., role, status)
- Custom validators execute correctly

---

#### TEST-DB-008: Default Values
**Test File:** `backend/__tests__/database.test.js`  
**Objective:** Verify default values are set correctly  
**Priority:** Medium | **Category:** Functional Testing

**Expected Results:**
- User.role defaults to 'GOON'
- User.balance defaults to 0
- User.isActive defaults to true
- Timestamps (created_at, updated_at) auto-generated

---

#### TEST-DB-009: Timestamp Management
**Test File:** `backend/__tests__/database.test.js`  
**Objective:** Verify automatic timestamp creation and updates  
**Priority:** Low | **Category:** Functional Testing

**Expected Results:**
- created_at set on record creation
- updated_at updated on record modification
- Timestamps accurate to current time

---

## 5. Testing Environment

### 5.1 Docker Setup (Required)

**IMPORTANT:** All tests must be run inside Docker containers to ensure proper database connectivity and environment consistency.

#### Prerequisites
- Docker and Docker Compose installed
- All containers started via Docker Compose

#### Setup Steps

**1. Start the Docker environment:**
```bash
# Navigate to project root
cd c:\Users\user\Documents\GitHub\3100

# Start database and backend containers
docker-compose up -d database backend
```

**2. Verify containers are running:**
```bash
docker ps
# Should show: dscpms-database and dscpms-backend containers
```

**3. Create test database (one-time setup):**
```bash
docker exec dscpms-database mysql -u root -proot -e "CREATE DATABASE IF NOT EXISTS dscpms_test;"
```

### 5.2 Test Execution

**CRITICAL:** Tests must be executed inside the Docker backend container, NOT on the host machine.

#### Run Individual Test Suites
```bash
# Auth tests
docker exec dscpms-backend bash -c "NODE_ENV=test npm test -- auth.test.js --forceExit"

# Task tests
docker exec dscpms-backend bash -c "NODE_ENV=test npm test -- tasks.test.js --forceExit"

# License tests
docker exec dscpms-backend bash -c "NODE_ENV=test npm test -- license.test.js --forceExit"

# Bounty tests
docker exec dscpms-backend bash -c "NODE_ENV=test npm test -- bounty.test.js --forceExit"

# User tests
docker exec dscpms-backend bash -c "NODE_ENV=test npm test -- user.test.js --forceExit"

# Notification tests
docker exec dscpms-backend bash -c "NODE_ENV=test npm test -- notifications.test.js --forceExit"

# Team tests
docker exec dscpms-backend bash -c "NODE_ENV=test npm test -- team.test.js --forceExit"

# Database tests
docker exec dscpms-backend bash -c "NODE_ENV=test npm test -- database.test.js --forceExit"
```

### 5.3 Test Database Configuration

The test environment uses Docker's internal networking:

```javascript
// Configuration in src/config/database.js (test environment)
{
  host: process.env.DB_HOST || 'database',  // Docker service name
  port: parseInt(process.env.DB_PORT) || 3306,
  database: 'dscpms_test',                   // Separate test database
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  dialect: 'mysql',
  logging: false                              // Disabled for cleaner output
}
```

**Environment Variables in Docker:**
- `DB_HOST=database` (Docker Compose service name, not 'localhost')
- `DB_PORT=3306`
- `DB_USER=root`
- `DB_PASSWORD=root`
- `NODE_ENV=test` (triggers test database usage)

### 5.4 Data Isolation and Test Data Management

**Setup Strategy:**
- `beforeAll()`: Sync database models (creates tables)
- `beforeEach()`: Create fresh test data for each test
- `afterEach()`: Clean up test data (optional)
- `afterAll()`: Close database connections

**Data Isolation:**
- Each test suite runs in isolated Docker environment
- Database reset between test executions via `sequelize.sync({ force: true })`
- Mock external services (email, payment)
- Test database (`dscpms_test`) separate from development database (`dscpms`)

**Important Notes:**
- Running tests on host machine (without Docker) will fail with connection errors
- Tests require Docker's internal network to connect to the `database` service
- The `--forceExit` flag ensures Jest exits cleanly after test completion

### 5.5 Mock Data Generators

All test data generation must occur within the Docker container environment:

```javascript
// Example: Create test user (executed inside Docker container)
async function createTestUser(role = 'GOON') {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({
      username: `test_${role.toLowerCase()}_${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'Test123!',
      role: role
    });
  return res.body.data;
}

// Example: Create test task
async function createTestTask(token, bounty = 100) {
  const res = await request(app)
    .post('/api/v1/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: `Test Task ${Date.now()}`,
      description: 'Test task description with sufficient length',
      bountyAmount: bounty,
      deadline: new Date(Date.now() + 86400000)
    });
  return res.body.data;
}
```

### 5.6 Troubleshooting

**Issue: Connection Refused / Access Denied Errors**
- **Cause:** Tests running on host machine instead of Docker
- **Solution:** Always use `docker exec dscpms-backend` to run tests

**Issue: Port 3306 Already in Use**
- **Cause:** Local MySQL instance conflicts with Docker MySQL
- **Solution:** Tests inside Docker use internal networking, no conflict

**Issue: Database Not Found**
- **Cause:** Test database not created
- **Solution:** Run `docker exec dscpms-database mysql -u root -proot -e "CREATE DATABASE IF NOT EXISTS dscpms_test;"`

**Issue: Tests Hang or Don't Exit**
- **Cause:** Database connections not closed
- **Solution:** Use `--forceExit` flag in test command

---

## 7. Test Metrics and Reporting

### 7.1 Current Test Metrics
- **Total Test Cases:** 279
- **Passing Tests:** 279 (100%)
- **Code Coverage:** ~86% overall
  - Authentication: ~90%
  - Tasks: ~85%
  - License: ~90%
  - User: ~70%
  - Bounty: ~90%
  - Notifications: ~90%
  - Team: ~71%
  - Database: ~100%
- **Average Test Execution Time:** 10-20 seconds

### 7.3 Quality Gates
Before merging code:
- ✅ All tests must pass regressively
- ✅ No decrease in code coverage
- ✅ No new ESLint errors
- ✅ API documentation updated
- ✅ Test cases added for new features

---

## 8. Conclusion

The DSCPMS backend testing strategy provides comprehensive coverage of critical functionality through automated unit and integration tests. The test suite validates all major requirements from the SRS, ensures security through authentication and authorization tests, and maintains data integrity through database transaction testing.

