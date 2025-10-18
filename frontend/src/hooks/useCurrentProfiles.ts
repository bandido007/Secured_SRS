import { useQuery } from '@tanstack/react-query';
import { domainService } from '../services/api/domainService';
import { useAuthStore } from '../stores/authStore';
import type { ApiResponse, Lecturer, Student } from '../types';

export function useCurrentLecturer(enabled = true) {
  const { user } = useAuthStore();

  const query = useQuery<ApiResponse<Lecturer>>({
    queryKey: ['current-lecturer-profile', user?.id],
    enabled: Boolean(user?.id) && enabled,
    queryFn: async () => {
      const { data } = await domainService.lecturers.getMe();
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const lecturer = query.data?.data ?? null;

  return { lecturer, query };
}

export function useCurrentStudent(enabled = true) {
  const { user } = useAuthStore();

  const query = useQuery<ApiResponse<Student>>({
    queryKey: ['current-student-profile', user?.id],
    enabled: Boolean(user?.id) && enabled,
    queryFn: async () => {
      const { data } = await domainService.students.getMe();
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const student = query.data?.data ?? null;

  return { student, query };
}
