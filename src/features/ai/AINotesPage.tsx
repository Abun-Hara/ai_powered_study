import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { summarizeNote } from '../../services/aiService';

const MAX_BYTES = 10 * 1024 * 1024;
const BUCKET_ID = 'study-pdfs';

const ALLOWED_EXTENSIONS = ['pdf', 'ppt', 'pptx', 'png', 'jpg', 'jpeg'];
const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
];

type SummaryStatus = 'uploading' | 'processing' | 'done' | 'error';

interface SummaryItem {
  id: string;
  fileName: string;
  summary: string;
  status: SummaryStatus;
  storagePath?: string;
  error?: string;
}

function getExtension(fileName: string) {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function isAllowedFile(file: File) {
  const ext = getExtension(file.name);
  return ALLOWED_EXTENSIONS.includes(ext) || ACCEPTED_MIME_TYPES.includes(file.type);
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export default function AINotesPage() {
  const { user, token } = useAuth();
  const [items, setItems] = useState<SummaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const hasData = useMemo(() => items.length > 0, [items]);

  const updateItem = (id: string, patch: Partial<SummaryItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleDelete = async (item: SummaryItem) => {
    if (!user) return;
    if (!item.storagePath) {
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      return;
    }

    try {
      const { error: storageError } = await supabase.storage.from(BUCKET_ID).remove([item.storagePath]);
      if (storageError) {
        throw new Error(storageError.message);
      }

      const { error: metaError } = await supabase
        .from('uploaded_files')
        .delete()
        .eq('user_id', user.id)
        .eq('storage_path', item.storagePath);

      if (metaError) {
        throw new Error(metaError.message);
      }

      const { error: summaryError } = await supabase
        .from('ai_summaries')
        .delete()
        .eq('user_id', user.id)
        .eq('file_name', item.fileName);

      if (summaryError) {
        throw new Error(summaryError.message);
      }

      setItems((prev) => prev.filter((x) => x.id !== item.id));
      toast.success('File deleted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Delete failed';
      toast.error(message);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!user) {
      toast.error('Please sign in to upload files');
      return;
    }

    if (!files || files.length === 0) return;

    setLoading(true);
    for (const file of Array.from(files)) {
      if (!isAllowedFile(file)) {
        toast.error(`${file.name}: Allowed formats are PDF, PPT, PPTX, PNG, JPG`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}: File must be 10MB or less`);
        continue;
      }

      const id = crypto.randomUUID();
      const safeName = sanitizeFileName(file.name);
      const storagePath = `${user.id}/${Date.now()}_${safeName}`;

      setItems((prev) => [
        { id, fileName: file.name, summary: '', status: 'uploading', storagePath },
        ...prev,
      ]);

      try {
        const contentType = ACCEPTED_MIME_TYPES.includes(file.type) ? file.type : 'application/octet-stream';
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_ID)
          .upload(storagePath, file, {
            contentType,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { error: metaError } = await supabase.from('uploaded_files').insert({
          user_id: user.id,
          bucket_id: BUCKET_ID,
          storage_path: storagePath,
          file_name: file.name,
          mime_type: contentType,
          size_bytes: file.size,
        });

        if (metaError) {
          throw new Error(metaError.message);
        }

        updateItem(id, { status: 'processing' });

        const summary = await summarizeNote(file, token ?? undefined);

        updateItem(id, { summary, status: 'done' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        updateItem(id, { status: 'error', error: message });
        toast.error(`${file.name}: ${message}`);
      }
    }

    setLoading(false);
    toast.success('Upload flow complete');
  };

  return (
    <div className="stack-lg">
      <Card className="stack">
        <h2 className="icon-heading"><i className="fa-solid fa-robot" aria-hidden="true" /> AI Summary Workspace</h2>
        <p className="muted">Drop PDFs, PPTs, or images to extract concise, exam-focused summaries.</p>
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
            Drop files or click to upload
          </p>
          <input
            ref={inputRef}
            hidden
            type="file"
            accept=".pdf,.ppt,.pptx,.png,.jpg,.jpeg,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/png,image/jpeg"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
        <p className="muted">Max size 10MB. Stored privately per user.</p>
      </Card>

      {loading ? (
        <Card className="stack">
          <p className="icon-label">
            <i className="fa-solid fa-file" aria-hidden="true" />
            AI is analyzing your files...
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
                <i className="fa-solid fa-file" aria-hidden="true" />
                {item.fileName}
              </strong>
              <span className={`pill ${item.status === 'error' ? 'high' : item.status === 'done' ? 'medium' : ''}`}>
                {item.status}
              </span>
            </div>

            {item.status === 'error' ? <p className="text-error">{item.error}</p> : null}

            {item.summary ? <p>{item.summary}</p> : <p className="muted">Processing summary...</p>}

            <div className="row gap-sm">
              {item.summary ? (
                <>
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
                </>
              ) : null}
              <Button variant="danger" onClick={() => handleDelete(item)}>
                <span className="icon-label">
                  <i className="fa-solid fa-trash" aria-hidden="true" />
                  Delete
                </span>
              </Button>
            </div>
          </motion.article>
        ))}
      </section>
    </div>
  );
}
