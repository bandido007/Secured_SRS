import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth/authService';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { GraduationCap } from 'lucide-react';
import { getErrorMessage } from '../../utils/error';

export function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.login({ username, password });

      if (response.response.status && response.data) {
        setUser(response.data.user, response.data.roles);

        // Navigate based on role
        if (authService.isAdmin()) {
          navigate('/admin');
        } else if (authService.isLecturer()) {
          navigate('/lecturer');
        } else if (authService.isStudent()) {
          navigate('/student');
        } else {
          navigate('/');
        }
      } else {
        setError(response.response.message || 'Login failed');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
      </div>
      <Card className="relative w-full max-w-md border border-blue-200/70 bg-white/90 shadow-2xl shadow-primary/10 backdrop-blur">
        <CardHeader className="flex flex-col items-center space-y-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
            <GraduationCap className="h-9 w-9 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">Welcome Back!</CardTitle>
          <CardDescription className="max-w-sm text-center text-gray-500">
            Student Record System · Secured with Blockchain
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:from-blue-600 hover:to-blue-700 focus-visible:ring-blue-500"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Protected by blockchain integrity verification
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
