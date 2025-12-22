# DSCPMS API Documentation

**Base URL:** `http://localhost:3000/api`  
**Authentication:** JWT Bearer Token (except where noted as Public)

---

## 🔐 Authentication (`/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | Public | Register new user with team & license |
| POST | `/login` | Public | Login and receive JWT token |
| GET | `/me` | Required | Get current user info |
| POST | `/change-password` | Required | Change user password |

**Register Body:** `{ username, email, password, role, teamName, licenseKey }`  
**Login Body:** `{ email, password }`  
**Change Password:** `{ oldPassword, newPassword }`

### Examples

#### Register New User
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "tanjiro",
  "email": "tanjiro@dscpms.com",
  "password": "Goon123!",
  "role": "GOON",
  "teamName": "Demon Slayer Corps",
  "licenseKey": "DSCPMS-2024-UNLIMITED-ACCESS"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "tanjiro",
      "email": "tanjiro@dscpms.com",
      "role": "GOON",
      "balance": 0,
      "teamId": 1
    }
  }
}
```

#### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "tanjiro",
  "password": "Goon123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "tanjiro",
      "email": "tanjiro@dscpms.com",
      "role": "GOON",
      "balance": 1000.00,
      "teamId": 1
    }
  }
}
```

---

## 👥 Teams (`/teams`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/my-team` | Required | All | Get current user's team |
| POST | `/` | Required | All | Create new team |
| GET | `/` | Required | Admin | Get all teams |
| GET | `/:id` | Required | All | Get team by ID |
| PUT | `/:id` | Required | Hashira/Admin | Update team |
| DELETE | `/:id` | Required | Admin | Delete team |
| GET | `/:id/members` | Required | All | Get team members |
| POST | `/:id/members` | Required | Hashira/Admin | **Create new user account and add to team** |
| DELETE | `/:id/members/:userId` | Required | Hashira/Admin | Remove member |
| GET | `/:id/statistics` | Required | All | Get team statistics |

**Add Member (Create User):** `{ username, email, password, role }` - Creates new account and assigns to team  
**Note:** New workflow - Admin creates user account directly, user can then login immediately

### Examples

#### Create Team
```bash
POST /api/v1/teams/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "teamName": "Demon Slayer Corps",
  "description": "Elite demon hunting organization",
  "licenseKey": "DSCPMS-2024-UNLIMITED-ACCESS"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Team created successfully",
  "data": {
    "team": {
      "id": 1,
      "name": "Demon Slayer Corps",
      "description": "Elite demon hunting organization",
      "isActive": true,
      "createdBy": 1
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Add Member (Create User Account)
```bash
POST /api/v1/teams/1/members
Authorization: Bearer <hashira_or_admin_token>
Content-Type: application/json

{
  "username": "nezuko",
  "email": "nezuko@dscpms.com",
  "password": "TempPass123!",
  "role": "GOON"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Member created and added to team successfully",
  "data": {
    "user": {
      "id": 5,
      "username": "nezuko",
      "email": "nezuko@dscpms.com",
      "role": "GOON",
      "teamId": 1,
      "balance": 0
    },
    "credentials": {
      "username": "nezuko",
      "email": "nezuko@dscpms.com",
      "password": "TempPass123!"
    }
  }
}
```

**Note:** Share the credentials with the new user so they can login immediately!

#### Get Team Members
```bash
GET /api/v1/teams/1/members
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "rengoku",
      "email": "rengoku@dscpms.com",
      "role": "HASHIRA",
      "balance": 5000.00
    },
    {
      "id": 5,
      "username": "nezuko",
      "email": "nezuko@dscpms.com",
      "role": "GOON",
      "balance": 0.00
    }
  ]
}
```

#### Remove Team Member
```bash
DELETE /api/v1/teams/1/members/5
Authorization: Bearer <hashira_or_admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

---

## ✅ Tasks (`/tasks`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/` | Required + License | All | Get all tasks (with filters) |
| GET | `/board` | Required + License | All | Get kanban board view |
| GET | `/statistics` | Required + License | All | Get task statistics |
| GET | `/:id` | Required + License | All | Get task by ID |
| POST | `/` | Required + License | Hashira/Admin | Create new task |
| PUT | `/:id` | Required + License | All | Update task |
| DELETE | `/:id` | Required + License | Hashira/Admin | Delete task |
| POST | `/:id/assign` | Required + License | All | Assign task to self |
| PUT | `/:id/status` | Required + License | All | Update task status |

**Query Filters:** `status`, `priority`, `assignedTo`, `createdBy`  
**Create Task:** `{ title, description, priority, deadline, bountyAmount, penaltyAmount }`  
**Update Status:** `{ status }` (TODO/IN_PROGRESS/COMPLETED)

### Examples

#### Create Task (Hashira/Admin Only)
```bash
POST /api/v1/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Implement User Authentication API",
  "description": "Create RESTful endpoints for user registration and login",
  "priority": "HIGH",
  "bountyAmount": 500,
  "deadline": "2025-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Implement User Authentication API",
    "description": "Create RESTful endpoints for user registration and login",
    "status": "AVAILABLE",
    "priority": "HIGH",
    "bountyAmount": 500.00,
    "deadline": "2025-12-31T23:59:59.000Z",
    "createdBy": 2,
    "createdAt": "2025-12-21T10:00:00.000Z"
  }
}
```

#### Get All Tasks (with filters)
```bash
GET /api/v1/tasks?status=AVAILABLE&priority=HIGH
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Implement User Authentication API",
      "status": "AVAILABLE",
      "priority": "HIGH",
      "bountyAmount": 500.00,
      "deadline": "2025-12-31T23:59:59.000Z",
      "creator": {
        "id": 2,
        "username": "rengoku",
        "role": "HASHIRA"
      }
    }
  ]
}
```

#### Assign Task to Self
```bash
POST /api/v1/tasks/1/assign
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Implement User Authentication API",
    "status": "IN_PROGRESS",
    "assignedTo": 1,
    "assignedAt": "2025-12-21T10:30:00.000Z",
    "assignee": {
      "id": 1,
      "username": "tanjiro"
    }
  }
}
```

#### Update Task Status
```bash
PUT /api/v1/tasks/1/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "COMPLETED"
}
```

**Response (On Time - Bounty Paid):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "COMPLETED",
    "completedAt": "2025-12-25T14:00:00.000Z",
    "bountyPaid": 500.00,
    "newBalance": 1500.00
  },
  "message": "Task completed successfully! Bounty of $500.00 has been credited."
}
```

**Response (Late - Penalty Applied):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "COMPLETED",
    "completedAt": "2026-01-05T14:00:00.000Z",
    "penaltyApplied": 50.00,
    "newBalance": 950.00
  },
  "message": "Task completed late. Penalty of $50.00 has been deducted."
}
```

#### Get Kanban Board
```bash
GET /api/v1/tasks/board
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "AVAILABLE": [
      {
        "id": 2,
        "title": "Design Responsive Dashboard UI",
        "priority": "HIGH",
        "bountyAmount": 450.00
      }
    ],
    "IN_PROGRESS": [
      {
        "id": 1,
        "title": "Implement User Authentication API",
        "assignee": "tanjiro",
        "priority": "HIGH",
        "bountyAmount": 500.00
      }
    ],
    "COMPLETED": []
  }
}
```

#### Get Task Statistics
```bash
GET /api/v1/tasks/statistics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTasks": 15,
    "byStatus": {
      "AVAILABLE": 5,
      "IN_PROGRESS": 7,
      "COMPLETED": 3
    },
    "byPriority": {
      "HIGH": 6,
      "MEDIUM": 7,
      "LOW": 2
    },
    "averageBounty": 375.50,
    "totalBountiesPaid": 2150.00
  }
}
```

---

## 💰 Bounty (`/bounty`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/statistics` | Required + License | All | Get bounty statistics |
| GET | `/transactions/:userId` | Required + License | All | Get user transactions |
| POST | `/adjust` | Required + License | Admin | Manually adjust user balance |

**Adjust Balance:** `{ userId, amount, reason }`

### Examples

#### Get Bounty Statistics
```bash
GET /api/v1/bounty/statistics
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBountiesPaid": 15750.00,
    "totalPenaltiesApplied": 450.00,
    "totalTransactions": 87,
    "averageBountyAmount": 425.50,
    "transactionsByType": {
      "BOUNTY": 37,
      "PENALTY": 9,
      "ADJUSTMENT": 5
    }
  }
}
```

#### Get User Transactions
```bash
GET /api/v1/bounty/transactions/1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "type": "BOUNTY",
      "amount": 500.00,
      "description": "Task completed: Implement User Authentication API",
      "balanceBefore": 1000.00,
      "balanceAfter": 1500.00,
      "createdAt": "2025-12-25T14:00:00.000Z",
      "task": {
        "id": 1,
        "title": "Implement User Authentication API"
      }
    },
    {
      "id": 3,
      "type": "PENALTY",
      "amount": -50.00,
      "description": "Missed deadline",
      "balanceBefore": 1050.00,
      "balanceAfter": 1000.00,
      "createdAt": "2025-12-20T10:00:00.000Z"
    }
  ]
}
```

#### Adjust User Balance (Admin Only)
```bash
POST /api/v1/bounty/adjust
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": 1,
  "amount": 1000,
  "reason": "Performance bonus for excellent work"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balanceBefore": 1500.00,
    "balanceAfter": 2500.00,
    "adjustmentAmount": 1000.00,
    "reason": "Performance bonus for excellent work"
  }
}
```

---

## 👤 Users (`/users`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/` | Required | Admin | Get all users |
| GET | `/:id` | Required | All | Get user by ID |
| GET | `/:id/profile` | Required | All | Get user profile with stats |
| GET | `/:id/tasks` | Required | All | Get user's tasks |
| GET | `/:id/transactions` | Required | All | Get user's transactions |
| PUT | `/:id` | Required | All | Update user |
| PUT | `/:id/role` | Required + License | Admin | Update user role |
| DELETE | `/:id` | Required | Admin | Delete user |

**Roles:** `GOON`, `HASHIRA`, `OYAKATASAMA`

### Examples

#### Get User Profile with Stats
```bash
GET /api/v1/users/1/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "tanjiro",
      "email": "tanjiro@dscpms.com",
      "role": "GOON",
      "balance": 1500.00,
      "bio": "Junior Developer - Eager to learn"
    },
    "statistics": {
      "totalTasksCompleted": 8,
      "totalBountiesEarned": 3200.00,
      "totalPenaltiesPaid": 150.00,
      "averageCompletionTime": "3.5 days",
      "onTimeCompletionRate": 87.5
    }
  }
}
```

---

## 🔔 Notifications (`/notifications`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Required + License | Get user notifications |
| GET | `/unread` | Required + License | Get unread count |
| PUT | `/:id/read` | Required + License | Mark notification as read |
| PUT | `/mark-all-read` | Required + License | Mark all as read |
| DELETE | `/:id` | Required + License | Delete notification |

### Examples

#### Get Notifications
```bash
GET /api/v1/notifications
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "type": "TASK_ASSIGNED",
      "title": "New Task Assigned",
      "message": "You have been assigned: Implement User Authentication API",
      "isRead": false,
      "createdAt": "2025-12-21T10:30:00.000Z"
    },
    {
      "id": 9,
      "type": "BOUNTY_EARNED",
      "title": "Bounty Earned",
      "message": "You earned $500.00 for completing a task",
      "isRead": true,
      "createdAt": "2025-12-20T15:00:00.000Z"
    }
  ]
}
```

#### Get Notifications (Unread Only)
```bash
GET /api/v1/notifications?unread=true
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "type": "TASK_ASSIGNED",
      "title": "New Task Assigned",
      "message": "You have been assigned: Implement User Authentication API",
      "isRead": false,
      "createdAt": "2025-12-21T10:30:00.000Z"
    }
  ]
}
```

#### Get Unread Count
```bash
GET /api/v1/notifications/unread
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

#### Mark Notification as Read
```bash
PUT /api/v1/notifications/10/read
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": 10,
    "type": "TASK_ASSIGNED",
    "title": "New Task Assigned",
    "message": "You have been assigned: Implement User Authentication API",
    "isRead": true,
    "createdAt": "2025-12-21T10:30:00.000Z"
  }
}
```

#### Mark All Notifications as Read
```bash
PUT /api/v1/notifications/mark-all-read
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

#### Delete Notification
```bash
DELETE /api/v1/notifications/10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

## 🎫 License (`/license`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/validate` | Public | Validate license key |
| GET | `/me` | Required + License | Get current team's license |

**Validate Body:** `{ licenseKey }`

---

## 📋 Response Format

**Success:** `{ success: true, data: {...} }`  
**Error:** `{ success: false, message: "error description" }`

## 🔑 Authorization Header
```
Authorization: Bearer <jwt_token>
```

## ⚠️ Task Workflow
- **Create Task** → Hashira/Admin sets bounty/penalty
- **Assign** → Goon claims task
- **Complete** → On time = bounty paid | Late = penalty applied (10% of bounty)

## 💡 Key Features
- **Auto Penalty:** Late task completion deducts 10% of bounty from user balance
- **License Validation:** Most operations require valid team license
- **Role-Based Access:** Goon < Hashira < Oyakatasama (Admin)

---

## ⚠️ Error Response Example

```bash
POST /api/v1/tasks/999/assign
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": false,
  "message": "Task not found"
}
```

---

## 🧪 Demo Credentials (After Running `npm run db:seed`)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dscpms.com | Admin123! |
| Hashira | rengoku@dscpms.com | Hashira123! |
| Hashira | shinobu@dscpms.com | Hashira123! |
| Goon | tanjiro@dscpms.com | Goon123! |
| Goon | zenitsu@dscpms.com | Goon123! |
| Goon | inosuke@dscpms.com | Goon123! |

**Default License Key:** `DSCPMS-2024-UNLIMITED-ACCESS`
