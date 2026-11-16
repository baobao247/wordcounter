/**
 * WordCounter Pro - Text Analysis & Metrics Engine
 */
const StatsEngine = (function() {
  function computeStats(text) {
    const trimmed = text ? text.trim() : '';
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
    const wordCount = words.length;
    const charCount = text ? text.length : 0;
    const charNoSpace = text ? text.replace(/\s/g, '').length : 0;

    // Sentence detection protecting Vietnamese abbreviations, titles, and decimals
    const cleanForSentences = text ? text.replace(/(?:TP\.HCM|Th\.S|TS\.|GS\.|v\.v\.|Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.|etc\.|i\.e\.|e\.g\.|\d+\.\d+)/gi, m => m.replace(/\./g, '@@')) : '';
    const sentences = trimmed ? (cleanForSentences.match(/[^.!?…]+[.!?…]*(?:\s+|$)/g) || []).filter(s => s.trim().length).length : 0;
    const paragraphs = trimmed ? text.split(/\n\s*\n/).filter(p => p.trim().length).length : 0;

    // Word frequency & unique words
    const lowerWords = words.map(w => w.toLowerCase().replace(/[.,!?;:…"“”‘’()\[\]{}]/g, '')).filter(Boolean);
    const freqMap = {};
    lowerWords.forEach(w => {
      freqMap[w] = (freqMap[w] || 0) + 1;
    });

    const uniqueSet = new Set(lowerWords);
    const avgLen = wordCount ? (words.reduce((a, w) => a + w.length, 0) / wordCount) : 0;
    const readMin = wordCount / 200;
    const speakMin = wordCount / 130;

    // Byte size in UTF-8
    let byteSize = 0;
    try {
      byteSize = new Blob([text || '']).size;
    } catch(e) {
      byteSize = encodeURI(text || '').split(/%(?:u[0-9A-F]{4}|[0-9A-F]{2})/i).length - 1;
    }

    return {
      wordCount,
      charCount,
      charNoSpace,
      sentences,
      paragraphs,
      unique: uniqueSet.size,
      avgLen,
      readMin,
      speakMin,
      byteSize,
      words: lowerWords,
      freqMap
    };
  }

  function getTopKeywords(freqMap, limit = 5) {
    return Object.entries(freqMap)
      .filter(([w]) => w.length > 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }

  return {
    computeStats,
    getTopKeywords
  };
})();

if (typeof window !== 'undefined') window.StatsEngine = StatsEngine;
