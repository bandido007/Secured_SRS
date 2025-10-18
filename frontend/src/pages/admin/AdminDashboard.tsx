import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Users, BookOpen, FileText, GraduationCap } from 'lucide-react';

interface Stats {
  totalStudents: number;
  totalLecturers: number;
  totalCourses: number;
  totalGrades: number;
  pendingGrades: number;
  officialGrades: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalLecturers: 0,
    totalCourses: 0,
    totalGrades: 0,
    pendingGrades: 0,
    officialGrades: 0,
  });

  useEffect(() => {
    // TODO: Fetch stats from API
    // For now, using mock data
    setStats({
      totalStudents: 3,
      totalLecturers: 5,
      totalCourses: 5,
      totalGrades: 3,
      pendingGrades: 2,
      officialGrades: 1,
    });
  }, []);

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      description: 'Active students in the system',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Lecturers',
      value: stats.totalLecturers,
      description: 'Active lecturers',
      icon: GraduationCap,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      description: 'Available courses',
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Total Grades',
      value: stats.totalGrades,
      description: `${stats.pendingGrades} pending, ${stats.officialGrades} official`,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-2">
          Manage students, lecturers, courses, and monitor system activity
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system activities and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Grade verified</p>
                  <p className="text-xs text-muted-foreground">
                    STU-mabache-001 in CS101 - Oct 7, 2025
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Grade submitted</p>
                  <p className="text-xs text-muted-foreground">
                    STU-majuba-002 in IS404 - Oct 7, 2025
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Grade submitted</p>
                  <p className="text-xs text-muted-foreground">
                    STU2024001 in CS101 - Oct 6, 2025
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Blockchain and system health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Blockchain Status</span>
                <span className="text-sm text-green-600 font-semibold flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">IPFS Storage</span>
                <span className="text-sm text-green-600 font-semibold flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Grade Integrity</span>
                <span className="text-sm text-green-600 font-semibold">100%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Transactions</span>
                <span className="text-sm font-semibold">{stats.totalGrades}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
