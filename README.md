# Return Autopsy

A beginner-friendly college mini-project for recording product returns and identifying common return reasons.

## Features
- Dashboard with total, pending, approved and rejected returns
- Add a return request
- View, search and filter return history
- Update return status and delete records
- Basic return-reason analysis and suggestions
- AI customer feedback analysis using Google Gemini (issue, sentiment, summary and recommendation)
- SQLite database (created automatically)

## Project structure
```text
Return-Autopsy/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── backend/
│   ├── main.py
│   ├── database.py
│   └── requirements.txt
└── README.md
```

## Requirements
- Python 3.9 or newer
- A Google Gemini API key (for the AI feedback analysis feature)
- A modern web browser
- Internet connection for the Chart.js CDN and Google Fonts (optional visual enhancements)

## Run the backend

Open a terminal in the `Return-Autopsy` folder:

```bash
cd backend
python -m venv venv
```

Windows PowerShell:
```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies and start the server:
```bash
pip install -r requirements.txt

# Set your Gemini API key for this terminal session (PowerShell)
$env:GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`.
API documentation: `http://127.0.0.1:8000/docs`.

## Run the frontend

Keep the backend running. Open a second terminal:

```bash
cd frontend
python -m http.server 5500
```

Open `http://127.0.0.1:5500` in your browser.

You can also open `frontend/index.html` directly, but using the local web server is recommended.

## Database
The SQLite database file `backend/returns.db` is created automatically the first time the backend starts. It stores return records locally.

## AI feature setup
1. Get an API key from Google AI Studio: https://aistudio.google.com/apikey
2. In the same PowerShell terminal where you start FastAPI, set the key:
   ```powershell
   $env:GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
   ```
3. Restart the backend after setting the key.
4. Open the **Return Autopsy** page, enter customer feedback, and click **Analyse with AI**.

The key stays in the backend environment and is never placed in frontend JavaScript. Do not share your API key or upload it to GitHub. Gemini API usage may be subject to Google's quotas and pricing. Customer feedback is sent to Google's Gemini service for analysis, so use sample/demo text unless you have permission to share real customer information.

## Notes
- This is a local educational demo, not a production deployment.
- The dashboard's return counts and reason chart are calculated using normal program logic. The new feedback-analysis feature uses the Gemini AI model.
- The app starts with an empty database. Add a few sample returns to populate the dashboard and insights.
