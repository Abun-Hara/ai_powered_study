import { Course } from '../../../types';

export interface CourseItem extends Course {
  color: string;
  deadline: string;
}