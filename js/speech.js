/**
 * WordCounter Pro - Web Speech Integration (TTS & STT)
 */
const SpeechService = (function() {
  let isListening = false;
  let recognition = null;

  function speak(text, lang = 'vi-VN') {
    if (!('speechSynthesis' in window)) return false;
    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = lang;
      utt.rate = 1.0;
      window.speechSynthesis.speak(utt);
      return true;
    } catch(e) {
      console.warn('Speech synthesis error:', e);
      return false;
    }
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  function createRecognition(options = {}) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return null;

    const rec = new SpeechRec();
    rec.lang = options.lang || 'vi-VN';
    rec.continuous = options.continuous !== false;
    rec.interimResults = options.interimResults !== false;

    if (options.onStart) rec.onstart = options.onStart;
    if (options.onResult) rec.onresult = options.onResult;
    if (options.onError) rec.onerror = options.onError;
    if (options.onEnd) rec.onend = options.onEnd;

    return rec;
  }

  return {
    speak,
    stopSpeaking,
    createRecognition
  };
})();

if (typeof window !== 'undefined') window.SpeechService = SpeechService;
