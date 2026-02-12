import { CourseItem } from './types/course';

const STORAGE_KEY = 'study_planner_courses_v2';

const seedCourses: CourseItem[] = [
  { id: '1', title: 'Data Structures', code: 'CS201', instructor: 'Dr. Kim', color: '#2e87f2', deadline: '2026-02-14' },
  { id: '2', title: 'Database Systems', code: 'CS305', instructor: 'Prof. Lewis', color: '#13a389', deadline: '2026-02-18' },
  { id: '3', title: 'Linear Algebra', code: 'MTH210', instructor: 'Dr. Flores', color: '#f6a12f', deadline: '2026-02-20' },
  { id: '4', title: 'Operating Systems', code: 'CS330', instructor: 'Dr. Patel', color: '#c762d9', deadline: '2026-02-26' },
  { id: '5', title: 'AI Fundamentals', code: 'CS410', instructor: 'Prof. Reed', color: '#ff6b6b', deadline: '2026-03-01' },
];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readCourses() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedCourses));
    return seedCourses;
  }

  return JSON.parse(raw) as CourseItem[];
}

function writeCourses(courses: CourseItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

export async function fetchCourses() {
  await wait(250);
  return readCourses();
}

export async function upsertCourse(course: CourseItem) {
  await wait(300);
  const current = readCourses();
  const exists = current.some((item) => item.id === course.id && item.id !== '');

  const next = exists
    ? current.map((item) => (item.id === course.id ? course : item))
    : [{ ...course, id: crypto.randomUUID() }, ...current];

  writeCourses(next);
  return next;
}

export async function removeCourse(courseId: string) {
  await wait(220);
  const current = readCourses();
  const next = current.filter((item) => item.id !== courseId);
  writeCourses(next);
  return next;
}