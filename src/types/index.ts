export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  username?: string;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
}

export interface Course {
  id: string;
  title: string;
  code: string;
  instructor: string;
}

export interface Deadline {
  id: string;
  courseId: string;
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}

export interface StudyTask {
  id: string;
  title: string;
  course: string;
  durationMin: number;
}

export type DayColumn =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface ScheduleColumns {
  [key: string]: StudyTask[];
}

