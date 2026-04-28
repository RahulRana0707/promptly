export function extractMarkdownFromExpandRaw(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ""

  try {
    const parsed = JSON.parse(trimmed) as { markdown?: unknown }
    if (typeof parsed.markdown === "string") {
      return parsed.markdown.trim()
    }
  } catch {
    // fall through to fence/raw extraction
  }

  const fenced = trimmed.match(/```(?:markdown|md)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) {
    return fenced[1].trim()
  }

  return trimmed
}
