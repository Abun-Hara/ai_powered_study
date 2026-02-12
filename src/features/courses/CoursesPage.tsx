import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { fetchCourses, removeCourse, upsertCourse } from './api';
import { CourseItem } from './types/course';

const PAGE_SIZE = 4;
const COURSES_KEY = ['courses'];

const EMPTY_COURSE: CourseItem = {
  id: '',
  title: '',
  code: '',
  instructor: '',
  color: '#2e87f2',
  deadline: '',
};

export default function CoursesPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [selectedColor, setSelectedColor] = useState('all');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<CourseItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const coursesQuery = useQuery({
    queryKey: COURSES_KEY,
    queryFn: fetchCourses,
  });

  const upsertMutation = useMutation({
    mutationFn: upsertCourse,
    onMutate: async (incoming) => {
      await queryClient.cancelQueries({ queryKey: COURSES_KEY });
      const previous = queryClient.getQueryData<CourseItem[]>(COURSES_KEY) ?? [];

      const optimistic = incoming.id
        ? previous.map((item) => (item.id === incoming.id ? incoming : item))
        : [{ ...incoming, id: `temp-${crypto.randomUUID()}` }, ...previous];

      queryClient.setQueryData(COURSES_KEY, optimistic);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(COURSES_KEY, context?.previous ?? []);
      toast.error('Course update failed');
    },
    onSuccess: (next) => {
      queryClient.setQueryData(COURSES_KEY, next);
      toast.success('Course saved');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: removeCourse,
    onMutate: async (courseId) => {
      await queryClient.cancelQueries({ queryKey: COURSES_KEY });
      const previous = queryClient.getQueryData<CourseItem[]>(COURSES_KEY) ?? [];
      queryClient.setQueryData(
        COURSES_KEY,
        previous.filter((item) => item.id !== courseId)
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(COURSES_KEY, context?.previous ?? []);
      toast.error('Delete failed');
    },
    onSuccess: (next) => {
      queryClient.setQueryData(COURSES_KEY, next);
      toast.success('Course removed');
    },
  });

  const courses = coursesQuery.data ?? [];

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const search = `${c.title} ${c.code} ${c.instructor}`.toLowerCase();
      const colorMatch = selectedColor === 'all' || c.color === selectedColor;
      return search.includes(debouncedQuery.toLowerCase()) && colorMatch;
    });
  }, [courses, debouncedQuery, selectedColor]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, selectedColor]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const onSave = (course: CourseItem) => {
    if (!course.title.trim() || !course.code.trim()) {
      toast.error('Title and code are required');
      return;
    }

    upsertMutation.mutate(course);
    setEditing(null);
  };

  const onDelete = (id: string) => {
    deleteMutation.mutate(id);
    setConfirmDelete(null);
  };

  return (
    <div className="stack-lg">
      <Card className="row wrap gap-sm">
        <Input placeholder="Search by title, code, instructor" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="input" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)}>
          <option value="all">All colors</option>
          {[...new Set(courses.map((c) => c.color))].map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
        <Button onClick={() => setEditing(EMPTY_COURSE)}><span className="icon-label"><i className="fa-solid fa-plus" aria-hidden="true" /> Add Course</span></Button>
      </Card>

      {coursesQuery.isLoading ? (
        <Card className="stack">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </Card>
      ) : null}

      {coursesQuery.isError ? <ErrorState message="Could not load courses." onRetry={() => coursesQuery.refetch()} /> : null}

      {!coursesQuery.isLoading && !coursesQuery.isError && paged.length === 0 ? (
        <EmptyState title="No courses found" message="Try changing your filters or add a new course." />
      ) : null}

      <section className="course-grid">
        {paged.map((course) => (
          <motion.article key={course.id} className="card stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="row-between">
              <strong>{course.title}</strong>
              <span className="dot" style={{ background: course.color }} />
            </div>
            <p className="muted">
              {course.code} - {course.instructor}
            </p>
            <p className="muted">Deadline: {course.deadline || 'Not set'}</p>
            <div className="row gap-sm">
              <Button variant="secondary" onClick={() => setEditing(course)}>
                <span className="icon-label"><i className="fa-solid fa-pen" aria-hidden="true" /> Edit</span>
              </Button>
              <Button variant="danger" onClick={() => setConfirmDelete(course.id)}>
                <span className="icon-label"><i className="fa-solid fa-trash" aria-hidden="true" /> Delete</span>
              </Button>
            </div>
          </motion.article>
        ))}
      </section>

      {!coursesQuery.isLoading && !coursesQuery.isError ? (
        <Card className="row-between">
          <Button variant="secondary" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <span className="icon-label"><i className="fa-solid fa-chevron-left" aria-hidden="true" /> Prev</span>
          </Button>
          <p className="muted">
            Page {page} / {totalPages}
          </p>
          <Button variant="secondary" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            <span className="icon-label">Next <i className="fa-solid fa-chevron-right" aria-hidden="true" /></span>
          </Button>
        </Card>
      ) : null}

      <CourseModal course={editing} onClose={() => setEditing(null)} onSave={onSave} />
      <ConfirmModal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && onDelete(confirmDelete)}
      />
    </div>
  );
}

function CourseModal({
  course,
  onClose,
  onSave,
}: {
  course: CourseItem | null;
  onClose: () => void;
  onSave: (course: CourseItem) => void;
}) {
  const [draft, setDraft] = useState(course);

  useEffect(() => {
    setDraft(course);
  }, [course]);

  if (!course || !draft) return null;

  return (
    <Modal isOpen={Boolean(course)} onClose={onClose} title={course.id ? 'Edit Course' : 'Add Course'}>
      <div className="stack">
        <label>
          Course Title
          <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </label>
        <label>
          Course Code
          <Input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
        </label>
        <label>
          Instructor
          <Input value={draft.instructor} onChange={(e) => setDraft({ ...draft, instructor: e.target.value })} />
        </label>
        <label>
          Deadline
          <Input type="date" value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} />
        </label>
        <label>
          Color
          <Input type="color" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} />
        </label>
        <div className="row gap-sm">
          <Button onClick={() => onSave(draft)}><span className="icon-label"><i className="fa-solid fa-floppy-disk" aria-hidden="true" /> Save</span></Button>
          <Button variant="secondary" onClick={onClose}><span className="icon-label"><i className="fa-solid fa-xmark" aria-hidden="true" /> Cancel</span></Button>
        </div>
      </div>
    </Modal>
  );
}

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm delete">
      <div className="stack">
        <p className="muted">This action cannot be undone.</p>
        <div className="row gap-sm">
          <Button variant="danger" onClick={onConfirm}><span className="icon-label"><i className="fa-solid fa-trash" aria-hidden="true" /> Delete</span></Button>
          <Button variant="secondary" onClick={onClose}><span className="icon-label"><i className="fa-solid fa-xmark" aria-hidden="true" /> Cancel</span></Button>
        </div>
      </div>
    </Modal>
  );
}
