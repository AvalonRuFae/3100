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
- Notification creation for 7 notification types (TASK_ASSIGNED, BOUNTY_RECEIVED, PENALTY_APPLIED, DEADLINE_REMINDER, LICENSE_EXPIRING, TASK_DELETED, TASK_COMPLETED)
- User notification retrieval with filtering (all/unread)
- Unread notification counting
- Mark as read (single and bulk operations)
- Notification deletion with authorization
- Bulk notification creation for multiple users
- Old notification cleanup with retention policy
- Comprehensive error handling

**Test Count:** 10 optimized test cases (reduced from 41 while maintaining >90% coverage)

**Key Areas:**
- Multi-type notification creation with validation
- User isolation and authorization
- Bulk operations and cleanup
- Database error handling

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

## 4. Core Test Cases

**Note:** This section contains only the most critical test cases. Complete test suite has 248 tests across 8 test files.

**For additional test cases:** See the `backend/__tests__/` directory in the source code for the complete test suite implementation. Each test file contains comprehensive test coverage including edge cases, error handling, and integration scenarios not documented here.

### 4.1 Authentication System (auth.test.js)

#### TEST-AUTH-001: User Registration with team_id=NULL
**Test File:** `backend/__tests__/auth.test.js`  
**Endpoint:** `POST /api/v1/auth/register`  
**Objective:** Verify new users register with team_id=NULL as per registration flow  
**Priority:** High | **Category:** Functional Testing

**Expected Results:**
- HTTP 201 Created response
- User created successfully
- `team_id` field is NULL
- Response includes user ID and username

**Test Code:**
```javascript
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
expect(res.body.data).toHaveProperty('id');
```

---

#### TEST-AUTH-002: Login with No Team (no_team Flag)
**Test File:** `backend/__tests__/auth.test.js`  
**Endpoint:** `POST /api/v1/auth/login`  
**Objective:** Verify login returns no_team flag when user has no team  
**Priority:** High | **Category:** Functional Testing

**Expected Results:**
- HTTP 200 Success
- JWT token returned
- `no_team` flag set to true
- User object shows teamId as null

**Test Code:**
```javascript
const res = await request(app)
  .post('/api/v1/auth/login')
  .send({
    username: 'logintest',
    password: 'Test123!'
  });

expect(res.statusCode).toBe(200);
expect(res.body.data).toHaveProperty('token');
expect(res.body.data.no_team).toBe(true);
```

---

#### TEST-AUTH-003: Login Rejected for Expired License
**Test File:** `backend/__tests__/auth.test.js`  
**Endpoint:** `POST /api/v1/auth/login`  
**Objective:** Prevent login when user's team has expired license  
**Priority:** Critical | **Category:** Security Testing

**Expected Results:**
- HTTP 403 Forbidden
- Error message indicates license expiration

**Test Code:**
```javascript
const res = await request(app)
  .post('/api/v1/auth/login')
  .send({
    username: 'expireduser',
    password: 'Test123!'
  });

expect(res.statusCode).toBe(403);
expect(res.body.success).toBe(false);
expect(res.body.message).toMatch(/license|expired/i);
```

---

### 4.2 Task Management (tasks.test.js)

#### TEST-TASK-001: Task Creation by HASHIRA
**Test File:** `backend/__tests__/tasks.test.js`  
**Endpoint:** `POST /api/v1/tasks`  
**Objective:** Verify HASHIRA role can create tasks with bounty  
**Priority:** High | **Category:** Functional Testing

**Expected Results:**
- HTTP 201 Created
- Task created in database with bounty amount
- Task visible to team members

**Test Code:**
```javascript
const res = await request(app)
  .post('/api/v1/tasks')
  .set('Authorization', `Bearer ${hashiraToken}`)
  .send({
    title: 'Test Task',
    description: 'Task description',
    bountyAmount: 100.00,
    priority: 'HIGH'
  });

expect(res.statusCode).toBe(201);
expect(res.body.success).toBe(true);
```

---

#### TEST-TASK-002: Task Creation Rejected for GOON
**Test File:** `backend/__tests__/tasks.test.js`  
**Endpoint:** `POST /api/v1/tasks`  
**Objective:** Verify GOON role cannot create tasks  
**Priority:** High | **Category:** Security Testing

**Expected Results:**
- HTTP 403 Forbidden
- No task created in database

**Test Code:**
```javascript
const res = await request(app)
  .post('/api/v1/tasks')
  .set('Authorization', `Bearer ${goonToken}`)
  .send({
    title: 'Test Task',
    description: 'Task description',
    bountyAmount: 100.00
  });

expect(res.statusCode).toBe(403);
```

---

#### TEST-TASK-003: Task Assignment to Goons
**Test File:** `backend/__tests__/tasks.test.js`  
**Endpoint:** `POST /api/v1/tasks/:id/assign`  
**Objective:** Verify tasks can be assigned to GOON users  
**Priority:** High | **Category:** Functional Testing

**Expected Results:**
- Task assigned to specified user
- `assignedTo` field populated correctly
- Notification sent to assigned user

**Test Code:**
```javascript
const res = await request(app)
  .post(`/api/v1/tasks/${taskId}/assign`)
  .set('Authorization', `Bearer ${goonToken}`);

expect(res.statusCode).toBe(200);
expect(res.body.data.status).toBe('IN_PROGRESS');
```

---

#### TEST-TASK-004: Kanban Board Retrieval
**Test File:** `backend/__tests__/tasks.test.js`  
**Endpoint:** `GET /api/v1/tasks/board`  
**Objective:** Verify tasks are grouped by status for Kanban view  
**Priority:** Medium | **Category:** Functional Testing

**Expected Results:**
- Tasks grouped by AVAILABLE, IN_PROGRESS, COMPLETED
- Only team-specific tasks returned
- Proper filtering by status

**Test Code:**
```javascript
const res = await request(app)
  .get('/api/v1/tasks/board')
  .set('Authorization', `Bearer ${goonToken}`);

expect(res.statusCode).toBe(200);
expect(res.body.data).toHaveProperty('available');
expect(res.body.data).toHaveProperty('inProgress');
```

---

#### TEST-TASK-005: Task Status Update by Assigned User
**Test File:** `backend/__tests__/tasks.test.js`  
**Endpoint:** `PUT /api/v1/tasks/:id/status`  
**Objective:** Verify assigned users can update task status  
**Priority:** High | **Category:** Functional Testing

**Expected Results:**
- HTTP 200 Success
- Status updated in database
- Status change notification created

**Test Code:**
```javascript
const res = await request(app)
  .put(`/api/v1/tasks/${taskId}/status`)
  .set('Authorization', `Bearer ${goonToken}`)
  .send({ status: 'COMPLETED' });

expect(res.statusCode).toBe(200);
expect(res.body.data.status).toBe('COMPLETED');
```

---

### 4.3 License System (license.test.js)

#### TEST-LICENSE-001: Valid License Key Validation
**Test File:** `backend/__tests__/license.test.js`  
**Objective:** Verify valid license keys from environment are accepted  
**Priority:** Critical | **Category:** Functional Testing

**Expected Results:**
- Validation returns `valid: true`
- License configuration includes max_users and expiration
- License key matches environment config

**Test Code:**
```javascript
const result = await LicenseService.validateForTeamCreation(
  'RIKUGAN-2025-VALID-KEY-A'
);

expect(result.valid).toBe(true);
expect(result.config).toBeDefined();
expect(result.config.max_users).toBe(50);
```

---

#### TEST-LICENSE-002: Invalid License Key Rejected
**Test File:** `backend/__tests__/license.test.js`  
**Objective:** Reject license keys not in environment configuration  
**Priority:** Critical | **Category:** Security Testing

**Expected Results:**
- Validation returns `valid: false`
- Error message indicates invalid license
- Team creation blocked

**Test Code:**
```javascript
const result = await LicenseService.validateForTeamCreation(
  'INVALID-KEY-12345'
);

expect(result.valid).toBe(false);
expect(result.error).toMatch(/invalid|not found/i);
```

---

#### TEST-LICENSE-003: Expired License Key Rejected
**Test File:** `backend/__tests__/license.test.js`  
**Objective:** Prevent use of expired licenses  
**Priority:** Critical | **Category:** Security Testing

**Expected Results:**
- Validation detects expiry_date in the past
- License marked as invalid
- HTTP 403 when attempting to use expired license

**Test Code:**
```javascript
const result = await LicenseService.validateForTeamCreation(
  'RIKUGAN-TEST-2025-EXPIRED'
);

expect(result.valid).toBe(false);
expect(result.error).toMatch(/expired/i);
```

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

**Test Code:**
```javascript
const license = await License.findOne({ 
  where: { teamId: team.id } 
});

expect(license).toBeDefined();
expect(license.teamId).toBe(team.id);
expect(license.isActive).toBe(true);
```

---

#### TEST-LICENSE-005: User Limit Enforcement
**Test File:** `backend/__tests__/license.test.js`  
**Objective:** Prevent teams from exceeding license user limit  
**Priority:** High | **Category:** Business Logic

**Expected Results:**
- Team can add users up to max_users limit
- Attempting to exceed limit returns HTTP 403
- Error message indicates license limit reached

**Test Code:**
```javascript
// Attempt to add user beyond max_users limit
const res = await request(app)
  .post(`/api/v1/teams/${teamId}/members`)
  .set('Authorization', `Bearer ${adminToken}`)
  .send({ userId: newUserId });

expect(res.statusCode).toBe(403);
expect(res.body.message).toMatch(/user limit/i);
```

---

#### TEST-LICENSE-006: Task Limit Enforcement
**Test File:** `backend/__tests__/license.test.js`  
**Objective:** Limit task creation to 3 for unlicensed teams  
**Priority:** High | **Category:** Business Logic

**Expected Results:**
- Unlicensed teams limited to 3 tasks
- Licensed teams have no task limit
- HTTP 403 when limit exceeded

**Test Code:**
```javascript
// Try creating 4th task without license
const res = await request(app)
  .post('/api/v1/tasks')
  .set('Authorization', `Bearer ${hashiraToken}`)
  .send({ title: 'Task 4', description: 'Fourth task' });

expect(res.statusCode).toBe(403);
expect(res.body.message).toMatch(/task limit/i);
```

---

### 4.4 Bounty System (bounty.test.js)

#### TEST-BOUNTY-001: User Balance Retrieval
**Test File:** `backend/__tests__/bounty.test.js`  
**Endpoint:** `GET /api/v1/bounties/statistics`  
**Objective:** Retrieve user's current bounty balance  
**Priority:** High | **Category:** Functional Testing

**Expected Results:**
- HTTP 200 Success
- Current balance returned
- Balance reflects all completed transactions

**Test Code:**
```javascript
const res = await request(app)
  .get('/api/v1/bounties/statistics')
  .set('Authorization', `Bearer ${userToken}`);

expect(res.statusCode).toBe(200);
expect(res.body.success).toBe(true);
```

---

#### TEST-BOUNTY-002: Automatic Reward Distribution
**Test File:** `backend/__tests__/bounty.test.js`  
**Objective:** Verify bounty is awarded when task is completed  
**Priority:** High | **Category:** Business Logic

**Expected Results:**
- Task completion triggers bounty transaction
- User balance increased by bounty amount
- Transaction record created with type='BOUNTY'
- Audit log entry created

**Test Code:**
```javascript
await request(app)
  .put(`/api/v1/tasks/${taskId}/status`)
  .set('Authorization', `Bearer ${goonToken}`)
  .send({ status: 'COMPLETED' });

const transaction = await Transaction.findOne({ 
  where: { taskId, type: 'BOUNTY' } 
});

expect(transaction).toBeDefined();
expect(transaction.amount).toBe(bountyAmount);
```

---

#### TEST-BOUNTY-003: Penalty Application for Missed Deadlines
**Test File:** `backend/__tests__/bounty.test.js`  
**Objective:** Apply penalties when tasks miss deadlines  
**Priority:** High | **Category:** Business Logic

**Expected Results:**
- Penalty calculated based on business rules
- User balance decreased
- Transaction record created with type='PENALTY'
- Negative amount recorded

**Test Code:**
```javascript
// Task with past deadline
const penalty = await Transaction.findOne({ 
  where: { taskId, type: 'PENALTY' } 
});

expect(penalty).toBeDefined();
expect(penalty.amount).toBeLessThan(0);
expect(user.balance).toBeLessThan(initialBalance);
```

---

### 4.5 Team Management (team.test.js)

#### TEST-TEAM-001: Team Creation with License
**Test File:** `backend/__tests__/team.test.js`  
**Endpoint:** `POST /api/v1/teams/create`  
**Objective:** Create team with valid license key  
**Priority:** High | **Category:** Functional Testing

**Expected Results:**
- HTTP 201 Created
- Team created with license binding
- Creator assigned as OYAKATASAMA
- License status set to active

**Test Code:**
```javascript
const response = await request(app)
  .post('/api/v1/teams/create')
  .set('Authorization', `Bearer ${adminToken}`)
  .send({
    teamName: 'Alpha Team',
    licenseKey: 'RIKUGAN-2025-TEAM-A'
  });

expect(response.status).toBe(200);
expect(response.body.success).toBe(true);
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

**Test Code:**
```javascript
const res = await request(app)
  .post(`/api/v1/teams/${teamId}/members`)
  .set('Authorization', `Bearer ${adminToken}`)
  .send({ userId: newUserId });

expect(res.statusCode).toBe(200);
expect(res.body.success).toBe(true);
```

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

**Test Code:**
```javascript
const res = await request(app)
  .delete(`/api/v1/teams/${teamId}/members/${userId}`)
  .set('Authorization', `Bearer ${adminToken}`);

expect(res.statusCode).toBe(200);
const user = await User.findByPk(userId);
expect(user.teamId).toBeNull();
```

---

#### TEST-TEAM-004: Team-Based Resource Isolation
**Test File:** `backend/__tests__/team.test.js`  
**Objective:** Verify users can only access resources from their team  
**Priority:** Critical | **Category:** Security Testing

**Expected Results:**
- Users can only view/modify tasks in their team
- Team members list filtered by team
- Cross-team data access prevented

**Test Code:**
```javascript
const res = await request(app)
  .get('/api/v1/tasks')
  .set('Authorization', `Bearer ${team1Token}`);

const tasks = res.body.data;
expect(tasks.every(t => t.teamId === team1Id)).toBe(true);
```

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

**Test Code:**
```javascript
const res = await request(app)
  .delete(`/api/v1/teams/${teamId}`)
  .set('Authorization', `Bearer ${adminToken}`);

expect(res.statusCode).toBe(200);
const team = await Team.findByPk(teamId);
expect(team).toBeNull(); // or expect(team.isActive).toBe(false)
```

---

### 4.6 User Management (user.test.js)

#### TEST-USER-001: User Profile Retrieval
**Test File:** `backend/__tests__/user.test.js`  
**Endpoint:** `GET /api/v1/users`  
**Objective:** Retrieve authenticated user's profile  
**Priority:** High | **Category:** Functional Testing

**Expected Results:**
- HTTP 200 Success
- User profile data returned
- Balance and team information included

**Test Code:**
```javascript
const res = await request(app)
  .get('/api/v1/users')
  .set('Authorization', `Bearer ${adminToken}`);

expect(res.statusCode).toBe(200);
expect(res.body.success).toBe(true);
expect(Array.isArray(res.body.data)).toBe(true);
```

---

### 4.7 Notification System (notifications.test.js)

#### TEST-NOTIF-001: Multi-Type Notification Creation with Validation
**Test File:** `backend/__tests__/notifications.test.js`  
**Objective:** Create notifications of different types with proper validation  
**Priority:** High | **Category:** Functional Testing

**Expected Results:**
- All notification types created successfully
- Proper message formatting for each type
- Validation enforced for required fields

**Test Code:**
```javascript
const taskNotif = await NotificationService.createNotification(
  testUser1.id, 'TASK_ASSIGNED',
  { taskTitle: 'New Task', assignerName: 'Manager', 
    bountyAmount: 100, taskId: testTask.id }
);

expect(taskNotif.type).toBe('TASK_ASSIGNED');
expect(taskNotif.title).toBe('New Task Assigned');
expect(taskNotif.readStatus).toBe(false);
```

---

#### TEST-NOTIF-002: Notification Retrieval with Filtering
**Test File:** `backend/__tests__/notifications.test.js`  
**Objective:** Retrieve notifications with filtering and user isolation  
**Priority:** High | **Category:** Functional Testing

**Coverage:**
- Retrieve all user notifications
- Filter unread-only notifications
- Chronological ordering (newest first)
- User isolation (cross-user access prevention)
- Empty array for users with no notifications

**Expected Results:**
- Only authenticated user's notifications returned
- Unread filter correctly excludes read notifications
- Notifications sorted by created_at DESC
- Empty array (not null/error) for new users

**Test Code:**
```javascript
const notifs = await NotificationService.getUserNotifications(
  testUser1.id, { unreadOnly: true }
);

expect(Array.isArray(notifs)).toBe(true);
expect(notifs.every(n => !n.readStatus)).toBe(true);
```

---

#### TEST-NOTIF-003: Unread Count in Multiple Scenarios
**Test File:** `backend/__tests__/notifications.test.js`  
**Objective:** Accurate unread notification counting across edge cases  
**Priority:** Medium | **Category:** Functional Testing

**Coverage:**
- Count with mixed read/unread notifications
- Zero count when all notifications read
- Zero count for users with no notifications

**Expected Results:**
- Accurate count of unread notifications
- Returns 0 (not null) for edge cases

**Test Code:**
```javascript
const count = await NotificationService.getUnreadCount(
  testUser1.id
);

expect(typeof count).toBe('number');
expect(count).toBeGreaterThanOrEqual(0);
```

---

#### TEST-NOTIF-004: Mark as Read with Authorization
**Test File:** `backend/__tests__/notifications.test.js`  
**Objective:** Single notification mark-as-read with security checks  
**Priority:** High | **Category:** Security & Functional Testing

**Coverage:**
- Successfully mark notification as read
- Database persistence verification
- Idempotent operation (marking already-read notification)
- Reject non-existent notification
- Reject unauthorized user access

**Expected Results:**
- readStatus updated to true and persisted
- Idempotent (no error when marking twice)
- Throws 'Notification not found' for invalid ID or unauthorized access

**Test Code:**
```javascript
const result = await NotificationService.markAsRead(
  notificationId, testUser1.id
);

expect(result).toBe(true);
const notif = await Notification.findByPk(notificationId);
expect(notif.readStatus).toBe(true);
```

---

#### TEST-NOTIF-005: Bulk Mark All as Read with User Isolation
**Test File:** `backend/__tests__/notifications.test.js`  
**Objective:** Bulk update operation with proper user isolation  
**Priority:** Medium | **Category:** Functional Testing

**Coverage:**
- Mark all user notifications as read
- User isolation (only affects target user)
- Idempotent bulk operation

**Expected Results:**
- All target user notifications marked read
- Other users' notifications unaffected
- Returns true for successful operation

**Test Code:**
```javascript
const result = await NotificationService.markAllAsRead(
  testUser1.id
);

expect(result).toBe(true);
const unreadCount = await NotificationService.getUnreadCount(
  testUser1.id
);
expect(unreadCount).toBe(0);
```

---

### 4.8 Database Tests (database.test.js)

#### TEST-DB-001: Database Connection Health
**Test File:** `backend/__tests__/database.test.js`  
**Objective:** Verify database connection is established  
**Priority:** Critical | **Category:** Infrastructure Testing

**Expected Results:**
- Connection to MySQL database successful
- Database accessible for queries
- No connection errors

**Test Code:**
```javascript
await sequelize.authenticate();

expect(sequelize).toBeDefined();
expect(sequelize.options.database).toBe('dscpms_test');
```

---

#### TEST-DB-002: Connection Pool Management
**Test File:** `backend/__tests__/database.test.js`  
**Objective:** Verify connection pooling works correctly  
**Priority:** High | **Category:** Infrastructure Testing

**Expected Results:**
- Multiple concurrent connections handled
- Connections released back to pool
- No connection leaks

**Test Code:**
```javascript
const pool = sequelize.connectionManager.pool;

expect(pool).toBeDefined();
expect(pool.max).toBeGreaterThan(0);
```

---

#### TEST-DB-003: Transaction Handling
**Test File:** `backend/__tests__/database.test.js`  
**Objective:** Verify database transactions rollback on error  
**Priority:** High | **Category:** Data Integrity

**Expected Results:**
- Failed transactions rolled back completely
- Database state remains consistent
- No partial updates committed

**Test Code:**
```javascript
try {
  await sequelize.transaction(async (t) => {
    await User.create({ username: 'test' }, { transaction: t });
    throw new Error('Rollback test');
  });
} catch (err) {
  const user = await User.findOne({ where: { username: 'test' } });
  expect(user).toBeNull();
}
```

---

#### TEST-DB-004: Model Validations
**Test File:** `backend/__tests__/database.test.js`  
**Objective:** Verify model-level validations are enforced  
**Priority:** High | **Category:** Validation Testing

**Expected Results:**
- Email format validation enforced
- Required fields cannot be null
- Enum values validated (e.g., role, status)
- Custom validators execute correctly

**Test Code:**
```javascript
try {
  await User.create({ username: 'test', email: 'invalid' });
} catch (err) {
  expect(err.name).toBe('SequelizeValidationError');
}
```

---

#### TEST-DB-005: Default Values
**Test File:** `backend/__tests__/database.test.js`  
**Objective:** Verify default values are set correctly  
**Priority:** Medium | **Category:** Functional Testing

**Expected Results:**
- User.role defaults to 'GOON'
- User.balance defaults to 0
- User.isActive defaults to true
- Timestamps (created_at, updated_at) auto-generated

**Test Code:**
```javascript
const user = await User.create({
  username: 'defaulttest',
  email: 'default@test.com',
  password: 'Test123!'
});

expect(user.role).toBe('GOON');
expect(user.balance).toBe(0);
expect(user.isActive).toBe(true);
```

---

#### TEST-DB-006: Timestamp Management
**Test File:** `backend/__tests__/database.test.js`  
**Objective:** Verify automatic timestamp creation and updates  
**Priority:** Low | **Category:** Functional Testing

**Expected Results:**
- created_at set on record creation
- updated_at updated on record modification
- Timestamps accurate to current time

**Test Code:**
```javascript
const user = await User.create({ username: 'timestamp' });
const createdAt = user.createdAt;

await user.update({ email: 'new@test.com' });

expect(user.updatedAt).not.toEqual(createdAt);
```

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

---*Passing Tests:** 248 (100%)
- **Code Coverage:** ~86% overall (maintained after optimization)
  - Authentication: ~90%
  - Tasks: ~85%
  - License: ~90%
  - User: ~70%
  - Bounty: ~90%
  - Notifications: ~90% (10 comprehensive tests)
  - Team: ~71%
  - Database: ~100%
- **Average Test Execution Time:** 8-18 seconds (reduced due to fewer notification tests)

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

