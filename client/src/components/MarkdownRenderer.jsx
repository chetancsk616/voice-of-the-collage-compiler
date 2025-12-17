import React from 'react';

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  const md = String(content).replace(/\r\n/g, '\n');
  const lines = md.split('\n');
  const out = [];
  let i = 0;
  let listBuf = null;

  const flushList = () => {
    if (!listBuf) return;
    const items = listBuf.items.map((it, idx) => (
      <li key={`li-${idx}`} className="mb-1 text-pink-100">
        {it}
      </li>
    ));
    out.push(
      <ul
        key={`ul-${out.length}`}
        className="pl-5 list-disc text-sm mb-3 text-pink-100"
      >
        {items}
      </ul>
    );
    listBuf = null;
  };

  while (i < lines.length) {
    const line = lines[i];

    // Handle code blocks with triple backticks
    if (line.trim().startsWith('```')) {
      flushList();
      const codeLang = line.trim().slice(3).trim();
      const codeBuf = [];
      i++;

      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeBuf.push(lines[i]);
        i++;
      }

      out.push(
        <pre
          key={`code-${out.length}`}
          className="bg-slate-950 border border-pink-500/30 text-pink-100 p-3 rounded overflow-auto text-xs font-mono mb-3 whitespace-pre-wrap break-words"
        >
          <code>{codeBuf.join('\n')}</code>
        </pre>
      );

      if (i < lines.length && lines[i].trim().startsWith('```')) {
        i++;
      }
      continue;
    }

    // Headers
    const h = line.match(/^(#{1,6})\s+(.*)/);
    if (h) {
      flushList();
      const level = Math.min(6, h[1].length);
      const Tag = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'][level - 1];
      const sizes = [
        'text-lg',
        'text-base',
        'text-sm',
        'text-sm',
        'text-xs',
        'text-xs',
      ];
      out.push(
        React.createElement(
          Tag,
          {
            key: `h-${out.length}`,
            className: `font-bold mb-3 text-pink-200 ${sizes[level - 1]}`,
          },
          inlineMd(h[2])
        )
      );
      i++;
      continue;
    }

    // Unordered lists
    const ul = line.match(/^\s*[-*]\s+(.*)/);
    if (ul) {
      if (!listBuf) listBuf = { type: 'ul', items: [] };
      listBuf.items.push(inlineMd(ul[1]));
      i++;
      while (i < lines.length) {
        const next = lines[i].match(/^\s*[-*]\s+(.*)/);
        if (next) {
          listBuf.items.push(inlineMd(next[1]));
          i++;
        } else break;
      }
      flushList();
      continue;
    }

    // Ordered lists
    const ol = line.match(/^\s*\d+\.\s+(.*)/);
    if (ol) {
      if (!listBuf) listBuf = { type: 'ol', items: [] };
      listBuf.items.push(inlineMd(ol[1]));
      i++;
      while (i < lines.length) {
        const next = lines[i].match(/^\s*\d+\.\s+(.*)/);
        if (next) {
          listBuf.items.push(inlineMd(next[1]));
          i++;
        } else break;
      }
      flushList();
      continue;
    }

    // Empty lines
    if (line.trim() === '') {
      flushList();
      out.push(<div key={`br-${out.length}`} className="my-1" />);
      i++;
      continue;
    }

    // Paragraphs
    flushList();
    out.push(
      <p
        key={`p-${out.length}`}
        className="text-sm mb-2 text-pink-100 leading-relaxed"
      >
        {inlineMd(line)}
      </p>
    );
    i++;
  }

  flushList();
  return out;

  function inlineMd(str) {
    if (!str) return null;
    const parts = [];
    let idx = 0;
    const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
    let m;
    let lastIndex = 0;
    while ((m = linkRe.exec(str)) !== null) {
      if (m.index > lastIndex)
        parts.push(escapeAndInline(str.slice(lastIndex, m.index)));
      const text = m[1];
      const url = m[2];
      parts.push(
        <a
          key={`a-${idx++}`}
          href={url}
          className="text-blue-400 underline hover:text-blue-300"
          target="_blank"
          rel="noreferrer"
        >
          {text}
        </a>
      );
      lastIndex = m.index + m[0].length;
    }
    if (lastIndex < str.length)
      parts.push(escapeAndInline(str.slice(lastIndex)));
    return parts.length === 1 ? parts[0] : parts;
  }

  function escapeAndInline(s) {
    if (!s) return null;
    const segs = [];
    let i = 0;
    const backtickRe = /`([^`]+)`/g;
    let mm;
    let last = 0;
    let k = 0;
    while ((mm = backtickRe.exec(s)) !== null) {
      if (mm.index > last)
        segs.push(processEmphasis(s.slice(last, mm.index), `txt-${k++}`));
      segs.push(
        <code
          key={`c-${k}`}
          className="bg-slate-800/80 px-1.5 py-0.5 rounded text-xs font-mono text-pink-200 border border-pink-500/30"
        >
          {mm[1]}
        </code>
      );
      last = mm.index + mm[0].length;
    }
    if (last < s.length)
      segs.push(processEmphasis(s.slice(last), `txt-${k++}`));
    return segs.length === 1 ? segs[0] : segs;
  }

  function processEmphasis(s, key) {
    if (!s) return null;
    const boldRe = /\*\*([^*]+)\*\*/g;
    const parts = [];
    let last = 0;
    let m2;
    let kk = 0;
    while ((m2 = boldRe.exec(s)) !== null) {
      if (m2.index > last) parts.push(s.slice(last, m2.index));
      parts.push(
        <strong key={`${key}-${kk++}`} className="font-bold text-pink-200">
          {m2[1]}
        </strong>
      );
      last = m2.index + m2[0].length;
    }
    if (last < s.length) parts.push(s.slice(last));
    return parts.map((p, idx) => {
      if (typeof p !== 'string') return p;
      const itRe = /\*([^*]+)\*/g;
      const out2 = [];
      let last2 = 0;
      let m3;
      let kk2 = 0;
      while ((m3 = itRe.exec(p)) !== null) {
        if (m3.index > last2) out2.push(p.slice(last2, m3.index));
        out2.push(
          <em key={`${key}-e-${kk2++}`} className="italic text-pink-200">
            {m3[1]}
          </em>
        );
        last2 = m3.index + m3[0].length;
      }
      if (last2 < p.length) out2.push(p.slice(last2));
      return out2.length === 1 ? out2[0] : out2;
    });
  }
}
