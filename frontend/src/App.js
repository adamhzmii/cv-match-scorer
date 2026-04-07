import { useState } from "react";
import { Upload, FileText, Briefcase, CheckCircle, XCircle, AlertCircle, Star } from "lucide-react";
import "./App.css";

function ScoreRing({ score, label, size = 80 }) {
  const color = score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="score-ring-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={size / 2 - 8}
          fill="none" stroke="#1e2130" strokeWidth="7"
        />
        <circle
          cx={size / 2} cy={size / 2} r={size / 2 - 8}
          fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${2 * Math.PI * (size / 2 - 8)}`}
          strokeDashoffset={`${2 * Math.PI * (size / 2 - 8) * (1 - score / 100)}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
          fill={color} fontSize={size * 0.22} fontWeight="bold">
          {score}%
        </text>
      </svg>
      <span className="score-ring-label">{label}</span>
    </div>
  );
}

function Badge({ text, type }) {
  const classes = { matched: "badge-green", missing: "badge-red", gap: "badge-yellow" };
  return <span className={`badge ${classes[type]}`}>{text}</span>;
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card">
      <div className="card-header">
        <Icon size={16} />
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function App() {
  const [cvFile, setCvFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function handleSubmit() {
    if (!cvFile || !jobDesc.trim()) {
      setError("Please upload a CV and enter a job description.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("cv_file", cvFile);
    formData.append("job_description", jobDesc);

    try {
      const res = await fetch("http://localhost:5002/api/score", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Could not connect to the server. Make sure the backend is running.");
    }
    setLoading(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") setCvFile(file);
    else setError("Please upload a PDF file.");
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="header-title">
            <Star size={20} color="#3b82f6" />
            <span>CV Match Scorer</span>
          </div>
          <span className="header-sub">Powered by Llama 3.1 · LLM-based analysis</span>
        </div>
      </header>

      <main className="main">
        {/* ── INPUT PANEL ── */}
        <div className="input-grid">
          {/* CV Upload */}
          <div
            className={`upload-zone ${dragOver ? "drag-over" : ""} ${cvFile ? "has-file" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input").click()}
          >
            <input
              id="file-input" type="file" accept=".pdf"
              style={{ display: "none" }}
              onChange={(e) => setCvFile(e.target.files[0])}
            />
            {cvFile ? (
              <>
                <CheckCircle size={28} color="#10b981" />
                <span className="upload-filename">{cvFile.name}</span>
                <span className="upload-hint">Click to change</span>
              </>
            ) : (
              <>
                <Upload size={28} color="#4b5563" />
                <span className="upload-label">Drop your CV here</span>
                <span className="upload-hint">PDF only · Click or drag</span>
              </>
            )}
          </div>

          {/* Job Description */}
          <div className="jd-wrap">
            <div className="jd-label">
              <Briefcase size={14} />
              <span>Job Description</span>
            </div>
            <textarea
              className="jd-input"
              placeholder="Paste the full job description here..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              rows={8}
            />
          </div>
        </div>

        {error && <div className="error-msg"><AlertCircle size={14} />{error}</div>}

        <button
          className="analyse-btn"
          onClick={handleSubmit}
          disabled={loading || !cvFile || !jobDesc.trim()}
        >
          {loading ? "Analysing..." : "Analyse My CV"}
        </button>

        {/* ── RESULTS ── */}
        {result && (
          <div className="results">
            {/* Overall score + sub scores */}
            <div className="scores-row">
              <ScoreRing score={result.overall_score} label="Overall Match" size={110} />
              <div className="sub-scores">
                <ScoreRing score={result.skills_score} label="Skills" size={75} />
                <ScoreRing score={result.experience_score} label="Experience" size={75} />
                <ScoreRing score={result.education_score} label="Education" size={75} />
              </div>
            </div>

            {/* Summary */}
            <div className="summary-box">
              <FileText size={14} />
              <p>{result.summary}</p>
            </div>

            {/* Skills grid */}
            <div className="two-col">
              <Section icon={CheckCircle} title="Matched Skills">
                <div className="badge-list">
                  {result.matched_skills.map((s, i) => (
                    <Badge key={i} text={s} type="matched" />
                  ))}
                </div>
              </Section>

              <Section icon={XCircle} title="Missing Skills">
                <div className="badge-list">
                  {result.missing_skills.length > 0
                    ? result.missing_skills.map((s, i) => <Badge key={i} text={s} type="missing" />)
                    : <span className="none-text">None identified</span>}
                </div>
              </Section>
            </div>

            {/* Strengths & Gaps */}
            <div className="two-col">
              <Section icon={Star} title="Strengths">
                <ul className="list">
                  {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </Section>

              <Section icon={AlertCircle} title="Gaps">
                <ul className="list">
                  {result.gaps.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </Section>
            </div>

            {/* Recommendations */}
            <Section icon={FileText} title="Recommendations">
              <ul className="list">
                {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}