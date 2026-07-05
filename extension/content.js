// content.js

let shadowHost = null;

function removeSaveButton() {
  if (shadowHost) {
    shadowHost.remove();
    shadowHost = null;
  }
}

document.addEventListener('mouseup', (event) => {
  setTimeout(() => {
    const selection = window.getSelection();
    if (!selection) return;
    
    const selectedText = selection.toString().trim();
    if (!selectedText) {
      return;
    }
    
    if (!shadowHost) {
      shadowHost = document.createElement('div');
      shadowHost.id = 'hl-saver-shadow-host';
      shadowHost.style.position = 'absolute';
      shadowHost.style.zIndex = '2147483647';
      shadowHost.style.pointerEvents = 'none';
      document.body.appendChild(shadowHost);
      
      const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
      
      const style = document.createElement('style');
      style.textContent = `
        .save-btn {
          position: absolute;
          transform: translate(-50%, -100%);
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #ffffff;
          border: none;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          font-family: system-ui, -apple-system, sans-serif;
          border-radius: 20px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: auto;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
          opacity: 0;
          animation: popIn 0.2s forwards;
        }
        .save-btn:hover {
          background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
          box-shadow: 0 6px 20px rgba(79, 70, 229, 0.6);
          transform: translate(-50%, -105%) scale(1.03);
        }
        .save-btn:active {
          transform: translate(-50%, -98%) scale(0.97);
        }
        .save-btn.saved {
          background: #10b981 !important;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4) !important;
        }
        @keyframes popIn {
          from {
            opacity: 0;
            transform: translate(-50%, -80%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -100%) scale(1);
          }
        }
      `;
      
      const button = document.createElement('button');
      button.className = 'save-btn';
      button.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
        </svg>
        <span>Save Highlight</span>
      `;
      
      function triggerSavedState() {
        button.classList.add('saved');
        button.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Saved!</span>
        `;
        setTimeout(() => {
          removeSaveButton();
          selection.removeAllRanges();
        }, 800);
      }
      
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        const newHighlight = {
          id: Date.now().toString(),
          text: selectedText,
          url: window.location.href,
          title: document.title || window.location.hostname,
          timestamp: new Date().toISOString()
        };
        
        // 1. Save to local storage cache first
        chrome.storage.local.get({ highlights: [] }, (result) => {
          const highlights = result.highlights;
          const exists = highlights.some(hl => hl.text === newHighlight.text && hl.url === newHighlight.url);
          if (!exists) {
            highlights.push(newHighlight);
            chrome.storage.local.set({ highlights });
          }
        });
        
        // 2. Sync to Next.js dashboard
        fetch('http://localhost:3000/api/highlights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newHighlight)
        })
        .then(response => {
          if (!response.ok) throw new Error('API save failed');
          return response.json();
        })
        .then(() => {
          triggerSavedState();
        })
        .catch(err => {
          console.warn("Could not sync with local server, saved in local cache:", err);
          triggerSavedState();
        });
      });
      
      shadowRoot.appendChild(style);
      shadowRoot.appendChild(button);
    }
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    const leftVal = rect.left + window.scrollX + (rect.width / 2);
    const topVal = rect.top + window.scrollY - 8;
    
    shadowHost.style.left = `${leftVal}px`;
    shadowHost.style.top = `${topVal}px`;
  }, 10);
});

document.addEventListener('mousedown', (event) => {
  if (shadowHost) {
    if (event.composedPath().includes(shadowHost)) {
      return;
    }
    removeSaveButton();
  }
});
