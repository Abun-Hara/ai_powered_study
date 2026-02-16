import { CourseItem } from './types/course';
import { supabase } from '../../lib/supabase';

interface CourseRow {
  id: string;
  title: string;
  code: string;
  instructor: string;
  color: string;
  deadline: string | null;
}

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw error ?? new Error('Not authenticated');
  }
  return data.user.id;
}

function toCourseItem(row: CourseRow): CourseItem {
  return {
    id: row.id,
    title: row.title,
    code: row.code,
    instructor: row.instructor,
    color: row.color,
    deadline: row.deadline ?? '',
  };
}

export async function fetchCourses(): Promise<CourseItem[]> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('courses')
    .select('id, title, code, instructor, color, deadline')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as CourseRow[]).map((row: CourseRow) => toCourseItem(row));
}

export async function upsertCourse(course: CourseItem): Promise<CourseItem[]> {
  const userId = await requireUserId();

  if (course.id) {
    const { error } = await supabase
      .from('courses')
      .update({
        title: course.title,
        code: course.code,
        instructor: course.instructor,
        color: course.color,
        deadline: course.deadline || null,
      })
      .eq('id', course.id)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  } else {
    const { error } = await supabase.from('courses').insert({
      user_id: userId,
      title: course.title,
      code: course.code,
      instructor: course.instructor,
      color: course.color,
      deadline: course.deadline || null,
    });

    if (error) {
      throw error;
    }
  }

  return fetchCourses();
}

export async function removeCourse(courseId: string): Promise<CourseItem[]> {
  const userId = await requireUserId();
  const { error } = await supabase.from('courses').delete().eq('id', courseId).eq('user_id', userId);
  if (error) {
    throw error;
  }
  return fetchCourses();
}
