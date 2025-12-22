# Rikugan

A React-based bounty management system for programming teams. This application allows teams to manage tasks as bounties with different user roles and reward systems.

## 🚀 Features

### Authentication System
- **Login Page**: Secure user authentication with email and password
- **Registration Page**: User registration with role selection (Goon, Hashira, Oyakatasama)
- **Role-based Access**: Different permissions based on user roles

### Dashboard
- **Interactive Sidebar**: Collapsible sidebar with hover effects
  - User profile display with avatar
  - Current balance
  - Navigation menu (Dashboard, Profile, Wallet, My Tasks)
  - Logout functionality
- **Bounty Management**: 
  - View available bounties/tasks
  - Take tasks and track progress
  - Filter by status and priority
  - Search functionality
- **Statistics Cards**: 
  - Available tasks count
  - Active tasks count
  - Total earnings
  - Completion rate

### User Roles
- **Goon (Junior Programmer)**: Can take and complete tasks
- **Hashira (Senior Programmer)**: Can create and manage tasks + all Goon permissions
- **Oyakatasama (Administrator)**: Full system access + user management

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: HeroUI (Hero UI Components)
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **State Management**: React Context API
- **Icons**: Custom SVG icons

## 📦 Installation & Setup

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd 3100
   ```

2. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to:
   ```
   http://localhost:5173
   ```

### Alternative Launch Methods

#### Windows Batch File
Double-click `start-frontend.bat` in the root directory

#### PowerShell Script
Right-click `start-frontend.ps1` and select "Run with PowerShell"

## 🔐 Default Login Credentials

The application uses mock authentication. You can login with any email/password combination for testing:

**Example Credentials**:
- Email: `admin@rikugan.com`
- Password: `password123`
- Email: `goon@rikugan.com`
- Password: `demo123`

## 🎮 How to Use

### 1. Authentication
- Visit the homepage and click "Login" or "Join the Corps"
- For new users: Register with your preferred role
- For existing users: Login with your credentials

### 2. Dashboard Navigation
- **Sidebar**: Hover over menu items to see interactive effects
- **Search**: Use the search bar to find specific bounties
- **Filters**: Filter bounties by status (Available, In Progress, etc.) or priority (High, Medium, Low)

### 3. Task Management
- **View Bounties**: Browse available tasks in the main dashboard area
- **Take Tasks**: Click "Take Task" on available bounties to assign them to yourself
- **Track Progress**: View your active tasks in the "My Active Tasks" section
- **Task Details**: Click on any bounty card to view detailed information

### 4. Sidebar Features
- **Profile Section**: View your username, email, and role badge
- **Balance Display**: See your current earnings in the gradient card
- **Navigation Menu**: Access different sections (currently displays as demo)
- **Hover Effects**: Interactive menu items with color changes and scaling
- **Logout**: Sign out of your account

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── BountyCard.tsx       # Individual bounty display component
│   │   ├── ProtectedRoute.tsx   # Route protection wrapper
│   │   ├── Sidebar.tsx          # Main navigation sidebar
│   │   ├── icons.tsx            # Custom SVG icons
│   │   └── ...
│   ├── contexts/
│   │   └── AuthContext.tsx      # Authentication state management
│   ├── pages/
│   │   ├── dashboard.tsx        # Main dashboard page
│   │   ├── login.tsx           # Login page
│   │   ├── register.tsx        # Registration page
│   │   └── ...
│   ├── App.tsx                  # Main app component with routing
│   ├── main.tsx                # Application entry point
│   └── provider.tsx            # Context providers wrapper
├── package.json
└── ...
```

## 🎨 UI Components & Features

### Bounty Cards
- **Priority Badges**: Color-coded priority indicators (High=Red, Medium=Yellow, Low=Green)
- **Status Chips**: Current task status display
- **Interactive Elements**: Hover effects and click animations
- **Detailed Information**: Description, tags, deadline, estimated hours

### Sidebar
- **Responsive Design**: Collapsible on mobile, fixed on desktop
- **User Avatar**: Dynamic avatar generation based on username
- **Role Badges**: Color-coded role indicators
- **Balance Display**: Gradient card showing current earnings
- **Smooth Animations**: Hover effects and transitions

### Dashboard Stats
- **Statistics Cards**: Visual representation of key metrics
- **Grid Layout**: Responsive grid adapting to screen size
- **Icon Integration**: Custom icons for each stat category

## 🔧 Customization

### Adding New Bounty Types
Edit `src/pages/dashboard.tsx` and modify the `mockBounties` array to add new task types.

### Modifying User Roles
Update the role enum in `src/contexts/AuthContext.tsx` and adjust the UI accordingly.

### Styling Changes
Modify Tailwind CSS classes throughout the components or update the theme in `tailwind.config.js`.

### Adding New Icons
Add new SVG components to `src/components/icons.tsx`.

## 🐛 Troubleshooting

### Common Issues

1. **Server won't start**: 
   - Ensure Node.js is installed (check with `node --version`)
   - Delete `node_modules` and run `npm install` again

2. **Components not loading**:
   - Check that all HeroUI packages are installed
   - Verify import paths are correct

3. **TypeScript errors**:
   - Run `npm run build` to check for type errors
   - Ensure all required props are passed to components

### Development Tools
- **Hot Reload**: Automatic page refresh on file changes
- **TypeScript Checking**: Real-time type checking in development
- **ESLint**: Code quality checking (run with `npm run lint`)

## 📱 Responsive Design

The application is fully responsive and works on:
- **Desktop**: Full sidebar and grid layouts
- **Tablet**: Collapsible sidebar, responsive grids
- **Mobile**: Mobile-first design with touch interactions

## 🔮 Future Enhancements

- Backend API integration
- Real-time notifications
- Task assignment system
- Payment processing
- File upload for task attachments
- Advanced filtering and sorting
- User profile management
- Admin panel for user management

## 📄 License

This project is part of an academic demonstration and follows the project's existing license terms.

## 🤝 Contributing

This is an educational project. For contributions or questions, please refer to the project documentation or contact the development team.

---

**Note**: This application currently uses mock data for demonstration purposes. In a production environment, you would need to integrate with a backend API for authentication, task management, and data persistence.