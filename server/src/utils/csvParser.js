/**
 * Minimal RFC4180-ish CSV parser (handles quoted fields with embedded
 * commas/newlines/escaped quotes). Good enough for admin-authored
 * question import sheets without pulling in a dependency.
 */
export const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char === '\r') {
      // skip, \n handles the line break
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
};

/**
 * Converts parsed CSV rows into the question import shape expected by
 * questionService.bulkImportQuestions. Expected header (case-insensitive):
 * questionText, optionA, optionB, optionC, optionD, correctOption, marks,
 * negativeMarks, difficulty, explanation
 * correctOption is one of A/B/C/D (matching whichever option columns are present).
 */
export const csvRowsToQuestions = (rows) => {
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name) => header.indexOf(name.toLowerCase());

  const questionTextIdx = idx('questiontext');
  const correctIdx = idx('correctoption');
  const marksIdx = idx('marks');
  const negMarksIdx = idx('negativemarks');
  const difficultyIdx = idx('difficulty');
  const explanationIdx = idx('explanation');

  const optionCols = header
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => /^option[a-z]$/.test(h));

  return rows.slice(1).map((r) => {
    const options = optionCols.map(({ h, i }) => ({
      label: h.replace('option', '').toUpperCase(),
      optionText: (r[i] || '').trim()
    }));
    const correctLabel = (r[correctIdx] || '').trim().toUpperCase();

    return {
      questionText: (r[questionTextIdx] || '').trim(),
      marks: marksIdx >= 0 && r[marksIdx] ? parseFloat(r[marksIdx]) : 1,
      negativeMarks: negMarksIdx >= 0 && r[negMarksIdx] ? parseFloat(r[negMarksIdx]) : 0,
      difficulty: difficultyIdx >= 0 && r[difficultyIdx] ? r[difficultyIdx].trim().toLowerCase() : 'medium',
      explanation: explanationIdx >= 0 ? (r[explanationIdx] || '').trim() : '',
      options: options
        .filter((o) => o.optionText !== '')
        .map((o) => ({ optionText: o.optionText, isCorrect: o.label === correctLabel }))
    };
  });
};

export default { parseCsv, csvRowsToQuestions };
