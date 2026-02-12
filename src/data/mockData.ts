import { Course, Deadline, ScheduleColumns } from '../types';

export const mockCourses: Course[] = [
  { id: 'c1', title: 'Data Structures', code: 'CS201', instructor: 'Dr. Kim' },
  { id: 'c2', title: 'Database Systems', code: 'CS305', instructor: 'Prof. Lewis' },
  { id: 'c3', title: 'Linear Algebra', code: 'MTH210', instructor: 'Dr. Flores' },
];

export const mockDeadlines: Deadline[] = [
  { id: 'd1', courseId: 'c1', title: 'Assignment 4', dueDate: '2026-02-14', priority: 'high' },
  { id: 'd2', courseId: 'c2', title: 'Mini Project', dueDate: '2026-02-18', priority: 'medium' },
  { id: 'd3', courseId: 'c3', title: 'Quiz 2 Prep', dueDate: '2026-02-20', priority: 'low' },
];

export const initialSchedule: ScheduleColumns = {
  monday: [
    { id: 't1', title: 'Review Trees', course: 'CS201', durationMin: 90 },
    { id: 't2', title: 'SQL Join Practice', course: 'CS305', durationMin: 60 },
  ],
  tuesday: [{ id: 't3', title: 'Matrix Exercises', course: 'MTH210', durationMin: 75 }],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

export const analyticsData = [
  { name: 'Mon', hours: 2.5, tasks: 3 },
  { name: 'Tue', hours: 1.5, tasks: 2 },
  { name: 'Wed', hours: 2.0, tasks: 2 },
  { name: 'Thu', hours: 3.0, tasks: 4 },
  { name: 'Fri', hours: 1.0, tasks: 1 },
  { name: 'Sat', hours: 2.2, tasks: 3 },
  { name: 'Sun', hours: 0.8, tasks: 1 },
];

