# DSCPMS Backend API

Backend REST API for the Demon Slayer Corps Project Management System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Create database:
```bash
mysql -u root -p
CREATE DATABASE dscpms;
```

4. Run migrations:
```bash
npm run db:migrate
```

5. Seed initial data (optional):
```bash
npm run db:seed
```

## Running the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Testing

Run all tests:
```bash
npm test
```

Watch mode:
```bash
npm test:watch
```

## API Documentation

Base URL: `http://localhost:3000/api/v1`

### Authentication Endpoints

- `POST /auth/register` - Register new user (Admin only)
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### User Endpoints

- `GET /users` - Get all users (Admin only)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user (Admin only)
- `GET /users/:id/profile` - Get user profile with stats

### Task Endpoints

- `GET /tasks` - Get all tasks
- `GET /tasks/:id` - Get task by ID
- `POST /tasks` - Create task (Hashira+)
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task (Hashira+)
- `POST /tasks/:id/assign` - Assign task to user
- `PUT /tasks/:id/status` - Update task status
- `GET /tasks/board` - Get Kanban board view

### Notification Endpoints

- `GET /notifications` - Get user notifications
- `GET /notifications/unread` - Get unread count
- `PUT /notifications/:id/read` - Mark as read
- `PUT /notifications/mark-all-read` - Mark all as read
- `DELETE /notifications/:id` - Delete notification

### License Endpoints

- `GET /licenses` - Get all licenses (Admin only)
- `POST /licenses` - Create license (Admin only)
- `PUT /licenses/:id` - Update license (Admin only)
- `DELETE /licenses/:id` - Revoke license (Admin only)

## Architecture

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── database/       # Database connection and migrations
│   ├── middleware/     # Express middleware
│   ├── models/         # Sequelize models
│   ├── services/       # Business logic
│   ├── controllers/    # Request handlers
│   ├── routes/         # API routes
│   ├── utils/          # Utility functions
│   └── server.js       # Main entry point
├── __tests__/          # Test files
└── package.json
```

## License

ISC
