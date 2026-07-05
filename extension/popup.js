// popup.js

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const highlightsList = document.getElementById('highlights-list');
  const emptyState = document.getElementById('empty-state');
  const countSpan = document.getElementById('highlights-count');
  
  // Custom Alert Dialog Elements
  const clearAllBtn = document.getElementById('clear-all-btn');
  const alertDialog = document.getElementById('alert-dialog');
  const cancelClearBtn = document.getElementById('cancel-clear-btn');
  const confirmAlertBtn = document.getElementById('confirm-alert-btn');

  let allHighlights = [];
  const API_BASE = 'http://localhost:3000/api';
  let activeAlertAction = null; // Stores function callback for alert confirmations

  // Custom Toast Manager
  function showToast(title, description, variant = 'default') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${variant}`;
    toast.innerHTML = `
      <div style="flex-grow: 1;">
        <div class="toast-title">${escapeHtml(title)}</div>
        <div class="toast-desc">${escapeHtml(description)}</div>
      </div>
      <button class="toast-close">✕</button>
    `;
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });
    
    container.appendChild(toast);
    
    // Automatically fade out after 3.5 seconds
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.25s forwards';
      setTimeout(() => {
        toast.remove();
      }, 250);
    }, 3500);
  }

  // Open Custom Alert Dialog Helper
  function openAlertDialog(title, description, onConfirm) {
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-desc').innerText = description;
    activeAlertAction = onConfirm;
    alertDialog.classList.remove('hidden');
  }

  // Bind dialog cancel button click
  cancelClearBtn.addEventListener('click', () => {
    alertDialog.classList.add('hidden');
    activeAlertAction = null;
  });

  // Bind dialog confirm button click
  confirmAlertBtn.addEventListener('click', () => {
    if (activeAlertAction) {
      activeAlertAction();
      activeAlertAction = null;
    }
  });

  // Fetch highlights from server with offline fallback
  function loadHighlights() {
    fetch(`${API_BASE}/highlights`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch from server');
        return response.json();
      })
      .then(data => {
        allHighlights = data;
        chrome.storage.local.set({ highlights: data });
        renderHighlights();
      })
      .catch(err => {
        console.warn('Using offline cache, local server down:', err);
        showToast('Offline Mode', 'Displaying highlights cached on this browser.', 'default');
        chrome.storage.local.get({ highlights: [] }, (result) => {
          allHighlights = result.highlights;
          renderHighlights();
        });
      });
  }

  loadHighlights();

  // Render Function
  function renderHighlights(filterText = '') {
    highlightsList.innerHTML = '';
    const query = filterText.toLowerCase().trim();
    
    const filtered = allHighlights.filter(hl => 
      hl.text.toLowerCase().includes(query) || 
      hl.title.toLowerCase().includes(query) || 
      hl.url.toLowerCase().includes(query)
    );

    countSpan.innerText = `${allHighlights.length} highlight${allHighlights.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
      emptyState.classList.remove('hidden');
      if (query !== '') {
        emptyState.querySelector('h3').innerText = 'No matching highlights';
        emptyState.querySelector('p').innerText = 'Try checking your spelling or search for something else.';
      } else {
        emptyState.querySelector('h3').innerText = 'No highlights saved yet';
        emptyState.querySelector('p').innerText = 'Highlight text on any website and click "Save Highlight" to see them here.';
      }
      return;
    }

    emptyState.classList.add('hidden');

    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).forEach(hl => {
      const card = document.createElement('div');
      card.className = 'highlight-card';
      card.dataset.id = hl.id;

      let hostname = '';
      try {
        hostname = new URL(hl.url).hostname;
      } catch (e) {
        hostname = hl.url;
      }

      const formattedDate = new Date(hl.timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      card.innerHTML = `
        <div class="card-text">${escapeHtml(hl.text)}</div>
        <div class="card-meta">
          <a href="${hl.url}" target="_blank" class="card-source" title="${escapeHtml(hl.title)}">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <span>${escapeHtml(hostname)}</span>
          </a>
          <span class="card-date">${formattedDate}</span>
        </div>
        
        <div class="card-actions">
          <button class="web-btn" title="Summarize on Web">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>Summarize on Web</span>
          </button>
          <button class="delete-btn" title="Delete">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            <span>Delete</span>
          </button>
        </div>
        <div class="summary-container"></div>
      `;

      if (hl.summary) {
        renderSummaryHtml(card.querySelector('.summary-container'), hl.summary);
      }

      const deleteBtn = card.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => confirmDeleteHighlight(hl.id, hl.text, card));

      const webBtn = card.querySelector('.web-btn');
      webBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'http://localhost:3000' });
      });

      highlightsList.appendChild(card);
    });
  }

  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  // Delete Confirmation Alert Dialog Trigger
  function confirmDeleteHighlight(id, text, cardElement) {
    const preview = text.length > 50 ? text.substring(0, 50) + '...' : text;
    openAlertDialog(
      'Delete Highlight?',
      `Are you sure you want to delete this highlight?\n\n"${preview}"`,
      () => {
        cardElement.classList.add('removing');
        setTimeout(() => {
          fetch(`${API_BASE}/highlights?id=${id}`, {
            method: 'DELETE'
          })
          .then(() => {
            allHighlights = allHighlights.filter(hl => hl.id !== id);
            chrome.storage.local.set({ highlights: allHighlights }, () => {
              alertDialog.classList.add('hidden');
              renderHighlights(searchInput.value);
              showToast('Deleted', 'Highlight has been removed.', 'default');
            });
          })
          .catch(err => {
            console.warn('Could not delete on server, deleting in local cache:', err);
            allHighlights = allHighlights.filter(hl => hl.id !== id);
            chrome.storage.local.set({ highlights: allHighlights }, () => {
              alertDialog.classList.add('hidden');
              renderHighlights(searchInput.value);
              showToast('Deleted', 'Highlight removed from local cache.', 'default');
            });
          });
        }, 200);
      }
    );
  }

  // Clear All Alert Dialog Trigger
  clearAllBtn.addEventListener('click', () => {
    if (allHighlights.length === 0) return;
    openAlertDialog(
      'Are you absolutely sure?',
      'This action cannot be undone. This will permanently delete all highlights from the local database.',
      () => {
        fetch(`${API_BASE}/highlights`, {
          method: 'DELETE'
        })
        .then(() => {
          allHighlights = [];
          chrome.storage.local.set({ highlights: [] }, () => {
            alertDialog.classList.add('hidden');
            renderHighlights();
            showToast('All Cleared', 'All saved highlights have been deleted.', 'success');
          });
        })
        .catch(err => {
          console.warn('Could not clear all on server, clearing in local cache:', err);
          allHighlights = [];
          chrome.storage.local.set({ highlights: [] }, () => {
            alertDialog.classList.add('hidden');
            renderHighlights();
            showToast('All Cleared', 'Local highlights cache has been cleared.', 'success');
          });
        });
      }
    );
  });

  // Search Logic
  searchInput.addEventListener('input', (e) => {
    const value = e.target.value;
    if (value !== '') {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
    renderHighlights(value);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    renderHighlights();
  });

  function renderSummaryHtml(container, text) {
    container.innerHTML = `
      <div class="summary-box">
        <div class="summary-header">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <span>AI Summary</span>
        </div>
        <div class="summary-content">${escapeHtml(text)}</div>
      </div>
    `;
  }
});
