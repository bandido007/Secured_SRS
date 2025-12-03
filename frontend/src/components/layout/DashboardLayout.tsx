import type { ReactNode } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  UserCheck,
  LogOut,
  Shield,
  UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface DashboardLayoutProps {
  children?: ReactNode;
}

type NavLink = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin, isLecturer, isStudent } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminLinks: NavLink[] = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/provision', label: 'Provision users', icon: UserPlus },
    { to: '/admin/students', label: 'Students', icon: Users },
    { to: '/admin/lecturers', label: 'Lecturers', icon: UserCheck },
    { to: '/admin/courses', label: 'Courses', icon: BookOpen },
    { to: '/admin/enrollments', label: 'Enrollments', icon: Shield },
    { to: '/admin/grades', label: 'Grades', icon: FileText },
    { to: '/admin/transcripts', label: 'Transcripts', icon: GraduationCap },
  ];

  const lecturerLinks: NavLink[] = [
    { to: '/lecturer', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/lecturer/courses', label: 'My Courses', icon: BookOpen },
    { to: '/lecturer/grades', label: 'Grade Submission', icon: FileText },
    { to: '/lecturer/verify', label: 'Verify Grades', icon: Shield },
  ];

  const studentLinks: NavLink[] = [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/courses', label: 'My Courses', icon: BookOpen },
    { to: '/student/grades', label: 'My Grades', icon: FileText },
    { to: '/student/transcripts', label: 'Transcripts', icon: GraduationCap },
  ];

  let navLinks: NavLink[] = [];
  if (isAdmin()) navLinks = adminLinks;
  else if (isLecturer()) navLinks = lecturerLinks;
  else if (isStudent()) navLinks = studentLinks;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
      </div>
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/40 bg-white/80 shadow-sm backdrop-blur">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 2xl:px-16 3xl:px-24">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900 tracking-tight">SRS</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user?.username}</p>
                <p className="text-gray-500 text-xs">
                  {isAdmin() && 'Administrator'}
                  {isLecturer() && 'Lecturer'}
                  {isStudent() && 'Student'}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-white shadow-md shadow-blue-500/25 hover:bg-transparent hover:from-blue-600 hover:text-white hover:to-blue-700 focus-visible:ring-blue-500"
              >
                Log out
                <LogOut className="ml-2 h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative mx-auto w-full px-4 sm:px-6 lg:px-10 2xl:px-16 3xl:px-24 py-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start 2xl:gap-12">
          {/* Sidebar Navigation */}
          <aside className="w-full flex-shrink-0 lg:w-72 2xl:w-80">
            <nav className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-lg shadow-primary/5 backdrop-blur">
              <div className="mb-4">
                <p className="text-xs uppercase tracking-widest text-gray-400">Navigation</p>
              </div>
              <div className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const segmentCount = link.to.split('/').filter(Boolean).length;
                  const matchesNested = location.pathname.startsWith(`${link.to}/`);
                  const isActive = location.pathname === link.to || (matchesNested && segmentCount > 1);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      aria-current={isActive ? 'page' : undefined}
                      className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border border-white/60 transition-all duration-200 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-white text-gray-600 group-hover:border-blue-300 group-hover:bg-blue-50 group-hover:text-blue-600'
                        }`}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="flex-1 group-hover:underline group-hover:underline-offset-4">{link.label}</span>
                      {!isActive ? (
                        <span className="ml-auto hidden text-xs font-semibold text-blue-600 transition-opacity duration-200 group-hover:inline">
                          View
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-xl shadow-primary/5 backdrop-blur">
              {children ?? <Outlet />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
