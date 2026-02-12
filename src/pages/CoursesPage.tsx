import { FormEvent, useState } from 'react';
import { mockCourses } from '../data/mockData';
import { Course } from '../types';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [instructor, setInstructor] = useState('');

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!title || !code) {
      return;
    }
    const next: Course = {
      id: crypto.randomUUID(),
      title,
      code,
      instructor,
    };
    setCourses((prev) => [next, ...prev]);
    setTitle('');
    setCode('');
    setInstructor('');
  };

  return (
    <div className="grid two">
      <section className="card">
        <h2>Add Course</h2>
        <form className="stack" onSubmit={onAdd}>
          <label>
            Course Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            Code
            <input value={code} onChange={(e) => setCode(e.target.value)} required />
          </label>
          <label>
            Instructor
            <input value={instructor} onChange={(e) => setInstructor(e.target.value)} />
          </label>
          <button className="btn">Add Course</button>
        </form>
      </section>

      <section className="card">
        <h2>My Courses</h2>
        <div className="stack">
          {courses.map((course) => (
            <article key={course.id} className="list-item">
              <div>
                <strong>{course.title}</strong>
                <p className="muted">{course.code}</p>
              </div>
              <span className="muted">{course.instructor || 'TBA'}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

