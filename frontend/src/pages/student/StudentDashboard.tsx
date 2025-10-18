import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { BookOpen, FileText, Award, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StudentStats {
  enrolledCourses: number;
  completedCourses: number;
  currentGPA: number;
  totalCredits: number;
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StudentStats>({
    enrolledCourses: 2,
    completedCourses: 0,
    currentGPA: 0.0,
    totalCredits: 0,
  });

  useEffect(() => {
    // TODO: Fetch student stats from API
    // For now, using mock data
    setStats({
      enrolledCourses: 2,
      completedCourses: 0,
      currentGPA: 3.45,
      totalCredits: 6,
    });
  }, []);

  const statCards = [
    {
      title: 'Enrolled Courses',
      value: stats.enrolledCourses,
      description: 'Active this semester',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Current GPA',
      value: stats.currentGPA.toFixed(2),
      description: 'Cumulative grade point',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Credits',
      value: stats.totalCredits,
      description: 'Credits earned',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Completed',
      value: stats.completedCourses,
      description: 'Courses finished',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const getGradeStatus = (status: string) => {
    if (status === 'OFFICIAL') {
      return <Badge variant="success">Official</Badge>;
    }
    return <Badge variant="warning">Pending</Badge>;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-500 mt-2">
            Track your academic progress and view your grades
          </p>
        </div>
        <Button onClick={() => navigate('/student/transcripts')}>
          Generate Transcript
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
            <CardDescription>Currently enrolled courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">CS101 - Programming</p>
                  <p className="text-sm text-muted-foreground">Fall 2022-2023 • 3 credits</p>
                  <p className="text-sm text-muted-foreground">Lecturer: lect2002</p>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">IS404 - Systems</p>
                  <p className="text-sm text-muted-foreground">Fall 2022-2023 • 3 credits</p>
                  <p className="text-sm text-muted-foreground">Lecturer: lect2002</p>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Grades</CardTitle>
            <CardDescription>Latest grade updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium">CS101 - Programming</p>
                    {getGradeStatus('OFFICIAL')}
                  </div>
                  <p className="text-2xl font-bold text-green-600">55.5 / 100</p>
                  <p className="text-sm text-muted-foreground">Grade: Pass</p>
                  <p className="text-xs text-muted-foreground mt-1">Verified: Oct 7, 2025</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium">IS404 - Systems</p>
                    {getGradeStatus('PENDING')}
                  </div>
                  <p className="text-2xl font-bold text-orange-600">39.0 / 100</p>
                  <p className="text-sm text-muted-foreground">Grade: Fail</p>
                  <p className="text-xs text-muted-foreground mt-1">Submitted: Oct 7, 2025</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Academic Progress</CardTitle>
          <CardDescription>Your performance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">2 / 5 courses</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.currentGPA}</p>
                <p className="text-xs text-muted-foreground mt-1">Current GPA</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.totalCredits}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Credits</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.enrolledCourses}</p>
                <p className="text-xs text-muted-foreground mt-1">Active Courses</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blockchain Verification</CardTitle>
          <CardDescription>Your grades are secured on blockchain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-green-900">Grades Secured</p>
                  <p className="text-sm text-green-700">All official grades are blockchain-verified</p>
                </div>
              </div>
              <Button variant="outline" size="sm">View Details</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
