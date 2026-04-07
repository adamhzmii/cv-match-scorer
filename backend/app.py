import os
import json
import fitz  # pymupdf
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = Flask(__name__)
CORS(app)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def extract_text_from_pdf(file) -> str:
    # read the uploaded pdf bytes and extract all text content
    pdf_bytes = file.read()
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text.strip()


def score_cv(cv_text: str, job_description: str) -> dict:
    prompt = f"""
You are an expert recruitment consultant. Analyse the CV against the job description below.

Return ONLY a valid JSON object with this exact structure, no extra text:
{{
  "overall_score": <integer 0-100>,
  "summary": "<2 sentence overall assessment>",
  "matched_skills": ["<skill>", "<skill>"],
  "missing_skills": ["<skill>", "<skill>"],
  "experience_score": <integer 0-100>,
  "skills_score": <integer 0-100>,
  "education_score": <integer 0-100>,
  "strengths": ["<strength>", "<strength>", "<strength>"],
  "gaps": ["<gap>", "<gap>"],
  "recommendations": ["<recommendation>", "<recommendation>", "<recommendation>"]
}}

JOB DESCRIPTION:
{job_description}

CV:
{cv_text}
"""

    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": "You are a recruitment expert. Always respond with valid JSON only. No markdown, no explanation, just the JSON object."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        max_tokens=1000,
        temperature=0.3
    )

    raw = response.choices[0].message.content.strip()

    # strip markdown code fences if the model adds them anyway
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    return json.loads(raw)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/score", methods=["POST"])
def score():
    # expect multipart form: cv_file (PDF) + job_description (text)
    if "cv_file" not in request.files:
        return jsonify({"error": "no CV file uploaded"}), 400

    job_description = request.form.get("job_description", "").strip()
    if not job_description:
        return jsonify({"error": "no job description provided"}), 400

    cv_file = request.files["cv_file"]
    if not cv_file.filename.endswith(".pdf"):
        return jsonify({"error": "file must be a PDF"}), 400

    try:
        cv_text = extract_text_from_pdf(cv_file)
        result = score_cv(cv_text, job_description)
        return jsonify(result)
    except json.JSONDecodeError:
        return jsonify({"error": "failed to parse AI response"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5002)