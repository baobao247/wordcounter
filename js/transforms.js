/**
 * WordCounter Pro - Text Transformation & Cleaning Suite
 */
const TextTransforms = (function() {
  const transforms = {
    upper: t => t.toLocaleUpperCase('vi'),
    lower: t => t.toLocaleLowerCase('vi'),
    capitalize: t => t.replace(/\b\p{L}/gu, c => c.toLocaleUpperCase('vi')),
    sentence: t => t.toLowerCase().replace(/(^\s*\p{L}|[.!?…]\s+\p{L})/gu, c => c.toLocaleUpperCase('vi')),
    trim: t => t.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim(),
    rmlines: t => t.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim(),
    rmaccents: t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D'),
    slug: t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    reverse: t => t.split('\n').map(line => [...line].reverse().join('')).join('\n'),
    dedup: t => {
      const lines = t.split('\n');
      const seen = new Set();
      const out = [];
      lines.forEach(l => {
        if (!seen.has(l)) {
          seen.add(l);
          out.push(l);
        }
      });
      return out.join('\n');
    },
    sortaz: t => t.split('\n').sort((a, b) => a.localeCompare(b, 'vi')).join('\n'),
    sortza: t => t.split('\n').sort((a, b) => b.localeCompare(a, 'vi')).join('\n')
  };

  function apply(action, text) {
    if (transforms[action]) return transforms[action](text);
    return text;
  }

  function replaceAll(text, find, replace, matchCase = false) {
    if (!find) return { result: text, count: 0 };
    const flags = matchCase ? 'g' : 'gi';
    const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, flags);
    let count = 0;
    const result = text.replace(regex, () => {
      count++;
      return replace;
    });
    return { result, count };
  }

  return {
    apply,
    replaceAll,
    transforms
  };
})();

if (typeof window !== 'undefined') window.TextTransforms = TextTransforms;
