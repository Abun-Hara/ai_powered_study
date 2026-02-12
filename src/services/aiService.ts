export async function summarizeNote(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/ai/summarize', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = (await response.json()) as { summary?: string };
      if (data.summary) {
        return data.summary;
      }
    }
  } catch {
    // Fall back to local mock summary while backend is not connected.
  }

  return `Mock summary for ${file.name}: focus on key definitions, formulas, and likely exam questions. Review this in 2 sessions this week.`;
}

