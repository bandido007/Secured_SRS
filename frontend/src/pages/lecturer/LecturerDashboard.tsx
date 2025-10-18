import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BookOpen, FileText, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LecturerStats {
  totalCourses: number;
  totalStudents: number;
  pendingGrades: number;
  verifiedGrades: number;
}

export function LecturerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<LecturerStats>({
    totalCourses: 0,
    totalStudents: 0,
    pendingGrades: 0,
    verifiedGrades: 0,
  });

  useEffect(() => {
    // TODO: Fetch lecturer stats from API
    // For now, using mock data
    setStats({
      totalCourses: 3,
      totalStudents: 7,
      pendingGrades: 2,
      verifiedGrades: 1,
    });
  }, []);

  const statCards = [
    {
      title: 'My Courses',
      value: stats.totalCourses,
      description: 'Active courses teaching',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      description: 'Enrolled across all courses',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending Grades',
      value: stats.pendingGrades,
      description: 'Awaiting verification',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Verified Grades',
      value: stats.verifiedGrades,
      description: 'Official on blockchain',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lecturer Dashboard</h1>
          <p className="text-gray-500 mt-2">
            Manage your courses, submit and verify grades
          </p>
        </div>
        <Button onClick={() => navigate('/lecturer/grades')}>
          Submit Grades
        </Button>
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
            <CardTitle>My Courses</CardTitle>
            <CardDescription>Currently teaching</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">CS101 - Programming</p>
                  <p className="text-sm text-muted-foreground">Fall 2022-2023 • 3 students</p>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">IS404 - Systems</p>
                  <p className="text-sm text-muted-foreground">Fall 2022-2023 • 1 student</p>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">CS131 - Data Structures</p>
                  <p className="text-sm text-muted-foreground">Fall 2022-2023 • 2 students</p>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Grade Submissions</CardTitle>
            <CardDescription>Latest grading activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-orange-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">STU-majuba-002 - IS404</p>
                  <p className="text-xs text-muted-foreground">39.0 / 100 • Pending</p>
                  <p className="text-xs text-muted-foreground">Oct 7, 2025</p>
                </div>
                <Button variant="outline" size="sm">Verify</Button>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">STU-mabache-001 - CS101</p>
                  <p className="text-xs text-muted-foreground">55.5 / 100 • Official</p>
                  <p className="text-xs text-muted-foreground">Oct 7, 2025</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-orange-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">STU2024001 - CS101</p>
                  <p className="text-xs text-muted-foreground">85.5 / 100 • Pending</p>
                  <p className="text-xs text-muted-foreground">Oct 6, 2025</p>
                </div>
                <Button variant="outline" size="sm">Verify</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="justify-start" onClick={() => navigate('/lecturer/grades')}>
              <FileText className="w-4 h-4 mr-2" />
              Submit New Grade
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => navigate('/lecturer/verify')}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Verify Pending Grades
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => navigate('/lecturer/courses')}>
              <BookOpen className="w-4 h-4 mr-2" />
              View All Courses
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
