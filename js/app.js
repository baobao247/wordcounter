/**
 * WordCounter Pro - Main Application Controller
 */
(function() {
  'use strict';

  // State keys
  const LS_DRAFT = 'wc_draft_text';
  const LS_HISTORY = 'wc_history_v1';
  const LS_THEME = 'wc_theme';
  const LS_LIMIT = 'wc_char_limit';

  // DOM Elements
  const $ = id => document.getElementById(id);
  const textarea = $('textInput');
  const saveIndicator = $('saveIndicator');
  const themeToggle = $('themeToggle');
  const themeIcon = $('themeIcon');
  const toastContainer = $('toastContainer');

  // Stats Elements
  const elWordCount = $('wordCount');
  const elCharCount = $('charCount');
  const elCharNoSpace = $('charNoSpace');
  const elSentenceCount = $('sentenceCount');
  const elParagraphCount = $('paragraphCount');
  const elUniqueWords = $('uniqueWords');
  const elAvgWordLen = $('avgWordLen');
  const elReadingTime = $('readingTime');
  const elSpeakingTime = $('speakingTime');
  const elByteSize = $('byteSize');
  const elLimitFill = $('limitFill');
  const elLimitValue = $('limitValue');

  // History state
  let historyList = [];
  try {
    historyList = JSON.parse(localStorage.getItem(LS_HISTORY) || '[]');
  } catch(e) {
    historyList = [];
  }

  // Undo / Redo stacks
  const undoStack = [];
  const redoStack = [];
  const MAX_STACK = 50;

  function pushUndo(val) {
    if (undoStack.length === 0 || undoStack[undoStack.length - 1] !== val) {
      undoStack.push(val);
      if (undoStack.length > MAX_STACK) undoStack.shift();
      redoStack.length = 0; // Clear redo
    }
  }

  function undo() {
    if (undoStack.length === 0) return;
    const current = textarea.value;
    const prev = undoStack.pop();
    redoStack.push(current);
    textarea.value = prev;
    updateAll();
    showToast('Hoàn tác (Undo)', 'info');
  }

  function redo() {
    if (redoStack.length === 0) return;
    const current = textarea.value;
    const next = redoStack.pop();
    undoStack.push(current);
    textarea.value = next;
    updateAll();
    showToast('Làm lại (Redo)', 'info');
  }

  // Toast notification
  function showToast(msg, type = 'info') {
    if (!toastContainer) return;
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'circle-exclamation' : 'circle-info');
    t.innerHTML = '<i class="fas fa-' + icon + '"></i> <span>' + msg + '</span>';
    toastContainer.appendChild(t);
    setTimeout(() => {
      t.classList.add('hide');
      setTimeout(() => t.remove(), 250);
    }, 2800);
  }

  // Theme Management
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(LS_THEME, theme);
    if (themeIcon) {
      themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
      themeToggle.title = theme === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối';
    }
  }

  // Stats Calculation & DOM Rendering
  function updateAll() {
    const text = textarea.value;
    const s = StatsEngine.computeStats(text);

    if (elWordCount) elWordCount.textContent = s.wordCount.toLocaleString('vi-VN');
    if (elCharCount) elCharCount.textContent = s.charCount.toLocaleString('vi-VN');
    if (elCharNoSpace) elCharNoSpace.textContent = s.charNoSpace.toLocaleString('vi-VN');
    if (elSentenceCount) elSentenceCount.textContent = s.sentences.toLocaleString('vi-VN');
    if (elParagraphCount) elParagraphCount.textContent = s.paragraphs.toLocaleString('vi-VN');
    if (elUniqueWords) elUniqueWords.textContent = s.unique.toLocaleString('vi-VN');
    if (elAvgWordLen) elAvgWordLen.textContent = s.avgLen.toFixed(1);
    if (elReadingTime) elReadingTime.textContent = s.readMin < 1 && s.readMin > 0 ? '<1' : Math.round(s.readMin);
    if (elSpeakingTime) elSpeakingTime.textContent = s.speakMin < 1 && s.speakMin > 0 ? '<1' : Math.round(s.speakMin);

    if (elByteSize) {
      elByteSize.textContent = s.byteSize >= 1024 ? (s.byteSize / 1024).toFixed(1) + ' KB' : s.byteSize + ' B';
    }

    // Char limit progress bar
    const charLimit = parseInt(localStorage.getItem(LS_LIMIT) || '0', 10);
    if (charLimit > 0 && elLimitFill && elLimitValue) {
      const pct = Math.min(100, (s.charCount / charLimit) * 100);
      elLimitFill.style.width = pct + '%';
      elLimitValue.textContent = s.charCount + ' / ' + charLimit;
      if (s.charCount > charLimit) {
        elLimitFill.style.background = 'var(--danger)';
      } else {
        elLimitFill.style.background = 'var(--primary)';
      }
    }

    // Auto-save draft debounce indicator
    persistDraft(text);
  }

  let saveTimeout = null;
  function persistDraft(text) {
    if (saveIndicator) saveIndicator.textContent = 'Đang lưu...';
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem(LS_DRAFT, text);
        if (saveIndicator) saveIndicator.textContent = 'Đã lưu tự động';
      } catch(e) {
        if (saveIndicator) saveIndicator.textContent = 'Không thể lưu';
      }
    }, 400);
  }

  // Text Transform Handler
  function handleTransform(action) {
    const current = textarea.value;
    if (!current) {
      showToast('Văn bản đang trống', 'info');
      return;
    }
    pushUndo(current);
    const next = TextTransforms.apply(action, current);
    if (next === current) {
      showToast('Không có gì thay đổi', 'info');
      return;
    }
    textarea.value = next;
    updateAll();
    showToast('Đã chuyển đổi thành công', 'success');
  }

  // History Management
  function renderHistory() {
    const listEl = $('historyList');
    const badgeEl = $('historyBadge');
    if (badgeEl) badgeEl.textContent = historyList.length;
    if (!listEl) return;

    if (historyList.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:.85rem;">Chưa có bản lưu nào trong lịch sử</div>';
      return;
    }

    const q = ($('searchHistory') ? $('searchHistory').value : '').toLowerCase().trim();
    const filtered = q ? historyList.filter(h => (h.title + ' ' + h.text).toLowerCase().includes(q)) : historyList;

    listEl.innerHTML = filtered.map(item => `
      <div class="history-item" data-id="${item.id}">
        <div class="history-head">
          <div class="history-title">${escapeHtml(item.title || 'Bản ghi không tên')}</div>
          <span style="font-size:0.75rem; color:var(--text-muted);">${item.date}</span>
        </div>
        <div class="history-preview">${escapeHtml(item.text.slice(0, 110))}${item.text.length > 110 ? '...' : ''}</div>
        <div class="history-footer">
          <span style="font-size:0.75rem; color:var(--primary); font-weight:700;">${item.wordCount} từ · ${item.charCount} ký tự</span>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-load-hist" title="Nạp vào trình soạn thảo"><i class="fas fa-arrow-up-right-from-square"></i> Mở</button>
            <button class="btn btn-sm btn-danger btn-del-hist" title="Xóa bản ghi này"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function saveHistoryItem(title) {
    const text = textarea.value;
    if (!text.trim()) {
      showToast('Văn bản trống, không thể lưu!', 'error');
      return;
    }
    const s = StatsEngine.computeStats(text);
    const item = {
      id: 'h_' + Date.now(),
      title: title || 'Bản ghi ngày ' + new Date().toLocaleDateString('vi-VN'),
      text,
      wordCount: s.wordCount,
      charCount: s.charCount,
      date: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    historyList.unshift(item);
    if (historyList.length > 60) historyList.pop();
    try {
      localStorage.setItem(LS_HISTORY, JSON.stringify(historyList));
      renderHistory();
      showToast('Đã lưu vào lịch sử!', 'success');
    } catch(e) {
      showToast('Bộ nhớ trình duyệt đã đầy!', 'error');
    }
  }

  // Export handlers
  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Đã xuất file: ' + fileName, 'success');
  }

  // STT Microphone Setup
  let recognition = null;
  let isListening = false;
  const micBtn = $('micBtn');

  if (micBtn) {
    recognition = SpeechService.createRecognition({
      lang: 'vi-VN',
      onStart: () => {
        isListening = true;
        micBtn.classList.add('btn-primary');
        micBtn.style.boxShadow = '0 0 14px rgba(99,102,241,0.6)';
        showToast('Đang lắng nghe giọng nói tiếng Việt...', 'info');
      },
      onResult: (e) => {
        let finalTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript + ' ';
        }
        if (finalTranscript) {
          pushUndo(textarea.value);
          textarea.value = (textarea.value ? textarea.value.trim() + ' ' : '') + finalTranscript.trim();
          updateAll();
        }
      },
      onError: (e) => {
        isListening = false;
        micBtn.classList.remove('btn-primary');
        micBtn.style.boxShadow = '';
        showToast('Lỗi micro: ' + (e.error || 'Kiểm tra quyền truy cập'), 'error');
      },
      onEnd: () => {
        isListening = false;
        micBtn.classList.remove('btn-primary');
        micBtn.style.boxShadow = '';
      }
    });

    micBtn.addEventListener('click', () => {
      if (!recognition) {
        showToast('Trình duyệt chưa hỗ trợ Web Speech API', 'info');
        return;
      }
      if (!isListening) {
        try { recognition.start(); } catch(e){}
      } else {
        try { recognition.stop(); } catch(e){}
      }
    });
  }

  // Event Listeners Wiring
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial theme & draft restoration
    const savedTheme = localStorage.getItem(LS_THEME) || 'dark';
    applyTheme(savedTheme);

    const savedDraft = localStorage.getItem(LS_DRAFT);
    if (savedDraft) {
      textarea.value = savedDraft;
    }
    updateAll();
    renderHistory();

    // 2. Textarea input handling
    textarea.addEventListener('input', () => {
      updateAll();
    });

    // Capture state before major typing for undo
    let typingTimer = null;
    textarea.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        pushUndo(textarea.value);
      }, 1000);
    });

    // 3. Toolbar Buttons
    if ($('copyBtn')) {
      $('copyBtn').addEventListener('click', async () => {
        if (!textarea.value) return showToast('Văn bản trống', 'info');
        try {
          await navigator.clipboard.writeText(textarea.value);
          showToast('Đã sao chép vào clipboard!', 'success');
        } catch(e) {
          showToast('Không thể sao chép tự động', 'error');
        }
      });
    }

    if ($('clearBtn')) {
      $('clearBtn').addEventListener('click', () => {
        if (!textarea.value) return;
        if (confirm('Xóa sạch toàn bộ văn bản trong khung soạn thảo?')) {
          pushUndo(textarea.value);
          textarea.value = '';
          updateAll();
          showToast('Đã xóa sạch nội dung', 'info');
        }
      });
    }

    if ($('undoBtn')) $('undoBtn').addEventListener('click', undo);
    if ($('redoBtn')) $('redoBtn').addEventListener('click', redo);

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme') || 'dark';
        applyTheme(cur === 'dark' ? 'light' : 'dark');
      });
    }

    // 4. Dropdowns behavior
    document.querySelectorAll('.dropdown').forEach(dd => {
      const toggle = dd.querySelector('.dropdown-toggle');
      if (!toggle) return;
      toggle.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = dd.classList.contains('open');
        document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
        if (!isOpen) dd.classList.add('open');
      });
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
    });

    // Action clicks inside dropdowns
    document.addEventListener('click', e => {
      const btn = e.target.closest('.dropdown-menu button');
      if (!btn) return;
      const action = btn.dataset.action;
      if (!action) return;

      if (TextTransforms.transforms[action]) {
        handleTransform(action);
      } else if (action === 'tts') {
        if (!textarea.value.trim()) return showToast('Văn bản trống!', 'info');
        SpeechService.speak(textarea.value.slice(0, 1000));
        showToast('Đang đọc đoạn đầu văn bản...', 'info');
      } else if (action === 'stop-tts') {
        SpeechService.stopSpeaking();
        showToast('Đã dừng phát âm', 'info');
      } else if (action === 'find-replace') {
        $('findReplaceModal').classList.add('open');
      } else if (action === 'frequency') {
        openFreqModal();
      } else if (action === 'export-txt') {
        downloadFile(textarea.value, 'wordcounter_' + Date.now() + '.txt', 'text/plain;charset=utf-8');
      } else if (action === 'export-md') {
        const stats = StatsEngine.computeStats(textarea.value);
        const mdContent = `---\ntitle: Tài liệu WordCounter\ndate: ${new Date().toISOString()}\nwords: ${stats.wordCount}\ncharacters: ${stats.charCount}\n---\n\n${textarea.value}`;
        downloadFile(mdContent, 'document_' + Date.now() + '.md', 'text/markdown;charset=utf-8');
      } else if (action === 'export-json') {
        const stats = StatsEngine.computeStats(textarea.value);
        const data = { text: textarea.value, stats, exportedAt: new Date().toISOString() };
        downloadFile(JSON.stringify(data, null, 2), 'wordcounter_' + Date.now() + '.json', 'application/json');
      }
    });

    // 5. Find & Replace Modal
    const findReplaceModal = $('findReplaceModal');
    if (findReplaceModal) {
      $('doReplaceAllBtn').addEventListener('click', () => {
        const findVal = $('findInput').value;
        const replaceVal = $('replaceInput').value;
        const matchCase = $('matchCaseCheck').checked;
        if (!findVal) return showToast('Vui lòng nhập từ khóa cần tìm!', 'error');

        pushUndo(textarea.value);
        const res = TextTransforms.replaceAll(textarea.value, findVal, replaceVal, matchCase);
        textarea.value = res.result;
        updateAll();
        showToast('Đã thay thế ' + res.count + ' vị trí!', 'success');
        findReplaceModal.classList.remove('open');
      });
    }

    // 6. Save History Modal
    const saveModal = $('saveModal');
    if ($('saveHistoryBtn') && saveModal) {
      $('saveHistoryBtn').addEventListener('click', () => {
        if (!textarea.value.trim()) return showToast('Không có nội dung để lưu', 'info');
        $('saveTitleInput').value = '';
        saveModal.classList.add('open');
      });
      $('saveConfirmBtn').addEventListener('click', () => {
        const title = $('saveTitleInput').value.trim();
        saveHistoryItem(title);
        saveModal.classList.remove('open');
      });
    }

    // 7. Frequency Modal
    function openFreqModal() {
      const stats = StatsEngine.computeStats(textarea.value);
      const topKeywords = StatsEngine.getTopKeywords(stats.freqMap, 30);
      const listEl = $('freqList');
      if (!listEl) return;

      if (topKeywords.length === 0) {
        listEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);">Chưa đủ từ khóa để phân tích mật độ.</div>';
      } else {
        const maxCount = topKeywords[0][1];
        listEl.innerHTML = topKeywords.map(([word, count]) => {
          const pct = Math.round((count / maxCount) * 100);
          return `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;">
              <span style="font-weight:700;font-size:0.9rem;min-width:120px;">${escapeHtml(word)}</span>
              <div style="flex:1;height:8px;background:var(--border);border-radius:4px;overflow:hidden;">
                <div style="width:${pct}%;height:100%;background:var(--primary);border-radius:4px;"></div>
              </div>
              <span style="font-size:0.8rem;color:var(--text-muted);min-width:40px;text-align:right;">${count} lần</span>
            </div>
          `;
        }).join('');
      }
      $('freqModal').classList.add('open');
    }

    // Modal Close Triggers
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.modal-backdrop').classList.remove('open');
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', e => {
        if (e.target === modal) modal.classList.remove('open');
      });
    });

    // History Item Delegations
    if ($('historyList')) {
      $('historyList').addEventListener('click', e => {
        const itemEl = e.target.closest('.history-item');
        if (!itemEl) return;
        const id = itemEl.dataset.id;
        const item = historyList.find(h => h.id === id);
        if (!item) return;

        if (e.target.closest('.btn-del-hist')) {
          if (confirm('Xóa bản lưu này khỏi lịch sử?')) {
            historyList = historyList.filter(h => h.id !== id);
            localStorage.setItem(LS_HISTORY, JSON.stringify(historyList));
            renderHistory();
            showToast('Đã xóa bản ghi', 'info');
          }
        } else if (e.target.closest('.btn-load-hist') || e.target.closest('.history-title')) {
          pushUndo(textarea.value);
          textarea.value = item.text;
          updateAll();
          showToast('Đã nạp bản lưu vào trình soạn thảo!', 'success');
        }
      });
    }

    if ($('clearAllBtn')) {
      $('clearAllBtn').addEventListener('click', () => {
        if (historyList.length === 0) return;
        if (confirm('Xóa toàn bộ lịch sử đã lưu?')) {
          historyList = [];
          localStorage.removeItem(LS_HISTORY);
          renderHistory();
          showToast('Đã dọn sạch lịch sử!', 'info');
        }
      });
    }

    if ($('searchHistory')) {
      $('searchHistory').addEventListener('input', renderHistory);
    }
  });

})();
