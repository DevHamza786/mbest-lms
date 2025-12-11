# MBEST - Learning Management System

A comprehensive, frontend-only LMS application built with React, TypeScript, and modern web technologies. Features role-based authentication and personalized portals for different user types.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔐 Demo Credentials

Use these credentials to explore different user roles:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@demo.app | Admin@123 |
| **Tutor** | tutor@demo.app | Tutor@123 |
| **Student** | student@demo.app | Student@123 |
| **Parent** | parent@demo.app | Parent@123 |

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Data**: Mock JSON files + localStorage

### Key Features
- ✅ **Role-Based Access Control (RBAC)** - Dynamic interfaces based on user role
- ✅ **Authentication System** - Mock auth with localStorage persistence
- ✅ **Responsive Design** - Mobile-first approach with collapsible sidebar
- ✅ **Dark/Light Theme** - System preference detection
- ✅ **Modern UI Components** - shadcn/ui with custom design system
- ✅ **Type Safety** - Strict TypeScript configuration

### Folder Structure
```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication forms & guards
│   ├── common/         # Layout components (Header, Sidebar)
│   └── ui/             # shadcn/ui components
├── data/               # Mock JSON data files
├── features/           # Feature-specific code
│   ├── auth/           # Auth schemas & validation
│   └── navigation/     # Role-based navigation config
├── lib/                # Core utilities
│   ├── mocks/          # Mock API services
│   ├── store/          # Zustand stores
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Helper functions
└── pages/              # Route components
    ├── admin/          # Admin portal pages
    ├── auth/           # Authentication pages
    └── student/        # Student portal pages
```

## 🎨 Design System

The application features a comprehensive design system with:
- **Brand Colors**: Professional blue primary, warm orange secondary
- **Semantic Tokens**: All colors defined as HSL values in CSS variables
- **Gradients**: Custom gradient patterns for hero sections
- **Typography**: Consistent font hierarchy
- **Components**: Fully themed shadcn/ui components

## 👥 User Roles & Features

### Admin Portal
- System overview dashboard with KPI metrics
- User management (students, tutors, parents)
- Class scheduling and enrollment
- Financial reporting and billing
- System notifications and alerts

### Student Portal
- Personal learning dashboard
- Class schedule and upcoming sessions
- Assignment submissions and grades
- Progress tracking and analytics
- Resource library access

### Tutor Portal *(Coming Soon)*
- Teaching dashboard
- Class management
- Assignment creation and grading
- Student progress monitoring

### Parent Portal *(Coming Soon)*
- Child's academic progress
- Class schedules and assignments
- Billing and payment management
- Communication with tutors

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Constraints
- **Frontend Only**: No backend APIs, all data mocked
- **localStorage**: Session persistence and data storage
- **Mock Services**: Simulated network delays and responses
- **Type Safety**: Strict TypeScript with proper type definitions

## 📱 Responsive Design

The application is fully responsive with:
- Mobile-first approach
- Collapsible sidebar navigation
- Adaptive grid layouts
- Touch-friendly interactions

## 🎯 Next Steps

To extend this application:
1. **Add Backend**: Replace mock services with real API calls
2. **Database Integration**: Connect to actual database
3. **Real Authentication**: Implement JWT or OAuth
4. **File Uploads**: Add real file handling capabilities
5. **Real-time Features**: WebSocket integration for live updates
6. **Testing**: Add comprehensive test coverage
7. **Performance**: Implement code splitting and lazy loading

## 📄 License

This project is for demonstration purposes. Built with ❤️ using modern web technologies.

---

**Note**: This is a frontend-only demo application. All data is mocked and stored in localStorage for demonstration purposes.