import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { accountsService } from '../../services/api/accountsService';
import type {
  ProvisionRole,
  ProvisionUserPayload,
  ProvisionedUserData,
  ProvisionStudentProfileInput,
  ProvisionLecturerProfileInput,
} from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { getErrorMessage } from '../../utils/error';

const roleOptions: { label: string; value: ProvisionRole; description: string }[] = [
  { label: 'Administrator', value: 'ADMIN', description: 'Full platform access and management permissions.' },
  { label: 'Student', value: 'STUDENT', description: 'Academic record access limited to personal data.' },
  { label: 'Lecturer', value: 'LECTURER', description: 'Teaching staff with grading privileges.' },
];

const enrollmentStatuses = ['ACTIVE', 'WITHDRAWN', 'GRADUATED', 'DEFERRED'];

export function AdminUserProvision() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [role, setRole] = useState<ProvisionRole>('STUDENT');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [provisionedUser, setProvisionedUser] = useState<ProvisionedUserData | null>(null);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timeout = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const provisionUser = useMutation({
    mutationFn: async (payload: ProvisionUserPayload) => {
      const { data } = await accountsService.provisionUser(payload);
      return data;
    },
    onSuccess: (response) => {
      const message = response?.response?.message ?? 'User provisioned successfully';
      setFeedback({ type: 'success', message });
      setProvisionedUser(response?.data ?? null);
      formRef.current?.reset();
    },
    onError: (error) => {
      setProvisionedUser(null);
      setFeedback({ type: 'error', message: getErrorMessage(error, 'Failed to provision user') });
    },
  });

  const isStudent = role === 'STUDENT';
  const isLecturer = role === 'LECTURER';

  const studentStatusOptions = useMemo(() => enrollmentStatuses.map((status) => ({ value: status, label: status })), []);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (provisionUser.isPending) {
      return;
    }

    setFeedback(null);
    setProvisionedUser(null);

    const form = new FormData(event.currentTarget);
    const username = (form.get('username') as string | null)?.trim();
    const email = (form.get('email') as string | null)?.trim().toLowerCase();
    const password = (form.get('password') as string | null)?.trim();
    const firstName = (form.get('first_name') as string | null)?.trim();
    const lastName = (form.get('last_name') as string | null)?.trim();

    if (!username) {
      setFeedback({ type: 'error', message: 'Username is required' });
      return;
    }
    if (!email) {
      setFeedback({ type: 'error', message: 'Email address is required' });
      return;
    }
    if (!password) {
      setFeedback({ type: 'error', message: 'Temporary password is required' });
      return;
    }

    const payload: ProvisionUserPayload = {
      username,
      email,
      password,
      role,
      first_name: firstName || null,
      last_name: lastName || null,
    };

    if (role === 'STUDENT') {
      const studentId = (form.get('student_id') as string | null)?.trim();
      const program = (form.get('program') as string | null)?.trim();
      const enrollmentDate = form.get('enrollment_date') as string | null;
      const yearOfStudyRaw = form.get('year_of_study') as string | null;
      const enrollmentStatus = (form.get('enrollment_status') as string | null)?.trim() || 'ACTIVE';
      const phoneNumber = (form.get('phone_number') as string | null)?.trim();
      const dateOfBirth = (form.get('date_of_birth') as string | null)?.trim();

      if (!studentId || !program || !enrollmentDate || !yearOfStudyRaw) {
        setFeedback({ type: 'error', message: 'All student profile fields are required' });
        return;
      }

      const yearOfStudy = Number(yearOfStudyRaw);
      if (Number.isNaN(yearOfStudy) || yearOfStudy <= 0) {
        setFeedback({ type: 'error', message: 'Year of study must be a positive number' });
        return;
      }

      const studentProfile: ProvisionStudentProfileInput = {
        student_id: studentId,
        program,
        year_of_study: yearOfStudy,
        enrollment_date: enrollmentDate,
        enrollment_status: enrollmentStatus,
        phone_number: phoneNumber || null,
        date_of_birth: dateOfBirth || null,
      };

      payload.student_profile = studentProfile;
      payload.lecturer_profile = null;
    }

    if (role === 'LECTURER') {
      const lecturerId = (form.get('lecturer_id') as string | null)?.trim();
      const department = (form.get('department') as string | null)?.trim();
      const specialization = (form.get('specialization') as string | null)?.trim();

      if (!lecturerId || !department) {
        setFeedback({ type: 'error', message: 'Lecturer ID and department are required' });
        return;
      }

      const lecturerProfile: ProvisionLecturerProfileInput = {
        lecturer_id: lecturerId,
        department,
        specialization: specialization || null,
      };

      payload.lecturer_profile = lecturerProfile;
      payload.student_profile = null;
    }

    if (role === 'ADMIN') {
      payload.student_profile = null;
      payload.lecturer_profile = null;
    }

    provisionUser.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Provision User Accounts</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create platform users securely without giving direct access to the Django admin. Choose a role and
          complete the relevant profile details.
        </p>
      </header>

      {feedback ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      {provisionedUser ? (
        <Card className="border-green-200 bg-green-50/40">
          <CardHeader>
            <CardTitle className="text-lg">Newest Provisioned Account</CardTitle>
            <CardDescription>
              {provisionedUser.username} ({provisionedUser.email}) was created with the {provisionedUser.role} role.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p>User ID: {provisionedUser.userId}</p>
            {provisionedUser.studentProfileId ? (
              <p>Student Profile ID: {provisionedUser.studentProfileId}</p>
            ) : null}
            {provisionedUser.lecturerProfileId ? (
              <p>Lecturer Profile ID: {provisionedUser.lecturerProfileId}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>These fields are required for every account regardless of role.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-8" onSubmit={handleSubmit} ref={formRef}>
            <section className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input id="username" name="username" placeholder="e.g. jdoe" autoComplete="off" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email address *</Label>
                <Input id="email" name="email" type="email" placeholder="user@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Temporary password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Set an initial password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={(event) => setRole(event.target.value as ProvisionRole)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  {roleOptions.find((option) => option.value === role)?.description}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="first_name">First name</Label>
                <Input id="first_name" name="first_name" placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last name</Label>
                <Input id="last_name" name="last_name" placeholder="Optional" />
              </div>
            </section>

            {isStudent ? (
              <section className="space-y-4 rounded-lg border border-blue-100 bg-blue-50/40 p-4">
                <h2 className="text-sm font-semibold text-blue-900">Student Profile</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="student_id">Student ID *</Label>
                    <Input id="student_id" name="student_id" placeholder="e.g. STU-2025-001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program">Program *</Label>
                    <Input id="program" name="program" placeholder="e.g. Computer Science" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year_of_study">Year of study *</Label>
                    <Input id="year_of_study" name="year_of_study" type="number" min={1} max={8} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="enrollment_date">Enrollment date *</Label>
                    <Input id="enrollment_date" name="enrollment_date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="enrollment_status">Enrollment status</Label>
                    <select
                      id="enrollment_status"
                      name="enrollment_status"
                      defaultValue="ACTIVE"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      {studentStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone number</Label>
                    <Input id="phone_number" name="phone_number" placeholder="Optional" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of birth</Label>
                    <Input id="date_of_birth" name="date_of_birth" type="date" />
                  </div>
                </div>
              </section>
            ) : null}

            {isLecturer ? (
              <section className="space-y-4 rounded-lg border border-amber-100 bg-amber-50/40 p-4">
                <h2 className="text-sm font-semibold text-amber-900">Lecturer Profile</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lecturer_id">Lecturer ID *</Label>
                    <Input id="lecturer_id" name="lecturer_id" placeholder="e.g. LECT-042" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Input id="department" name="department" placeholder="e.g. Faculty of Science" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input id="specialization" name="specialization" placeholder="Optional" />
                  </div>
                </div>
              </section>
            ) : null}

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  formRef.current?.reset();
                  provisionUser.reset();
                  setFeedback(null);
                  setProvisionedUser(null);
                }}
              >
                Reset
              </Button>
              <Button type="submit" disabled={provisionUser.isPending}>
                {provisionUser.isPending ? 'Provisioning...' : 'Provision user'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
