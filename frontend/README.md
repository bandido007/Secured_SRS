# Student Record System - Frontend

A modern, clean, and minimalistic frontend for the Secured Student Record System built with React, TypeScript, and TailwindCSS.

## Features

### Authentication & Authorization
- Secure JWT-based authentication
- Role-based access control (Admin, Lecturer, Student)
- Automatic token refresh
- Protected routes

### Admin Dashboard
- System overview and statistics
- User management (Students, Lecturers, Admins)
- Course management
- Grade monitoring
- System health status
- Blockchain integrity verification

### Lecturer Dashboard
- Course management
- Grade submission with blockchain verification
- Grade verification workflow
- Student enrollment management
- Audit trail viewing

### Student Dashboard
- View enrolled courses
- Check grades (pending and official)
- Generate academic transcripts
- View GPA and credits
- Blockchain-verified grade viewing

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **Zustand** - State management
- **Axios** - HTTP client
- **Lucide React** - Icon library

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Label.tsx
│   │   │   ├── Table.tsx
│   │   │   └── Badge.tsx
│   │   └── layout/          # Layout components
│   │       ├── DashboardLayout.tsx
│   │       └── ProtectedRoute.tsx
│   ├── pages/
│   │   ├── auth/            # Authentication pages
│   │   │   └── Login.tsx
│   │   ├── admin/           # Admin pages
│   │   │   └── AdminDashboard.tsx
│   │   ├── lecturer/        # Lecturer pages
│   │   │   └── LecturerDashboard.tsx
│   │   └── student/         # Student pages
│   │       └── StudentDashboard.tsx
│   ├── services/
│   │   ├── api/             # API service layer
│   │   │   ├── client.ts    # Axios client with interceptors
│   │   │   └── domainService.ts  # Domain API endpoints
│   │   └── auth/            # Auth utilities
│   │       └── authService.ts
│   ├── stores/              # Zustand stores
│   │   └── authStore.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   └── utils/               # Utility functions
│       └── cn.ts
├── .env                     # Environment variables
├── tailwind.config.js       # Tailwind configuration
├── vite.config.ts           # Vite configuration
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm or yarn
- Backend API running on `http://localhost:8000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# .env
VITE_API_URL=http://localhost:8000/api
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## API Integration

The frontend integrates with the Django backend API:

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh

### Domain Endpoints
- Students: `/api/domain/students`
- Lecturers: `/api/domain/lecturers`
- Courses: `/api/domain/courses`
- Enrollments: `/api/domain/enrollments`
- Grades: `/api/domain/course-results`
- Transcripts: `/api/domain/transcripts`

## User Roles & Access

### Admin
- Full system access
- Manage users, courses, and enrollments
- View all grades and transcripts
- Monitor system health

### Lecturer
- View assigned courses
- Submit grades for enrolled students
- Verify grades (blockchain integrity check)
- View audit trails

### Student
- View enrolled courses
- Check grades (pending and official)
- Generate transcripts
- View GPA and academic progress

## Testing Credentials

Use these credentials from your backend:

**Admin:**
- Username: `signalmtaalam`
- Password: (your password)

**Lecturer:**
- Username: (lecturer usernames from backend)
- Password: (your password)

**Student:**
- Username: (student usernames from backend)
- Password: (your password)

## Key Features

### 1. Modern UI/UX
- Clean, minimalistic design
- Consistent color scheme and typography
- Responsive layout for all screen sizes
- Smooth transitions and animations

### 2. Role-Based Navigation
- Dynamic navigation based on user role
- Protected routes with authentication checks
- Automatic redirection to appropriate dashboard

### 3. Real-time Data
- Live updates from backend API
- Automatic token refresh
- Error handling and user feedback

### 4. Blockchain Integration
- Display blockchain hashes
- Show verification status
- IPFS storage references
- Audit trail viewing

## Development

### Adding New Pages

1. Create page component in appropriate directory
2. Add route in `App.tsx`
3. Update navigation in `DashboardLayout.tsx`

### Adding New API Endpoints

1. Add TypeScript types in `src/types/index.ts`
2. Add service methods in `src/services/api/domainService.ts`
3. Use in components with proper error handling

### Styling

This project uses TailwindCSS with a custom design system:

- Primary: Blue (#3b82f6)
- Success: Green (#10b981)
- Warning: Yellow (#f59e0b)
- Error: Red (#ef4444)

Colors are defined in `src/index.css` using CSS custom properties.

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### API Connection Issues
- Ensure backend is running on `http://localhost:8000`
- Check CORS settings in Django
- Verify `.env` file has correct API URL

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced filtering and search
- [ ] Data export (CSV, PDF)
- [ ] Dark mode toggle
- [ ] Multi-language support
- [ ] Offline support with Service Workers
- [ ] Advanced analytics and charts
- [ ] File upload for bulk operations

## License

This project is part of the Secured Student Record System.
