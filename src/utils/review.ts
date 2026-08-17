export function buildReviewPrompt(opts: {
  code: string;
  language?: string;
  instructions?: string;
}): string {
  const parts: string[] = [];
  parts.push('Please review the following code.');

  if (opts.language) {
    parts.push(`**Language**: ${opts.language}`);
  }
  if (opts.instructions) {
    parts.push(`**Review Instructions**: ${opts.instructions}`);
  }

  const langTag = opts.language || '';
  parts.push(`**Code to review**:\n\`\`\`${langTag}\n${opts.code}\n\`\`\``);

  parts.push(`
Please format your response clearly with the following sections:
1. **Summary & Score (1-10)**
2. **Critical Issues / Bugs (if any)**
3. **Suggested Improvements & Best Practices**
4. **Positive Highlights**
`);

  return parts.join('\n\n');
}

export function parseReviewFeedback(markdown: string) {
  const criticalIssues: string[] = [];
  const improvements: string[] = [];
  const positiveNotes: string[] = [];

  const lines = markdown.split('\n');
  let currentSection = 'summary';
  const summaryLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (/critical|bugs|security/i.test(trimmed) && trimmed.startsWith('#')) {
      currentSection = 'critical';
      continue;
    } else if (/improvement|suggestions|refactor/i.test(trimmed) && trimmed.startsWith('#')) {
      currentSection = 'improvements';
      continue;
    } else if (/positive|strengths|highlights/i.test(trimmed) && trimmed.startsWith('#')) {
      currentSection = 'positive';
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\./.test(trimmed)) {
      const item = trimmed.replace(/^[-*]|\d+\./, '').trim();
      if (currentSection === 'critical') criticalIssues.push(item);
      else if (currentSection === 'improvements') improvements.push(item);
      else if (currentSection === 'positive') positiveNotes.push(item);
    } else if (currentSection === 'summary' && trimmed.length > 0) {
      summaryLines.push(trimmed);
    }
  }

  let score: number | undefined;
  const scoreMatch = markdown.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  if (scoreMatch) {
    score = parseFloat(scoreMatch[1]);
  }

  return {
    summary: summaryLines.slice(0, 3).join(' ') || 'Review completed.',
    score,
    criticalIssues,
    improvements,
    positiveNotes,
  };
}
