# Website Highlight Saver - Chrome Extension & Web Dashboard

A full-stack ecosystem consisting of a Manifest V3 Chrome Extension and a companion Next.js web dashboard designed to capture, display, search, and generate AI-powered summaries for webpage text highlights.

---

## Architecture Overview

1.  **Chrome Extension**: 
    *   **Content Script**: Tracks text selection coordinates and renders a floating button safely isolated inside a **Shadow DOM**.
    *   **Popup UI**: Displays a scrollable list of all clips, searchable in real-time, with a redirect link to summarize highlights on the web.
2.  **Next.js Backend API**: Handles CORS and stores highlight clips in a local JSON database file (`data/highlights.json`). It also acts as a secure server-side portal for OpenAI completion requests.
3.  **Next.js Dashboard**: A premium, obsidian-dark themed user interface that implements custom, animated **Shadcn-style dialogs, alert modals, and toast portals** to prevent accidental deletion and replace raw browser alert boxes.

---

## Local Setup & Installation

### Step 1: Clone the Repository
Clone the project to your local workspace:
```bash
git clone <repository-url>
cd frontend
```

### Step 2: Install Dependencies
This project uses `pnpm` as its package manager. Install the dependencies for the web dashboard:
```bash
pnpm install
```

### Step 3: Start the Web Dashboard & API Server
Run the development server in the background:
```bash
pnpm run dev
```
Open **`http://localhost:3000`** in your browser to view the active dashboard.

### Step 4: Load the Chrome Extension
1.  Open Chrome and navigate to **`chrome://extensions/`**.
2.  Enable **Developer mode** using the toggle switch in the top-right corner.
3.  Click the **Load unpacked** button in the top-left corner.
4.  Select the **`extension/`** directory located inside the cloned repository root folder.

---

## How to Use

1.  **Highlight & Save**: Go to any webpage (e.g. Wikipedia), select some text, and click the floating **Save Highlight** button.
2.  **View in Extension**: Click the Highlighter icon in the Chrome toolbar. You will see your newly saved highlight. Click **Summarize on Web** to open the dashboard.
3.  **View in Dashboard**: Refresh `http://localhost:3000`. Your highlights are synced in real-time.
4.  **AI Summarize**: 
    *   Click **API Settings** in the dashboard header and input your OpenAI API Key (saved in browser `localStorage`).
    *   Click **Summarize with AI** on any card. The server will request a concise summary from OpenAI's `gpt-4o-mini` model, save it, and sync it back.
5.  **Safe Delete**: Click the **Trash** icon. A custom alert warning modal showing a preview of the text will confirm the action to safeguard data.
