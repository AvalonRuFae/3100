# License System Documentation

## Overview

The Rikugan license system has been redesigned to be simple and environment-based:

- **Licenses are configured in environment variables** (not in database initially)
- **One license per team** - enforced at database level
- **License validation on every protected request** - via middleware
- **No manual license CRUD operations** - licenses managed through environment config

## Architecture

### License Flow

1. **Server Startup**: Licenses loaded from `LICENSES` environment variable into memory
2. **Team Creation**: User provides license key → system validates → creates team and assigns license
3. **Every Request**: Middleware validates user's team license (active & not expired)
4. **Auto-Expiration**: Licenses automatically deactivated when expiration date passes

### Components

#### 1. License Middleware (`middleware/validateLicense.js`)

**Purpose**: Validate user's team license on every protected request

**Functions**:
- `validateLicense` - Middleware for route protection
- `loadLicensesFromConfig()` - Load licenses from environment
- `validateLicenseKey(key)` - Validate license during team creation

**Usage**:
```javascript
const { validateLicense } = require('../middleware/validateLicense');

// Apply to protected routes
router.get('/tasks', authenticateToken, validateLicense, TaskController.getTasks);
```

#### 2. License Service (`services/LicenseService.js`)

**Purpose**: Business logic for license operations

**Methods**:
- `validateForTeamCreation(licenseKey)` - Validate license for new team
- `createLicenseForTeam(licenseData)` - Create license record for team
- `getLicenseByTeamId(teamId)` - Get team's license
- `isLicenseValid(teamId)` - Check if license is valid

#### 3. License Controller (`controllers/LicenseController.js`)

**Endpoints**:
- `POST /api/v1/licenses/validate` - Validate license key (public)
- `GET /api/v1/licenses/me` - Get current team's license (authenticated)

#### 4. License Model (`models/License.js`)

**Schema**:
```javascript
{
  id: INTEGER (PK),
  teamId: INTEGER (unique, required) // One license per team
  teamName: STRING,
  licenseKey: STRING (unique, required),
  isActive: BOOLEAN (default: true),
  expirationDate: DATE (required),
  maxUsers: INTEGER (required),
  notes: TEXT
}
```

## Configuration

### Environment Variables

Add to `.env` file:

```bash
# License Configuration
LICENSES=[{"key":"RIKUGAN-2024-TEAM-A","max_users":50,"expiry_date":"2025-12-31"},{"key":"RIKUGAN-2024-TEAM-B","max_users":100,"expiry_date":"2025-12-31"}]
```

**License Object Structure**:
```javascript
{
  "key": "RIKUGAN-2024-TEAM-A",     // Unique license key
  "max_users": 50,                  // Maximum users for this license
  "expiry_date": "2025-12-31"       // Expiration date (YYYY-MM-DD)
}
```

## Usage Examples

### Team Creation Flow

```javascript
// 1. User registers (team_id = NULL)
POST /api/v1/auth/register
{
  "username": "john",
  "email": "john@example.com",
  "password": "password123",
  "role": "OYAKATASAMA"
}

// 2. User logs in (redirected to team creation panel)
POST /api/v1/auth/login
{
  "username": "john",
  "password": "password123"
}
// Response: { token, no_team: true }

// 3. Validate license key
POST /api/v1/licenses/validate
{
  "licenseKey": "RIKUGAN-2024-TEAM-A"
}
// Response: { valid: true, config: {maxUsers: 50, expiryDate: "2025-12-31"} }

// 4. Create team with license
POST /api/v1/teams/create
{
  "teamName": "My Team",
  "licenseKey": "RIKUGAN-2024-TEAM-A"
}
// System creates team, assigns license, updates user.team_id
```

### Protected Route Access

```javascript
// Every protected request checks license
GET /api/v1/tasks
Authorization: Bearer <token>

// Middleware flow:
// 1. authenticateToken - verifies JWT, extracts user_id, team_id
// 2. validateLicense - checks team's license (active & not expired)
// 3. If valid → proceed to handler
// 4. If invalid → 403 Forbidden
```

### Get Current Team License

```javascript
GET /api/v1/licenses/me
Authorization: Bearer <token>

// Response:
{
  "success": true,
  "data": {
    "licenseKey": "RIKUGAN-2024-TEAM-A",
    "isActive": true,
    "expirationDate": "2025-12-31",
    "maxUsers": 50,
    "teamName": "My Team"
  }
}
```

## Error Responses

### No Team Assigned
```json
{
  "success": false,
  "message": "No team assigned. Please complete team creation to access this resource."
}
```

### License Not Found
```json
{
  "success": false,
  "message": "No valid license found for your team."
}
```

### License Revoked
```json
{
  "success": false,
  "message": "Team license has been revoked. Please contact administrator."
}
```

### License Expired
```json
{
  "success": false,
  "message": "Team license has expired. Please renew your license."
}
```

### Invalid License Key
```json
{
  "success": false,
  "valid": false,
  "message": "Invalid or expired license key"
}
```

### License Already Assigned
```json
{
  "success": false,
  "valid": false,
  "message": "License key is already assigned to another team"
}
```

## Team Isolation

All database queries automatically filter by `team_id` to ensure data isolation:

```javascript
// Example: Get tasks
const tasks = await Task.findAll({
  where: { 
    team_id: req.user.teamId,  // From JWT token
    status: 'available'
  }
});
```

**Key Points**:
- Users can ONLY access data from their team
- Cross-team access prevented at query level
- License validation ensures team has valid access

## Migration Notes

### Database Changes Required

1. **Add team_id column to users table**:
```sql
ALTER TABLE users ADD COLUMN team_id INT NULL;
ALTER TABLE users ADD FOREIGN KEY (team_id) REFERENCES teams(id);
```

2. **Update licenses table**:
```sql
ALTER TABLE licenses ADD COLUMN team_id INT NOT NULL UNIQUE;
ALTER TABLE licenses MODIFY COLUMN expiration_date DATE NOT NULL;
```

3. **Add team_id to other tables** (tasks, notifications, etc.):
```sql
ALTER TABLE tasks ADD COLUMN team_id INT NOT NULL;
ALTER TABLE tasks ADD FOREIGN KEY (team_id) REFERENCES teams(id);
```

### Code Changes

1. **Update all protected routes** to include `validateLicense` middleware:
```javascript
// Before
router.get('/tasks', authenticateToken, TaskController.getTasks);

// After
router.get('/tasks', authenticateToken, validateLicense, TaskController.getTasks);
```

2. **Update all queries** to filter by team_id:
```javascript
// Before
const tasks = await Task.findAll({ where: { status: 'available' } });

// After
const tasks = await Task.findAll({ 
  where: { 
    team_id: req.user.teamId,
    status: 'available' 
  } 
});
```

3. **Update JWT payload** to include team_id:
```javascript
const token = jwt.sign(
  { 
    id: user.id, 
    role: user.role,
    teamId: user.teamId  // Add this
  },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);
```

## Removed Endpoints

The following endpoints have been removed as they're no longer needed:

- `GET /api/v1/licenses` - Get all licenses (admin only)
- `GET /api/v1/licenses/:id` - Get license by ID
- `POST /api/v1/licenses` - Create license (admin only)
- `PUT /api/v1/licenses/:id` - Update license
- `PUT /api/v1/licenses/:id/revoke` - Revoke license
- `DELETE /api/v1/licenses/:id` - Delete license
- `POST /api/v1/licenses/:id/assign` - Assign license to user
- `DELETE /api/v1/licenses/:id/users` - Remove license from user
- `GET /api/v1/licenses/statistics` - License statistics
- `GET /api/v1/licenses/expiring` - Expiring licenses

**Reason**: Licenses are now managed via environment configuration, not database CRUD operations.

## Benefits of New Approach

1. **Simplicity**: No complex license management UI needed
2. **Security**: Licenses controlled by environment, not exposed in API
3. **Scalability**: Easy to add new licenses without database changes
4. **Team Isolation**: One license per team ensures clean data separation
5. **Performance**: License validation cached in memory, fast lookups
6. **Maintainability**: Less code, fewer endpoints, clearer flow
