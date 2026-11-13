import React, { useMemo } from 'react';
import katex from 'katex';

interface MathSegment {
  type: 'text' | 'inline' | 'block';
  content: string;
}

/**
 * Splits a string containing $...$ and $$...$$ into structured segments
 * while preserving escaped \$ characters.
 */
function parseMathSegments(input: string): MathSegment[] {
  if (!input) return [];

  const segments: MathSegment[] = [];
  let i = 0;
  let textBuffer = '';

  const flushText = () => {
    if (textBuffer) {
      segments.push({ type: 'text', content: textBuffer });
      textBuffer = '';
    }
  };

  while (i < input.length) {
    // Handle escaped \$
    if (input[i] === '\\' && input[i + 1] === '$') {
      textBuffer += '$';
      i += 2;
      continue;
    }

    // Check for block math $$...$$
    if (input[i] === '$' && input[i + 1] === '$') {
      const closeIdx = findClosingDelimiter(input, i + 2, '$$');
      if (closeIdx !== -1) {
        flushText();
        segments.push({
          type: 'block',
          content: input.slice(i + 2, closeIdx).trim(),
        });
        i = closeIdx + 2;
        continue;
      }
    }

    // Check for inline math $...$
    if (input[i] === '$') {
      const closeIdx = findClosingDelimiter(input, i + 1, '$');
      if (closeIdx !== -1) {
        flushText();
        segments.push({
          type: 'inline',
          content: input.slice(i + 1, closeIdx).trim(),
        });
        i = closeIdx + 1;
        continue;
      }
    }

    textBuffer += input[i];
    i += 1;
  }

  flushText();
  return segments;
}

function findClosingDelimiter(
  str: string,
  startIdx: number,
  delimiter: '$' | '$$'
): number {
  let idx = startIdx;
  while (idx < str.length) {
    if (str[idx] === '\\') {
      idx += 2;
      continue;
    }
    if (delimiter === '$$') {
      if (str[idx] === '$' && str[idx + 1] === '$') {
        return idx;
      }
    } else {
      if (str[idx] === '$' && str[idx - 1] !== '\\') {
        // Avoid matching empty $$ as inline
        if (idx === startIdx) {
          return -1;
        }
        return idx;
      }
    }
    idx += 1;
  }
  return -1;
}

interface MathTextProps {
  text: string;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = React.memo(({ text, className = '' }) => {
  const segments = useMemo(() => parseMathSegments(text), [text]);

  return (
    <span className={`leading-relaxed break-words ${className}`}>
      {segments.map((seg, idx) => {
        if (seg.type === 'text') {
          // Preserve line breaks cleanly
          const lines = seg.content.split('\n');
          return (
            <React.Fragment key={idx}>
              {lines.map((line, lineIdx) => (
                <React.Fragment key={lineIdx}>
                  {lineIdx > 0 && <br />}
                  {line}
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        }

        const isBlock = seg.type === 'block';
        let html = '';
        try {
          html = katex.renderToString(seg.content, {
            displayMode: isBlock,
            throwOnError: false,
            strict: false,
            trust: false,
          });
        } catch {
          html = seg.content;
        }

        if (isBlock) {
          return (
            <span
              key={idx}
              className="block my-2 overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        return (
          <span
            key={idx}
            className="inline-block align-baseline mx-0.5"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </span>
  );
});

MathText.displayName = 'MathText';
