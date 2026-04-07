# CV Match Scorer

A full-stack AI tool that analyses a CV against a job description and produces a structured match report — scoring alignment across skills, experience, and education with actionable recommendations.

## Features
- **PDF Parsing** — extracts text from any uploaded CV PDF using PyMuPDF
- **LLM Analysis** — sends CV + job description to Groq's Llama 3.1 with a structured prompt
- **Structured JSON Output** — engineered prompt forces the model to return consistent JSON every time
- **Interactive Dashboard** — React frontend renders score rings, matched/missing skill badges, strengths, gaps, and recommendations
- **Role-agnostic** — works for any job description across any industry

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React, CSS |
| Backend | Python, Flask |
| LLM | Groq API (Llama 3.1) |
| PDF Parsing | PyMuPDF (fitz) |
| Deployment | Docker ready |

## How It Works
1. User uploads CV as PDF and pastes a job description
2. Flask backend extracts text from the PDF using PyMuPDF
3. CV text and job description are sent to Groq with a structured prompt
4. Model returns a JSON object with scores, matched skills, gaps, and recommendations
5. React frontend renders the result as an interactive dashboard

## Running Locally
**Prerequisites:** Python 3.12+, Node.js 22+, Groq API key (free at console.groq.com)
```bash
git clone https://github.com/adamhzmii/cv-match-scorer.git
cd cv-match-scorer

# backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
echo "GROQ_API_KEY=your_key_here" > .env
python app.py

# frontend (new terminal tab)
cd frontend
npm install
npm start
```

App runs at `http://localhost:3000`