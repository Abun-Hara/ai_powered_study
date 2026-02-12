import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { summarizeNote } from '../../services/aiService';

interface SummaryItem {
  id: string;
  fileName: string;
  summary: string;
}

export default function AINotesPage() {
  const [items, setItems] = useState<SummaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const hasData = useMemo(() => items.length > 0, [items]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setLoading(true);
    const next: SummaryItem[] = [];
    for (const file of Array.from(files)) {
      const summary = await summarizeNote(file);
      next.push({ id: crypto.randomUUID(), fileName: file.name, summary });
    }
    setItems((prev) => [...next, ...prev]);
    setLoading(false);
    toast.success('AI summaries generated');
  };

  return (
    <div className="stack-lg">
      <Card className="stack">
        <h2 className="icon-heading"><i className="fa-solid fa-robot" aria-hidden="true" /> AI Summary Workspace</h2>
        <p className="muted">Drop PDFs here to extract concise, exam-focused summaries.</p>
        <div
          className="drop-card"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
        >
          <p className="icon-label-center">
            <i className="fa-solid fa-upload" aria-hidden="true" />
            Drop PDF files or click to upload
          </p>
          <input
            ref={inputRef}
            hidden
            type="file"
            accept="application/pdf"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </Card>

      {loading ? (
        <Card className="stack">
          <p className="icon-label">
            <i className="fa-solid fa-file-pdf" aria-hidden="true" />
            AI is analyzing your notes...
          </p>
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </Card>
      ) : null}

      {!loading && !hasData ? (
        <EmptyState title="No summaries yet" message="Upload notes to start generating AI insights." />
      ) : null}

      <section className="stack">
        {items.map((item) => (
          <motion.article
            key={item.id}
            className="card stack"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="row-between">
              <strong className="icon-label">
                <i className="fa-solid fa-file-pdf" aria-hidden="true" />
                {item.fileName}
              </strong>
              <div className="row gap-sm">
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(item.summary);
                    toast.success('Summary copied');
                  }}
                >
                  <span className="icon-label">
                    <i className="fa-solid fa-copy" aria-hidden="true" />
                    Copy
                  </span>
                </Button>
                <Button variant="secondary" onClick={() => toast.success('Saved to your summary library')}>
                  <span className="icon-label">
                    <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
                    Save
                  </span>
                </Button>
              </div>
            </div>
            <p>{item.summary}</p>
          </motion.article>
        ))}
      </section>
    </div>
  );
}
