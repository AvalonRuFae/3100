# Demon Slayer Corps Project Management System (DSCPMS) - Architecture and Design Document

## Table of Contents

1. [Introduction and Goals](#1-introduction-and-goals)
   - 1.1. [Requirements Overview](#11-requirements-overview)
   - 1.2. [Quality Goals](#12-quality-goals)
   - 1.3. [Stakeholders](#13-stakeholders)
2. [Architecture Constraints](#2-architecture-constraints)
   - 2.1. [Technical Constraints](#21-technical-constraints)
   - 2.2. [Organizational Constraints](#22-organizational-constraints)
   - 2.3. [Conventions](#23-conventions)
3. [System Scope and Context](#3-system-scope-and-context)
   - 3.1. [Business Context](#31-business-context)
   - 3.2. [Technical Context](#32-technical-context)
4. [Solution Strategy](#4-solution-strategy)
5. [Building Block View](#5-building-block-view)
   - 5.1. [Whitebox DSCPMS System](#51-whitebox-dscpms-system)
   - 5.2. [Building Blocks - Level 2](#52-building-blocks---level-2)
6. [Runtime View](#6-runtime-view)
   - 6.1. [User Authentication Flow](#61-user-authentication-flow)
   - 6.2. [Task Assignment and Completion](#62-task-assignment-and-completion)
   - 6.3. [Notification System Flow](#63-notification-system-flow)
   - 6.4. [License Validation and Team Access Control](#64-license-validation-and-team-access-control)
7. [Deployment View](#7-deployment-view)
8. [Concepts](#8-concepts)
   - 8.1. [Domain Models](#81-domain-models)
   - 8.2. [Persistency](#82-persistency)
   - 8.3. [User Interface](#83-user-interface)
   - 8.4. [Security](#84-security)
   - 8.5. [Session Handling](#85-session-handling)
   - 8.6. [Error Handling](#86-error-handling)
   - 8.7. [Logging and Monitoring](#87-logging-and-monitoring)
   - 8.8. [Configuration](#88-configuration)
9. [Design Decisions](#9-design-decisions)
   - 9.1. [Technology Stack Selection](#91-technology-stack-selection)
   - 9.2. [Database Design](#92-database-design)
   - 9.3. [Authentication Strategy](#93-authentication-strategy)
10. [Quality Scenarios](#10-quality-scenarios)
11. [Technical Risks](#11-technical-risks)
12. [Glossary](#12-glossary)


## 1. Introduction and Goals

The Demon Slayer Corps Project Management System (DSCPMS) is a web-based application designed to revolutionize project management through gamification and role-based task assignment. The system addresses the need for better organization and resource allocation in software development projects by implementing a bounty-based reward system.

### 1.1. Requirements Overview

**What is DSCPMS?**

The main purpose of DSCPMS is to provide a gamified project management platform that combines traditional Kanban board functionality with monetary incentives through a bounty system. The application is designed specifically for software development teams looking to increase productivity and engagement through structured reward mechanisms.

**Main Features:**
- **Role-based User Management**: Three distinct user roles (Goons, Hashira, Oyakatasama) with escalating privileges
- **Bounty-based Task System**: Tasks with monetary rewards to incentivize completion
- **Kanban Board Interface**: Visual task management with drag-and-drop functionality
- **Real-time Notifications**: Instant updates on task assignments, completions, and deadlines
- **License Management**: Controlled access through license-based authorization
- **Analytics and Reporting**: Performance metrics and progress tracking
- **Deadline Management**: Automated penalty system for missed deadlines

The application supports exactly three user roles with specific hierarchical relationships:
- **Goons (Junior Programmers)**: Can select tasks, update status, and view personal profile
- **Hashira (Senior Programmers)**: All Goon capabilities plus task creation and team monitoring
- **Oyakatasama (Administrators)**: Full system administration including user and license management

The system should handle an "unlimited" number of tasks but is designed with a focus on quality over quantity, encouraging meaningful task completion through the bounty system.

### 1.2. Quality Goals

| Priority | Quality Goal | Description |
|----------|-------------|-------------|
| 1 | Usability | The interface should be intuitive with minimal learning curve, following modern web design patterns with clear visual feedback for all user actions |
| 2 | Security | Role-based access control and secure authentication to protect user data and system integrity |
| 3 | Performance | Fast response times (<500ms for API calls) and efficient handling of concurrent users (up to 50 simultaneous users) |
| 4 | Maintainability | Clean, modular architecture following React best practices with comprehensive documentation |
| 5 | Scalability | Architecture should support growth from current requirements (200 users, 1000 tasks) to potential larger deployments |

### 1.3. Stakeholders

The following table contains the most important personas for this application:

| Stakeholder | Interest/Role |
|-------------|---------------|
| **Junior Programmers (Goons)** | End users seeking task opportunities with monetary incentives and skill development |
| **Senior Programmers (Hashira)** | Team leads managing projects and creating task assignments with appropriate bounties |
| **Administrators (Oyakatasama)** | System administrators controlling access, licenses, and overall system configuration |

## 2. Architecture Constraints

The constraints on this project are reflected in the final solution. This section shows them and their motivation.

### 2.1. Technical Constraints

| ID | Constraint | Description |
|----|------------|-------------|
| **Software and Programming Constraints** |
| TC1 | Implementation in JavaScript/TypeScript | The application must use JavaScript/TypeScript for both frontend and backend to maintain consistency and leverage modern web development practices |
| TC2 | React Framework | Frontend must be built with React 18+ to meet modern component-based architecture requirements |
| TC3 | Node.js Backend | Backend implementation must use Node.js to enable full-stack JavaScript development |
| TC4 | Open Source Dependencies | All third-party libraries must be available under compatible open source licenses |
| **Database Constraints** |
| TC5 | MySQL Database | System must use MySQL 8.0+ for data persistence|
| TC6 | Relational Data Model | Database design must follow normalized relational principles |
| **Deployment Constraints** |
| TC7 | Docker Containerization | Application must be containerized using Docker for consistent deployment |
| TC8 | Web-based Access | System must be accessible through standard web browsers without additional client software |

### 2.2. Organizational Constraints

| ID | Constraint | Description |
|----|------------|-------------|
| OC1 | Team | 5 student developers working collaboratively |
| OC2 | Time Schedule | One academic semester (approximately 12-16 weeks) development timeline |
| OC3 | Version Control | Git repository with collaborative branching strategy and comprehensive commit history |
| OC4 | Documentation | Complete technical documentation including API specifications and user guides |
| OC5 | Testing | Unit testing with minimum 70% coverage for critical business logic |
| OC6 | Code Quality | ESLint enforcement and consistent coding standards |

### 2.3. Conventions

| ID | Convention | Description |
|----|------------|-------------|
| C1 | Documentation | Structure based on arc42 template methodology |
| C2 | API Design | RESTful API following OpenAPI 3.0 specifications |
| C3 | Code Standards | JavaScript/TypeScript following Airbnb style guide with ESLint enforcement |
| C4 | Database Naming | Snake_case for database tables and columns, camelCase for application code |
| C5 | Component Structure | React functional components with hooks, organized by feature modules |

**Naming Conventions:**
- Database tables: `users`, `tasks`, `bounties`, `notifications`
- API endpoints: `/api/v1/resource-name` (kebab-case)
- React components: `PascalCase` (e.g., `TaskCard`, `UserProfile`)
- JavaScript variables and functions: `camelCase`

## 3. System Scope and Context

This chapter describes the environment and context of DSCPMS: who uses the system and on which other systems does DSCPMS depend.

### 3.1. Business Context

![Business Context](Business_context.png)

**Goons (Junior Programmers)**
Entry-level developers who use DSCPMS to find and complete programming tasks in exchange for monetary bounties. They interact with the system to browse available tasks, accept assignments, track progress, and manage their earnings.

**Hashira (Senior Programmers)**
Experienced developers who create and manage tasks, set bounty amounts, and monitor team progress. They have all the capabilities of Goons plus additional administrative functions for task and team management.

**Oyakatasama (System Administrators)**
System administrators responsible for user account management, license distribution, system configuration, and overall platform oversight. They have full access to all system functions.

### 3.2. Technical Context

![alt text](<out/Techical Context.png>)

DSCPMS consists of three main technical components:

**Frontend (React Application)**
The client-side application runs in modern web browsers and communicates with the backend via REST API calls. Built with React 18+ and HeroUI components for a responsive, interactive user interface.

**Backend (Node.js Server)**
The server-side application provides RESTful API endpoints for all business logic, built with Express.js framework. Handles authentication, authorization, data validation, and business rule enforcement.

**Database (MySQL)**
Persistent data storage using MySQL 8.0+ with normalized relational schema for users, tasks, bounties, notifications, and licenses.

| Interface | Protocol | Description |
|-----------|----------|-------------|
| Web UI | HTTPS | Browser-based user interface for all user interactions |
| API Communication | REST over HTTPS | JSON-based API for frontend-backend communication |
| Database Access | MySQL Protocol | Secure database connections with connection pooling |
| Development Tools | Docker | Containerized development and deployment environment |


## 4. Solution Strategy

At the core of DSCPMS is a role-based hierarchy that governs access to different system functions, combined with a bounty-based incentive system that gamifies task completion.

The application is built using a modern web development stack that emphasizes maintainability, scalability, and developer productivity:

**Frontend Strategy:** React 18+ with functional components and hooks provides a component-based architecture that is easy to understand, test, and extend. HeroUI component library ensures consistent design and reduces development time.

**Backend Strategy:** Node.js with Express.js following the MVC (Model-View-Controller) pattern provides a lightweight, fast server framework with clear separation of concerns. The MVC architecture ensures organized code structure with Models handling data logic, Controllers managing request/response flow, and Views (JSON responses) formatting output. RESTful API design enables potential future mobile applications.

**Data Strategy:** MySQL database with normalized schema design provides ACID compliance and reliable data persistence. Connection pooling and prepared statements ensure good performance and security.

**Security Strategy:** JWT-based authentication provides stateless, scalable session management. Role-based access control (RBAC) is implemented at both API and component levels to ensure proper authorization.

**Deployment Strategy:** Docker containerization provides consistent deployment environments and simplifies development setup. Docker Compose orchestrates multi-container deployment.

**Key Architectural Decisions:**

1. **Role-Based Architecture**: The three-tier user hierarchy (Goons → Hashira → Oyakatasama) is enforced throughout the system, from database constraints to UI component rendering.

2. **Bounty-First Design**: Tasks are always associated with monetary rewards, making the bounty system a core domain concept rather than an add-on feature.

3. **License-Controlled Access**: The system implements a license verification system that restricts functionality for unlicensed instances, adding a layer of access control.

4. **API-First Development**: The backend API is designed independently of the frontend, enabling potential future expansion to mobile or other client applications.

5. **Audit Trail**: All significant user actions are logged for compliance and debugging purposes.

## 5. Building Block View

The application is structured as a modern web application with clear separation between frontend presentation, backend business logic, and data persistence layers.

### 5.1. Whitebox DSCPMS System - Component Architecture

![High Level Block Diagram](high_level_block.png)

The system is decomposed into layered architecture with clear responsibilities:

**Client Layer (React Application)**
- **Intent/Responsibility**: User interface and user experience management
- **Interfaces**: 
  - HTTPS/WebSocket communication with backend
  - Component library integration (HeroUI)
  - State management for client-side data
- **Implementation**: React 18+ with functional components, HeroUI library, and modern JavaScript

**API Gateway Layer (Express.js Server)**
- **Intent/Responsibility**: Request routing, middleware processing, and API endpoint management
- **Interfaces**:
  - RESTful HTTP API endpoints
  - Database connections and queries
  - External service integrations
- **Implementation**: Node.js with Express.js framework, JWT authentication, input validation

**Database Layer (MySQL)**
- **Intent/Responsibility**: Data persistence, integrity, and retrieval
- **Interfaces**:
  - SQL queries from backend services
  - Database triggers and constraints
  - Backup and recovery operations
- **Implementation**: MySQL 8.0+ with normalized schema design

#### 5.1.1. Frontend Components (Blackbox)

**Intent/Responsibility**
The frontend provides an intuitive, responsive web interface for all user interactions with role-based component rendering and real-time updates.

**Interfaces**
- REST API consumption via HTTP/HTTPS
- Browser local storage for client-side state
- Real-time updates through API polling

**Files**
All frontend components are contained within the `frontend/src/` directory structure, organized by feature and component type.

#### 5.1.2. Backend Services (Blackbox)

**Intent/Responsibility**  
The backend implements all business logic, handles authentication and authorization, validates data, and manages external integrations.

**Interfaces**
- RESTful API endpoints (`/api/v1/*`)
- Database connection pooling
- JWT token management
- Input validation and sanitization

**Files**
Backend services are organized in the `backend/src/` directory with clear separation of concerns.

#### 5.1.3. Database Schema (Blackbox)

**Intent/Responsibility**
The database manages persistent data storage with referential integrity, constraints, and optimized query performance.

**Interfaces**
- MySQL connection protocol
- SQL query interface
- Backup and migration scripts

**Files**
Database schema definitions, migrations, and seed data are maintained in the `database/` directory.

### 5.2. Use Case View

![Use Cases](use_case.png)

### 5.3. Backend MVC Architecture

The backend follows the Model-View-Controller (MVC) pattern, providing clear separation of concerns:

![alt text](backend_mvc.png)

**Model Layer**
- **Intent/Responsibility**: Data models, business entities, and database interactions
- **Components**: User, Task, Bounty, Notification, License entities with validation rules
- **Implementation**: Sequelize ORM models with MySQL database integration

**Controller Layer** 
- **Intent/Responsibility**: Handle HTTP requests, parameter extraction, and response coordination
- **Components**: AuthController, TaskController, UserController, BountyController
- **Implementation**: Express.js route handlers with middleware integration

**View Layer**
- **Intent/Responsibility**: Format and structure API responses 
- **Components**: JSON response formatters, error response handlers
- **Implementation**: Structured JSON responses with consistent error handling

**MVC Benefits:**
- Clear separation of business logic (Models) from request handling (Controllers)
- Consistent data formatting through Views
- Easy testing of individual components
- Scalable architecture for feature additions

### 5.4. Domain Model

![alt text](domain_model.png)

### 5.5. Whitebox DSCPMS Backend API

The following diagram shows the main building blocks of the backend API and their interdependencies:

The backend API is functionally decomposed to separate responsibilities. Each module is encapsulated in its own package with clear interfaces and minimal coupling.

**Contained Blackboxes:**

| Module | Description |
|--------|-------------|
| **auth** | Authentication and authorization, JWT token management, user session handling |
| **users** | User account management, profile operations, team membership |
| **tasks** | Task lifecycle management, assignment logic, status tracking |
| **bounties** | Bounty calculation, payment processing, balance management |
| **notifications** | Real-time notification generation and delivery, user notification preferences |
| **licenses** | Team license validation, expiry checking, access control |
| **teams** | Team management, member operations, team statistics |

All blackboxes are organized into corresponding Node.js modules. These modules have minimal dependencies on each other but may depend on shared utilities:

**Shared Dependencies:**
- `middleware/`: Authentication, validation, error handling middleware
- `utils/`: Common utility functions, date helpers, formatters
- `config/`: Configuration management, environment variables

**Interfaces:**

| Interface | Description |
|-----------|-------------|
| **Authentication API** | JWT-based authentication endpoints for login, token refresh |
| **Users API** | CRUD operations for user management, profile updates |
| **Tasks API** | Task creation, assignment, status updates, filtering |
| **Bounties API** | Bounty payment processing, balance queries |
| **Notifications API** | Notification retrieval, marking as read, preferences |
| **Licenses API** | License validation, team access verification |
| **Teams API** | Team creation, member management, statistics |

#### 5.5.1. auth (Blackbox)

**Intent/Responsibility**  
The `auth` module provides secure authentication and authorization for all API endpoints, managing JWT tokens and user sessions.

**Interfaces:**

| Interface | Description |
|-----------|-------------|
| POST /api/v1/auth/login | Authenticate user credentials and issue JWT token |
| POST /api/v1/auth/register | Register new user account |
| POST /api/v1/auth/refresh | Refresh expired JWT tokens |
| POST /api/v1/auth/logout | Invalidate user session |
| Middleware: authenticateToken | Verify JWT token for protected routes |
| Middleware: authorizeRole | Check user role permissions |

**Files:**  
The `auth` module is contained in `backend/src/auth/` with controller, service, and middleware components.

**Quality/Performance:**
- JWT tokens expire after 8 hours
- Refresh tokens valid for 7 days
- Bcrypt with salt rounds of 10 for password hashing
- Rate limiting: 5 failed login attempts per 15 minutes per IP

#### 5.5.2. users (Blackbox)

**Intent/Responsibility**  
Manages user accounts, profiles, and team memberships. Handles user CRUD operations and role-based access control.

**Interfaces:**

| Interface | Description |
|-----------|-------------|
| GET /api/v1/users | List all users (admin only) |
| GET /api/v1/users/:id | Get user by ID |
| GET /api/v1/users/profile | Get current user profile |
| PUT /api/v1/users/:id | Update user information |
| PUT /api/v1/users/profile | Update current user profile |
| DELETE /api/v1/users/:id | Deactivate user account (admin only) |
| GET /api/v1/users/:id/tasks | Get tasks for specific user |
| GET /api/v1/users/:id/earnings | Get earnings history |

**Files:**  
The `users` module is contained in `backend/src/users/` including UserController, UserService, and User model.

**Business Rules:**
- Username must be unique (3-50 characters)
- Email must be valid and unique
- Users can only update their own profiles unless admin
- Deleted users retain historical data but cannot login

#### 5.5.3. tasks (Blackbox)

**Intent/Responsibility**  
Manages the complete task lifecycle from creation to completion, including assignment logic, status tracking, and deadline management.

**Interfaces:**

| Interface | Description |
|-----------|-------------|
| GET /api/v1/tasks | List tasks with filtering and pagination |
| GET /api/v1/tasks/:id | Get task details by ID |
| POST /api/v1/tasks | Create new task (Hashira/Admin only) |
| PUT /api/v1/tasks/:id | Update task details |
| DELETE /api/v1/tasks/:id | Delete task (Admin only) |
| POST /api/v1/tasks/:id/assign | Assign task to user (Goon selects task) |
| PUT /api/v1/tasks/:id/status | Update task status |
| POST /api/v1/tasks/:id/complete | Mark task as completed |
| GET /api/v1/tasks/available | Get available tasks for current user |

**Files:**  
The `tasks` module is contained in `backend/src/tasks/` including TaskController, TaskService, and Task model.

**Business Rules:**
- Only Hashira and Admins can create tasks
- Tasks can only be assigned to users in the same team
- Completed tasks cannot be modified
- Overdue tasks may incur penalties
- Task status follows strict workflow: AVAILABLE → IN_PROGRESS → REVIEW → COMPLETED

#### 5.5.4. bounties (Blackbox)

**Intent/Responsibility**  
Handles bounty calculations, payment processing, and user balance management for the reward system.

**Interfaces:**

| Interface | Description |
|-----------|-------------|
| GET /api/v1/bounties | List all bounties with filters |
| GET /api/v1/bounties/:id | Get bounty details |
| POST /api/v1/bounties/process | Process bounty payment (triggered by task completion) |
| GET /api/v1/bounties/user/:userId | Get bounties for specific user |
| GET /api/v1/bounties/pending | Get pending bounty payments |
| PUT /api/v1/bounties/:id/status | Update bounty status (Admin only) |

**Files:**  
The `bounties` module is contained in `backend/src/bounties/` including BountyController, BountyService, and Bounty model.

**Business Rules:**
- Bounties are automatically created when tasks are created
- Payment is processed upon task completion approval
- Bonus calculation based on early completion
- Penalty calculation for late completion
- Failed tasks return bounty to pool

#### 5.5.5. notifications (Blackbox)

**Intent/Responsibility**  
Generates, stores, and delivers notifications for system events, providing users with real-time updates about tasks, bounties, and team activities.

**Interfaces:**

| Interface | Description |
|-----------|-------------|
| GET /api/v1/notifications | Get notifications for current user |
| GET /api/v1/notifications/unread | Get unread notifications count |
| PUT /api/v1/notifications/:id/read | Mark notification as read |
| PUT /api/v1/notifications/mark-all-read | Mark all notifications as read |
| DELETE /api/v1/notifications/:id | Delete notification |
| POST /api/v1/notifications/preferences | Update notification preferences |

**Files:**  
The `notifications` module is contained in `backend/src/notifications/` including NotificationController, NotificationService, and Notification model.

**Notification Types:**
- TASK_ASSIGNED: When a task is assigned to user
- DEADLINE_REMINDER: 24 hours before task deadline
- TASK_COMPLETED: When assigned task is completed
- BOUNTY_RECEIVED: When bounty is paid to user
- LICENSE_EXPIRING: 7 days before license expiry

#### 5.5.6. licenses (Blackbox)

**Intent/Responsibility**  
Validates team licenses, checks expiry dates, and enforces access control based on license status.

**Interfaces:**

| Interface | Description |
|-----------|-------------|
| GET /api/v1/licenses | List all licenses (Admin only) |
| GET /api/v1/licenses/:id | Get license details |
| POST /api/v1/licenses | Issue new license (Admin only) |
| PUT /api/v1/licenses/:id | Update license (Admin only) |
| PUT /api/v1/licenses/:id/renew | Renew license |
| PUT /api/v1/licenses/:id/revoke | Revoke license (Admin only) |
| GET /api/v1/licenses/validate/:licenseKey | Validate license key |
| Middleware: validateLicense | Check user's team license validity |

**Files:**  
The `licenses` module is contained in `backend/src/licenses/` including LicenseController, LicenseService, and License model.

**Business Rules:**
- One license per team
- License must be active for team members to access system
- Expired licenses block all team member access
- Revoked licenses cannot be renewed
- Maximum users per license enforced

#### 5.5.7. teams (Blackbox)

**Intent/Responsibility**  
Manages team entities, member operations, and provides team-level statistics and reporting.

**Interfaces:**

| Interface | Description |
|-----------|-------------|
| GET /api/v1/teams | List all teams (Admin only) |
| GET /api/v1/teams/:id | Get team details |
| POST /api/v1/teams | Create new team (Admin only) |
| PUT /api/v1/teams/:id | Update team information |
| DELETE /api/v1/teams/:id | Delete team (Admin only) |
| GET /api/v1/teams/:id/members | Get team members |
| POST /api/v1/teams/:id/members | Add member to team |
| DELETE /api/v1/teams/:id/members/:userId | Remove member from team |
| GET /api/v1/teams/:id/statistics | Get team performance statistics |

**Files:**  
The `teams` module is contained in `backend/src/teams/` including TeamController, TeamService, and Team model.

**Business Rules:**
- Team names must be unique
- Teams must have valid license to be active
- Removing last member deactivates team
- Team statistics include task completion rates, total bounties earned

### 5.6. Building Blocks - Level 2 (Whitebox)

#### 5.6.1. auth (Whitebox)

**Internal Structure:**

The `auth` module implements a layered architecture with clear separation between HTTP handling, business logic, and data access:

```
auth/
├── AuthController.js      - HTTP request handling, input validation
├── AuthService.js         - Business logic, JWT generation, password verification
├── authMiddleware.js      - Authentication and authorization middleware
└── authUtils.js           - Helper functions for token operations
```

**Contained Components:**

| Component | Responsibility |
|-----------|----------------|
| AuthController | Handles login, register, refresh, logout endpoints; validates request data |
| AuthService | Generates JWT tokens, verifies passwords with bcrypt, manages refresh tokens |
| authenticateToken | Middleware that extracts and verifies JWT from request headers |
| authorizeRole | Middleware that checks user role permissions (GOON, HASHIRA, OYAKATASAMA) |
| authUtils | Token signing, verification, expiry checking utilities |

**Dependencies:**
- `jsonwebtoken`: JWT token generation and verification
- `bcrypt`: Password hashing and comparison
- `User model`: User data retrieval and validation
- `config/jwt.config.js`: JWT secret and expiration settings

**Workflow:**
1. User sends credentials to `/api/v1/auth/login`
2. AuthController validates input format
3. AuthService retrieves user from database
4. Password verified using bcrypt.compare()
5. JWT token generated with user id and role
6. Token returned to client with expiration time

#### 5.6.2. users (Whitebox)

**Internal Structure:**

```
users/
├── UserController.js      - REST endpoint handlers
├── UserService.js         - User business logic
├── UserModel.js           - Sequelize model definition
└── userValidation.js      - Input validation schemas
```

**Contained Components:**

| Component | Responsibility |
|-----------|----------------|
| UserController | Handles HTTP requests for user CRUD operations |
| UserService | Business logic for user operations, role checks, team membership |
| UserModel | Database entity with validation rules and associations |
| userValidation | Joi schemas for input validation |

**Dependencies:**
- Sequelize ORM for database operations
- Team model for team association
- License model for license validation
- Bcrypt for password hashing

**Key Operations:**
- `createUser()`: Validates uniqueness, hashes password, assigns default role
- `updateUser()`: Checks permissions, validates changes, updates database
- `getUserEarnings()`: Aggregates bounty payments for user
- `getUserTasks()`: Retrieves tasks with filtering by status

#### 5.6.3. tasks (Whitebox)

**Internal Structure:**

```
tasks/
├── TaskController.js      - REST endpoint handlers
├── TaskService.js         - Task business logic
├── TaskModel.js           - Sequelize model with associations
├── taskValidation.js      - Input validation
└── taskHelpers.js         - Penalty/bonus calculations
```

**Contained Components:**

| Component | Responsibility |
|-----------|----------------|
| TaskController | Handles task CRUD, assignment, status updates |
| TaskService | Implements task lifecycle logic, permission checks |
| TaskModel | Database entity with status enum and relationships |
| taskHelpers | Calculate penalties for overdue tasks, bonuses for early completion |

**Dependencies:**
- User model for assignment
- Bounty model for automatic bounty creation
- Notification service for event notifications
- Team model for team-based filtering

**Business Logic:**
- `assignTask()`: Validates user eligibility, updates status, creates notification
- `completeTask()`: Verifies completion, triggers bounty processing, sends notifications
- `calculatePenalty()`: Computes penalty based on days overdue
- `isOverdue()`: Checks if current date exceeds deadline

#### 5.6.4. bounties (Whitebox)

**Internal Structure:**

```
bounties/
├── BountyController.js    - REST endpoint handlers
├── BountyService.js       - Payment processing logic
├── BountyModel.js         - Sequelize model
└── bountyCalculator.js    - Bonus/penalty calculation algorithms
```

**Contained Components:**

| Component | Responsibility |
|-----------|----------------|
| BountyController | Handles bounty queries and status updates |
| BountyService | Processes payments, updates user balances |
| BountyModel | Database entity with task association |
| bountyCalculator | Implements reward calculation formulas |

**Dependencies:**
- Task model for task completion data
- User model for balance updates
- Notification service for payment notifications

**Payment Processing Flow:**
1. Task completion triggers `processBounty()`
2. Calculate final amount (base + bonus - penalty)
3. Create transaction record
4. Update user balance
5. Update bounty status to PAID
6. Send notification to user

#### 5.6.5. notifications (Whitebox)

**Internal Structure:**

```
notifications/
├── NotificationController.js  - REST endpoint handlers
├── NotificationService.js     - Notification generation logic
├── NotificationModel.js       - Sequelize model
└── notificationTemplates.js   - Message templates
```

**Contained Components:**

| Component | Responsibility |
|-----------|----------------|
| NotificationController | Handles notification retrieval and marking as read |
| NotificationService | Creates notifications, determines recipients |
| NotificationModel | Database entity with type enum |
| notificationTemplates | Pre-defined message templates for different event types |

**Event Triggers:**
- Task assigned → Notify assigned user
- Task completed → Notify creator and assignee
- Bounty paid → Notify recipient
- Deadline approaching → Notify assignee (automated job)
- License expiring → Notify team admin (automated job)

#### 5.6.6. licenses (Whitebox)

**Internal Structure:**

```
licenses/
├── LicenseController.js   - REST endpoint handlers
├── LicenseService.js      - Validation and renewal logic
├── LicenseModel.js        - Sequelize model
└── licenseGenerator.js    - License key generation
```

**Contained Components:**

| Component | Responsibility |
|-----------|----------------|
| LicenseController | Handles license CRUD and validation endpoints |
| LicenseService | Validates licenses, checks expiry, enforces limits |
| LicenseModel | Database entity with team association |
| licenseGenerator | Generates unique license keys |

**Validation Logic:**
```javascript
function isValid(license) {
  return license.status === 'ACTIVE' 
    && license.expiryDate > new Date()
    && !license.isRevoked;
}

function canAccommodateUsers(license, currentMemberCount) {
  return currentMemberCount < license.maxUsers;
}
```

#### 5.6.7. teams (Whitebox)

**Internal Structure:**

```
teams/
├── TeamController.js      - REST endpoint handlers
├── TeamService.js         - Team operations logic
├── TeamModel.js           - Sequelize model
└── teamStatistics.js      - Statistics calculation
```

**Contained Components:**

| Component | Responsibility |
|-----------|----------------|
| TeamController | Handles team CRUD and member management |
| TeamService | Team operations, member addition/removal |
| TeamModel | Database entity with user and license associations |
| teamStatistics | Aggregates team performance metrics |

**Team Statistics:**
- Total tasks completed
- Total bounties earned
- Average task completion time
- Active member count
- Task completion rate by priority

**Member Management:**
- `addMember()`: Validates license capacity, adds user to team
- `removeMember()`: Removes user, reassigns their tasks
- `getMemberCount()`: Returns current active member count

## 6. Runtime View

User interaction with DSCPMS involves several key workflows that demonstrate the system's behavior during typical operations.

### 6.1. User Authentication Flow

![alt text](Auth.png)

### 6.2. Task Assignment and Completion

![alt text](TaskFlow.png)

### 6.3. Notification System Flow

![alt text](notificationflow.png)

### 6.4. License Validation and Team Access Control

```plantuml
@startuml DSCPMS_License_Flow
!theme plain
title License Validation and Team Access Control Flow

actor "Oyakatasama\n(Admin)" as Admin
actor "Team Member\n(Goon/Hashira)" as User
participant "Frontend" as F
participant "API Gateway" as API
participant "Auth Middleware" as Auth
participant "Database" as DB

== License Issuance (Admin) ==
Admin -> F: Create team with license
F -> API: POST /api/v1/teams
API -> Auth: verifyRole(OYAKATASAMA)
Auth --> API: authorized
API -> DB: INSERT INTO teams (name, description)
DB --> API: team_id
API -> DB: INSERT INTO licenses (team_id, license_key, status='active')
DB --> API: license created
API --> F: success response
F --> Admin: Team and license created

== User Login with License Check ==
User -> F: Enter credentials
F -> API: POST /api/v1/auth/login
API -> DB: SELECT user, team, license WHERE username=?
DB --> API: user + team + license data

alt License Exists and Active
    API -> API: generateJWT(user, team, role)
    API --> F: JWT token
    F --> User: Access granted
else No License or Revoked
    API --> F: 403 Forbidden
    F --> User: "Team license missing or revoked"
end

== Feature Access (Automatic Validation) ==
User -> F: Access any feature
F -> API: API call with JWT
API -> Auth: validateJWT(token)
Auth -> Auth: check token validity
alt JWT valid
    Auth --> API: proceed
    API --> F: feature response
else JWT invalid
    Auth --> API: 401 Unauthorized
    API --> F: error
    F --> User: "Please login again"
end

== License Revocation (Admin) ==
Admin -> F: Revoke team license
F -> API: PUT /api/v1/licenses/{teamId}/revoke
API -> Auth: verifyRole(OYAKATASAMA)
API -> DB: UPDATE licenses SET status='revoked'
DB --> API: success
API --> F: revoked
F --> Admin: License revoked
note right: Users must re-login to be logged out

@enduml
```

![alt text](license_flow.png)

## 7. Deployment View

![alt text](deployment.png)

| Component | Technology | Description |
|-----------|------------|-------------|
| **Development Environment** | Node.js, Git, VSCode | Local development setup with hot reload and debugging |
| **Frontend Container** | React 18+, Vite, nginx | Production-optimized React build served by nginx |
| **Backend Container** | Node.js 18+, Express.js | API server with business logic and authentication |
| **Database Container** | MySQL 8.0+ | Persistent data storage with volume mounting |
| **Reverse Proxy** | nginx | Load balancing, SSL termination, and static file serving |

**Deployment Requirements:**
- Docker Engine 20.10+
- Docker Compose 2.0+
- Minimum 4GB RAM for all containers
- 20GB available disk space
- Network access for external API calls (if needed)

**Environment Configuration:**
- Development: Docker Compose with hot reload and debug ports exposed
- Production: Multi-stage Docker builds with optimized images and security hardening

---

## 8. Concepts

### 8.1. Domain Models

DSCPMS is built around a clear domain model that represents the core business entities and their relationships:

![alt text](domain_class_model.png)

**Core Domain Entities:**

| Entity | Description | Key Attributes |
|--------|-------------|----------------|
| **Team** | Project teams with shared license | name, licenseKey, memberCount, createdAt |
| **User** | System users with role-based privileges | username, email, role (Goon/Hashira/Oyakatasama), balance, teamId |
| **Task** | Work items with bounty rewards | title, description, bountyAmount, deadline, status, priority, teamId |
| **Bounty** | Monetary rewards for task completion | amount, status (pending/paid/cancelled), paidAt |
| **License** | Team-based access control | licenseKey, teamId, status, expiryDate, maxUsers |
| **Notification** | System-generated user notifications | type, message, readStatus, timestamp |

**Important Business Methods:**

```typescript
class Team {
  hasValidLicense(): boolean
  canAddMember(): boolean
  getMemberCount(): number
  isLicenseExpired(): boolean
}

class User {
  canCreateTask(): boolean
  canAssignTask(): boolean  
  hasValidTeamLicense(): boolean
  calculateTotalEarnings(): number
  getTeam(): Team
}

class Task {
  isOverdue(): boolean
  canBeAssignedTo(user: User): boolean
  calculatePenalty(): number
  getTimeRemaining(): Duration
  belongsToTeam(teamId: number): boolean
}

class Bounty {
  process(): void
  calculateBonus(): number
  canBePaid(): boolean
}

class License {
  isValid(): boolean
  isExpired(): boolean
  canAccommodateUsers(count: number): boolean
}
```

### 8.2. Persistency

DSCPMS uses MySQL 8.0+ for relational data storage with a normalized database schema designed for data integrity and query performance.

**Database Schema Design:**
```sql
-- Core Tables
CREATE TABLE teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE licenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT UNIQUE NOT NULL,
  license_key VARCHAR(255) UNIQUE NOT NULL,
  status ENUM('active', 'expired', 'revoked') DEFAULT 'active',
  max_users INT DEFAULT 10,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('goon', 'hashira', 'oyakatasama') NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE RESTRICT
);

CREATE TABLE tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  bounty_amount DECIMAL(8,2) NOT NULL,
  deadline DATETIME NOT NULL,
  status ENUM('available', 'in_progress', 'review', 'completed', 'cancelled') DEFAULT 'available',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  created_by INT NOT NULL,
  assigned_to INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);
```

**Data Access Patterns:**
- Connection pooling for optimal database performance
- Prepared statements for SQL injection prevention  
- Transaction management for data consistency
- Indexing on frequently queried columns (user roles, task status, deadlines)

**Backup and Recovery:**
- Automated daily backups of critical data
- Point-in-time recovery capability
- Database migration scripts for schema versioning

### 8.3. User Interface

The DSCPMS interface is built with React 18+ and HeroUI components, providing a modern, responsive web application that adapts to different screen sizes and user roles.

**Design Principles:**
- **Role-based UI**: Interface elements are conditionally rendered based on user permissions
- **Responsive Design**: Mobile-first approach with breakpoints for tablet and desktop
- **Accessibility**: WCAG 2.1 Level A compliance with proper ARIA labels and keyboard navigation
- **Performance**: Lazy loading, code splitting, and optimized bundle sizes

**Component Architecture:**
```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (Button, Modal, etc.)
│   ├── task/            # Task-specific components (TaskCard, TaskBoard)
│   └── user/            # User-specific components (UserProfile, UserList)
├── pages/               # Route-level components  
│   ├── Dashboard.tsx    # Role-specific dashboard
│   ├── TaskBoard.tsx    # Kanban task management
│   └── Login.tsx        # Authentication
├── hooks/               # Custom React hooks
├── services/            # API communication
└── types/               # TypeScript type definitions
```

**Theme and Styling:**
- CSS-in-JS with HeroUI theme system
- Dark/light mode support
- Demon Slayer-inspired color palette
- Consistent spacing and typography scales

### 8.4. Security

DSCPMS implements multiple layers of security to protect user data and ensure proper access control:

**Authentication:**
- JWT-based stateless authentication with configurable expiration
- bcrypt password hashing with salt rounds
- Secure password policies enforced client and server-side
- Session timeout and automatic logout functionality

**Authorization:**
- Role-based access control (RBAC) at API endpoint level
- Component-level permission checks in frontend
- Database-level constraints for data integrity
- License-based system access control

**Data Protection:**
- Input validation and sanitization on all user inputs
- SQL injection prevention through parameterized queries
- XSS protection via content security policies
- HTTPS enforcement for all communications

**Security Headers:**
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
```

### 8.5. Session Handling

DSCPMS uses stateless JWT-based session management for scalability and security:

**JWT Token Structure:**
```javascript
{
  "sub": "user_id",
  "role": "hashira",
  "iat": 1634567890,
  "exp": 1634654290,
  "permissions": ["create_task", "assign_task", "view_analytics"]
}
```

**Session Features:**
- Token expiration after 8 hours of inactivity
- Refresh token mechanism for seamless user experience
- Automatic logout on token expiration
- Role-based token content for efficient authorization checks

### 8.6. Error Handling

Comprehensive error handling ensures system stability and provides meaningful feedback to users:

**Frontend Error Handling:**
```typescript
// Global error boundary for React component errors
class ErrorBoundary extends React.Component {
  handleError(error: Error, errorInfo: ErrorInfo) {
    console.error('Application error:', error, errorInfo);
    // Report to error tracking service
  }
}

// API error handling with user-friendly messages
const handleApiError = (error: AxiosError) => {
  if (error.response?.status === 401) {
    // Redirect to login
    authService.logout();
  } else if (error.response?.status >= 500) {
    // Show generic error message
    showNotification('System error. Please try again later.');
  }
};
```

**Backend Error Handling:**
```javascript
// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        details: err.details
      }
    });
  } else {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});
```

### 8.7. Logging and Monitoring

Structured logging and monitoring provide visibility into system operations and performance:

**Logging Strategy:**
- Structured JSON logs for easier parsing and analysis
- Different log levels (debug, info, warn, error) for various environments
- Request/response logging for API calls
- Security event logging for audit trails

**Example Log Format:**
```json
{
  "timestamp": "2023-11-28T10:30:00Z",
  "level": "info",
  "service": "task-service",
  "userId": 123,
  "action": "task_created",
  "taskId": 456,
  "bountyAmount": 100,
  "duration": 45
}
```

### 8.8. Configuration

Environment-based configuration management supports different deployment scenarios:

**Configuration Structure:**
```javascript
// config/default.js
module.exports = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    name: process.env.DB_NAME || 'dscpms',
    pool: {
      min: 5,
      max: 20,
      acquireTimeoutMillis: 60000
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  },
  bounty: {
    maxAmount: 1000,
    penaltyRate: 0.1,
    deadlineWarningHours: 24
  }
};
```

---

## 9. Design Decisions

### 9.1. Technology Stack Selection

**Problem:**
Choose appropriate technologies for a web-based project management application that balances learning objectives, development efficiency, and system requirements.

**Constraints:**
- Must use modern web technologies suitable for academic project
- Must support role-based access control and real-time features
- Need to complete within one academic semester

**Considered Alternatives:**
1. **Frontend**: React vs Vue.js vs Angular
2. **Backend**: Node.js vs Python Flask vs Java Spring Boot
3. **Database**: MySQL vs PostgreSQL vs MongoDB

**Decision:**
Chose React + Node.js + MySQL stack because:
- **React Ecosystem**: Large community, excellent documentation, and extensive learning resources
- **Express.js**: Lightweight, flexible, and well-suited for RESTful API development
- **MySQL**: Familiar relational database with excellent performance characteristics

### 9.2. Database Design

**Problem:**
Design a database schema that supports the bounty-based task management system with proper normalization, referential integrity, and query performance.

**Considered Alternatives:**
1. **Denormalized approach**: Store all task and user data in fewer tables for simplicity
2. **Over-normalized approach**: Separate every attribute into its own table
3. **Balanced normalization**: Third normal form with performance considerations

**Decision:**
Implemented a balanced approach (3NF) with strategic denormalization:
- **Users table**: Core user data with role enum for efficient querying
- **Tasks table**: Task details with foreign keys to users for creator and assignee
- **Bounties table**: Separate entity for tracking monetary transactions

**Benefits:**
- Data integrity through foreign key constraints
- Efficient queries for common operations (task listing, user lookup)
- Clear separation of concerns between entities
- Audit trail for financial transactions

### 9.3. Authentication Strategy

**Problem:**
Implement secure authentication that supports role-based access control while maintaining good user experience.

**Considered Alternatives:**
1. **Session-based authentication**: Server-side sessions with cookies
2. **JWT tokens**: Stateless tokens with client-side storage
3. **OAuth integration**: Third-party authentication providers

**Decision:**
Selected JWT-based authentication because:
- **Stateless**: Scales better and simplifies server deployment
- **Self-contained**: Tokens include user role and permissions for efficient authorization
- **Mobile-ready**: Easy to implement in future mobile applications

**Implementation Details:**
```javascript
// JWT payload includes role for efficient authorization
const token = jwt.sign({
  sub: user.id,
  role: user.role,
  permissions: getUserPermissions(user.role)
}, JWT_SECRET, { expiresIn: '8h' });
```

---

## 10. Quality Scenarios

### 10.1. Quality Tree

## 10. Quality Scenarios

### 10.1. Quality Tree

```
DSCPMS Quality Goals
├── Usability
│   ├── Learning Curve (High Priority)
│   │   └── New users can complete basic tasks within 10 minutes
│   └── Interface Consistency (Medium Priority)
│       └── All pages follow consistent navigation patterns
├── Performance  
│   ├── Response Time (High Priority)
│   │   └── API calls respond within 500ms for 95% of requests
│   └── Concurrent Users (Medium Priority)
│       └── Support 50 simultaneous users without degradation
├── Security
│   ├── Authentication (High Priority)
│   │   └── Secure login with role-based access control
│   └── Data Protection (High Priority)
│       └── All user data encrypted and validated
└── Maintainability
    ├── Code Quality (Medium Priority)
    │   └── 70% test coverage with clean architecture
    └── Documentation (Medium Priority)
        └── Complete API and component documentation
```

### 10.2. Evaluation Scenarios

**Usability - New User Onboarding**
*Scenario*: A new Goon user logs in for the first time and wants to select and complete their first task.
*Measurement*: Time from login to task selection should be under 5 minutes without training.
*Architecture Support*: Clear dashboard design with visual task cards and intuitive status progression.

**Performance - Concurrent Task Updates**
*Scenario*: 20 users simultaneously update task statuses during peak usage.
*Measurement*: All updates complete within 2 seconds with no data conflicts.
*Architecture Support*: Database connection pooling and optimistic locking prevent performance bottlenecks.

**Security - Role Privilege Escalation**
*Scenario*: A Goon user attempts to access Hashira-only functions through direct API calls.
*Measurement*: All unauthorized attempts are blocked and logged.
*Architecture Support*: Multi-layer authorization checks at API middleware and service levels.

**Maintainability - Feature Addition**
*Scenario*: Adding a new task filter feature requires changes across frontend and backend.
*Measurement*: Implementation completed in under 4 hours by a new team member.
*Architecture Support*: Modular component structure and clear API patterns enable quick feature addition.

---

## 11. Technical Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| **Database Performance Degradation** | Medium | High | Implement query optimization, indexing, and connection pooling. Monitor query performance in development. |
| **JWT Token Security Vulnerabilities** | Low | High | Use strong secrets, implement proper token expiration, and regular security audits. |
| **React Component State Management Complexity** | High | Medium | Use established patterns (Context API, custom hooks) and maintain clear data flow. |
| **API Rate Limiting Bypass** | Medium | Medium | Implement multiple layers of rate limiting and input validation. |
| **Database Schema Changes Breaking Compatibility** | Medium | High | Use database migration scripts and maintain backward compatibility during transitions. |
| **Third-party Library Vulnerabilities** | Medium | Medium | Regular dependency updates, security scanning, and minimal external dependencies. |


**Risk Monitoring:**
```
- Weekly security scans of dependencies
- Performance monitoring in development environment
- Code review process for all changes
- Automated testing to catch regression issues
│   │   └── API calls respond within 500ms for 95% of requests
│   └── Concurrent Users (Medium Priority)
│       └── Support 50 simultaneous users without degradation
├── Security
│   ├── Authentication (High Priority)
│   │   └── Secure login with role-based access control
│   └── Data Protection (High Priority)
│       └── All user data encrypted and validated
└── Maintainability
    ├── Code Quality (Medium Priority)
    │   └── 70% test coverage with clean architecture
    └── Documentation (Medium Priority)
        └── Complete API and component documentation
```
### 10.2. Evaluation Scenarios

**Usability - New User Onboarding**
*Scenario*: A new Goon user logs in for the first time and wants to select and complete their first task.
*Measurement*: Time from login to task selection should be under 5 minutes without training.
*Architecture Support*: Clear dashboard design with visual task cards and intuitive status progression.

**Performance - Concurrent Task Updates**
*Scenario*: 20 users simultaneously update task statuses during peak usage.
*Measurement*: All updates complete within 2 seconds with no data conflicts.
*Architecture Support*: Database connection pooling and optimistic locking prevent performance bottlenecks.

**Security - Role Privilege Escalation**
*Scenario*: A Goon user attempts to access Hashira-only functions through direct API calls.
*Measurement*: All unauthorized attempts are blocked and logged.
*Architecture Support*: Multi-layer authorization checks at API middleware and service levels.

**Maintainability - Feature Addition**
*Scenario*: Adding a new task filter feature requires changes across frontend and backend.
*Measurement*: Implementation completed in under 4 hours by a new team member.
*Architecture Support*: Modular component structure and clear API patterns enable quick feature addition.

---

## 11. Technical Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| **Database Performance Degradation** | Medium | High | Implement query optimization, indexing, and connection pooling. Monitor query performance in development. |
| **JWT Token Security Vulnerabilities** | Low | High | Use strong secrets, implement proper token expiration, and regular security audits. |
| **React Component State Management Complexity** | High | Medium | Use established patterns (Context API, custom hooks) and maintain clear data flow. |
| **API Rate Limiting Bypass** | Medium | Medium | Implement multiple layers of rate limiting and input validation. |
| **Database Schema Changes Breaking Compatibility** | Medium | High | Use database migration scripts and maintain backward compatibility during transitions. |
| **Third-party Library Vulnerabilities** | Medium | Medium | Regular dependency updates, security scanning, and minimal external dependencies. |

**Risk Monitoring:**
- Weekly security scans of dependencies
- Performance monitoring in development environment
- Code review process for all changes
- Automated testing to catch regression issues

---

## 12. Glossary

| Term | Definition |
|------|------------|
| **Bounty** | Monetary reward associated with task completion |
| **Goon** | Junior programmer role with basic system access |
| **Hashira** | Senior programmer role with task creation and management capabilities |
| **Oyakatasama** | Administrator role with full system access and user management |
| **JWT** | JSON Web Token - a compact, self-contained way to securely transmit information |
| **Kanban** | Visual project management method using boards and cards |
| **RBAC** | Role-Based Access Control - access permissions based on user roles |
| **API** | Application Programming Interface - set of protocols for building applications |
| **REST** | Representational State Transfer - architectural style for distributed systems |
| **CRUD** | Create, Read, Update, Delete - basic data operations |
| **Docker** | Containerization platform for packaging applications |
| **Express.js** | Web application framework for Node.js |
| **HeroUI** | React component library for building user interfaces |
| **MySQL** | Open-source relational database management system |
| **Node.js** | JavaScript runtime environment for server-side development |
| **React** | JavaScript library for building user interfaces |
| **Vite** | Build tool and development server for modern web projects |
| **WCAG** | Web Content Accessibility Guidelines - standards for accessible web content |
| **XSS** | Cross-Site Scripting - type of security vulnerability in web applications |

---

## About this Document

This design document follows the arc42 architecture template methodology, providing a comprehensive overview of the Demon Slayer Corps Project Management System architecture, design decisions, and implementation approach. The document serves as both a technical specification for development teams and an educational resource for understanding modern web application architecture.

**Document Maintainers:** DSCPMS Development Team  
**Last Updated:** December 2024  
**Version:** 1.0  
**Review Cycle:** Updated with each major system revision


*This document uses material inspired by the arc42 architecture template and follows software engineering documentation best practices for academic and professional software development projects.*