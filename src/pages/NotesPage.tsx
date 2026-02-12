import { ChangeEvent, useState } from 'react';
import { summarizeNote } from '../services/aiService';

interface NoteSummary {
  fileName: string;
  summary: string;
}

export default function NotesPage() {
  const [results, setResults] = useState<NoteSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    setLoading(true);
    const summaries: NoteSummary[] = [];
    for (const file of Array.from(files)) {
      const summary = await summarizeNote(file);
      summaries.push({ fileName: file.name, summary });
    }
    setResults((prev) => [...summaries, ...prev]);
    setLoading(false);
    e.target.value = '';
  };

  return (
    <div className="stack-lg">
      <section className="card">
        <h2>Upload Notes (PDF)</h2>
        <p className="muted">Frontend is ready for cloud upload endpoint integration in backend phase.</p>
        <input type="file" accept="application/pdf" multiple onChange={onFileChange} />
        {loading ? <p>Generating AI summaries...</p> : null}
      </section>

      <section className="card">
        <h2>Generated Summaries</h2>
        <div className="stack">
          {results.length === 0 ? <p className="muted">No summaries yet.</p> : null}
          {results.map((item) => (
            <article className="list-item block" key={`${item.fileName}-${item.summary.slice(0, 8)}`}>
              <strong>{item.fileName}</strong>
              <p>{item.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

