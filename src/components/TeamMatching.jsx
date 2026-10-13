import { useEffect, useState } from "react";
import { apiFetch } from "../api";

function TeamMatching() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [matches, setMatches] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    let active = true;
    const loadProjects = async () => {
      try {
        const response = await apiFetch("/projects");
        if (!response.ok) throw new Error("Unable to load projects. Check if the backend is running.");
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Unexpected project response.");
        if (active) setProjects(data);
      } catch (err) {
        if (active) setError(err.message || "Unable to load projects.");
      } finally {
        if (active) setLoadingProjects(false);
      }
    };
    loadProjects();
    return () => { active = false; };
  }, []);

  const handleProjectChange = (event) => {
    setSelectedProjectId(event.target.value);
    setMatches([]);
    setHasSearched(false);
    setError("");
  };

  const findMatches = async () => {
    if (!selectedProjectId) {
      setError("Please select a project.");
      return;
    }
    setLoading(true);
    setError("");
    setHasSearched(false);
    try {
      const response = await apiFetch(`/matching/project/${selectedProjectId}`);
      if (!response.ok) throw new Error("Unable to calculate matches. Please try again.");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Unexpected matching response.");
      setMatches(data);
      setHasSearched(true);
    } catch (err) {
      setError(err.message || "Unable to calculate matches. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const projectName = projects.find((item) => String(item.id) === String(selectedProjectId))?.name;
  const eligibleCount = matches.filter((result) => result.eligible).length;

  return (
    <div className="tf-matching-page">
      <style>{styles}</style>

      <section className="tf-matching-intro">
        <div>
          <span className="tf-matching-eyebrow">TALENT INTELLIGENCE</span>
          <h2>Find the right talent for every project.</h2>
          <p>Compare candidate capabilities against required skills, proficiency levels, and mandatory constraints.</p>
        </div>
        <div className="tf-matching-intro-icon" aria-hidden="true">✦</div>
      </section>

      <section className="tf-matching-panel">
        <div className="tf-matching-panel-head">
          <div>
            <h3>Match candidates to a project</h3>
            <p>Select a project to evaluate available talent using weighted skill matching.</p>
          </div>
          <span className="tf-matching-panel-label">MATCHING ENGINE</span>
        </div>
        <div className="tf-matching-controls">
          <label htmlFor="tf-matching-project">Project</label>
          <div className="tf-matching-control-row">
            <select
              id="tf-matching-project"
              value={selectedProjectId}
              onChange={handleProjectChange}
              disabled={loadingProjects || loading}
            >
              <option value="">{loadingProjects ? "Loading projects..." : "Select a project"}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            <button type="button" className="tf-matching-primary" onClick={findMatches} disabled={loading || !selectedProjectId}>
              {loading ? "Calculating matches..." : "Find matching candidates →"}
            </button>
          </div>
        </div>
        {error && <div className="tf-matching-error" role="alert">{error}</div>}
      </section>

      {hasSearched && (
        <section className="tf-matching-results-panel" aria-live="polite">
          <div className="tf-matching-results-head">
            <div>
              <span className="tf-matching-eyebrow">MATCH RESULTS</span>
              <h3>Candidate rankings</h3>
              <p>{projectName ? `Evaluation for ${projectName}` : "Project evaluation"}</p>
            </div>
            <div className="tf-matching-metrics">
              <div><strong>{matches.length}</strong><span>Evaluated</span></div>
              <div><strong>{eligibleCount}</strong><span>Eligible</span></div>
            </div>
          </div>

          {matches.length === 0 ? (
            <div className="tf-matching-empty">
              <strong>No candidates found</strong>
              <p>Add available candidates and assign their skills to evaluate them against this project.</p>
            </div>
          ) : (
            <div className="tf-matching-results-list">
              {matches.map((result, index) => {
                const score = Number(result.matchScore);
                const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
                return (
                  <article className="tf-matching-card" key={result.user.id}>
                    <div className="tf-matching-card-top">
                      <div className="tf-matching-person">
                        <span className="tf-matching-rank">#{index + 1}</span>
                        <span className="tf-matching-avatar" aria-hidden="true">
                          {(result.user.name || "C").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
                        </span>
                        <div>
                          <h4>{result.user.name}</h4>
                          <p>{result.user.email}</p>
                        </div>
                      </div>
                      <span className={`tf-matching-badge ${result.eligible ? "tf-matching-eligible" : "tf-matching-ineligible"}`}>
                        <span aria-hidden="true">●</span> {result.eligible ? "Eligible" : "Not eligible"}
                      </span>
                    </div>

                    <div className="tf-matching-score-head">
                      <span>Weighted match score</span>
                      <strong>{safeScore.toFixed(2)}%</strong>
                    </div>
                    <div className="tf-matching-track" role="progressbar" aria-label={`${result.user.name} match score`} aria-valuenow={safeScore} aria-valuemin="0" aria-valuemax="100">
                      <div className="tf-matching-fill" style={{ width: `${safeScore}%` }} />
                    </div>

                    <div className="tf-matching-details">
                      <span><strong>Preferred role</strong>{result.user.preferredRole || "Not specified"}</span>
                      <span><strong>Experience</strong>{result.user.experienceYears ?? 0} years</span>
                    </div>

                    <div className="tf-matching-explanation">
                      <strong>Why this candidate scored this way</strong>
                      <p>{result.explanation || "No explanation available."}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

const styles = `
.tf-matching-page{display:flex;flex-direction:column;gap:22px;color:#17243a}
.tf-matching-intro{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:28px 32px;background:linear-gradient(115deg,#13243f,#1d3765);border-radius:15px;color:#fff}
.tf-matching-eyebrow{display:block;font-size:10px;letter-spacing:1.7px;font-weight:850;color:#4564da;margin-bottom:10px}
.tf-matching-intro .tf-matching-eyebrow{color:#b4c6ff}
.tf-matching-intro h2{margin:0 0 9px;font-size:clamp(21px,2vw,27px);letter-spacing:-.6px;color:#fff}
.tf-matching-intro p{margin:0;max-width:680px;color:#c7d4ea;font-size:13px;line-height:1.7}
.tf-matching-intro-icon{width:52px;height:52px;display:grid;place-items:center;flex-shrink:0;border:1px solid #6c86bb66;border-radius:14px;background:#ffffff16;color:#d8e2ff;font-size:28px}
.tf-matching-panel,.tf-matching-results-panel{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:27px 30px;box-shadow:0 4px 18px #1d315005}
.tf-matching-panel-head,.tf-matching-results-head{display:flex;align-items:center;justify-content:space-between;gap:20px}
.tf-matching-panel-head h3,.tf-matching-results-head h3{margin:0 0 7px;color:#17243a;font-size:19px;letter-spacing:-.3px}
.tf-matching-panel-head p,.tf-matching-results-head p{margin:0;color:#64748b;font-size:13px;line-height:1.6}
.tf-matching-panel-label{flex-shrink:0;padding:8px 11px;background:#eef2ff;border-radius:7px;color:#365cf5;font-size:10px;font-weight:800;letter-spacing:1px}
.tf-matching-controls{margin-top:25px}
.tf-matching-controls label{display:block;margin-bottom:9px;color:#334155;font-size:12px;font-weight:750}
.tf-matching-control-row{display:flex;gap:13px;align-items:stretch}
.tf-matching-control-row select{flex:1;min-width:0;height:47px;padding:0 14px;border:1px solid #dbe3ef;border-radius:9px;background:#fff;color:#25354b;font-size:13px}
.tf-matching-control-row select:focus{outline:none;border-color:#365cf5;box-shadow:0 0 0 3px #365cf51c}
.tf-matching-primary{min-height:47px;padding:0 20px;background:#365cf5;color:#fff;border:1px solid #365cf5;border-radius:9px;font-size:13px;font-weight:750;cursor:pointer;white-space:nowrap}
.tf-matching-primary:hover:not(:disabled){background:#2749d4}
.tf-matching-primary:disabled{opacity:.55;cursor:not-allowed}
.tf-matching-error{margin-top:16px;padding:13px 16px;background:#fff1f0;border:1px solid #fecaca;border-radius:9px;color:#b42318;font-size:13px}
.tf-matching-results-head{padding-bottom:22px;border-bottom:1px solid #edf1f6;margin-bottom:20px}
.tf-matching-metrics{display:flex;gap:11px}
.tf-matching-metrics>div{min-width:82px;padding:10px 15px;border-radius:9px;background:#f3f6ff;text-align:center}
.tf-matching-metrics strong,.tf-matching-metrics span{display:block}
.tf-matching-metrics strong{font-size:23px;color:#2444bd}
.tf-matching-metrics span{font-size:11px;color:#64748b;margin-top:3px}
.tf-matching-results-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.tf-matching-card{min-width:0;padding:22px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;transition:border-color .2s,box-shadow .2s}
.tf-matching-card:hover{border-color:#c5d3ff;box-shadow:0 8px 25px #1a3b700d}
.tf-matching-card-top,.tf-matching-person{display:flex;align-items:center;gap:11px}
.tf-matching-card-top{justify-content:space-between;align-items:flex-start;gap:12px}
.tf-matching-person{min-width:0}
.tf-matching-rank{font-size:11px;color:#64748b;font-weight:800;flex-shrink:0}
.tf-matching-avatar{display:grid;place-items:center;flex:0 0 40px;width:40px;height:40px;border-radius:10px;background:#ecf1ff;color:#365cf5;font-weight:850;font-size:13px}
.tf-matching-person>div{min-width:0}
.tf-matching-person h4{margin:0 0 4px;font-size:14px;color:#15263f;overflow-wrap:anywhere}
.tf-matching-person p{margin:0;font-size:11px;color:#8190a6;overflow-wrap:anywhere}
.tf-matching-badge{display:inline-flex;align-items:center;gap:6px;flex-shrink:0;padding:7px 10px;border-radius:20px;font-size:11px;font-weight:750;white-space:nowrap}
.tf-matching-eligible{background:#eaf8f1;color:#087b53}
.tf-matching-ineligible{background:#fff0f0;color:#b42318}
.tf-matching-badge span{font-size:8px}
.tf-matching-score-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:24px 0 10px;font-size:12px;color:#64748b}
.tf-matching-score-head strong{font-size:20px;color:#17243a}
.tf-matching-track{height:10px;background:#e9eef7;border-radius:20px;overflow:hidden}
.tf-matching-fill{height:100%;border-radius:20px;background:linear-gradient(90deg,#365cf5,#6b8bff);transition:width .3s ease}
.tf-matching-details{display:flex;gap:20px;flex-wrap:wrap;margin:21px 0}
.tf-matching-details span{display:flex;flex-direction:column;gap:6px;font-size:12px;color:#475569}
.tf-matching-details strong{font-size:10px;color:#8491a5;text-transform:uppercase;letter-spacing:.7px}
.tf-matching-explanation{padding:15px;background:#f7f9fd;border-left:3px solid #365cf5;border-radius:8px}
.tf-matching-explanation strong{display:block;margin-bottom:8px;color:#263852;font-size:12px}
.tf-matching-explanation p{margin:0;color:#58677e;font-size:12px;line-height:1.7;white-space:pre-line;overflow-wrap:anywhere}
.tf-matching-empty{text-align:center;padding:35px 18px;color:#64748b}
.tf-matching-empty strong{color:#17243a}
.tf-matching-empty p{font-size:13px;line-height:1.6}
@media(max-width:1150px){.tf-matching-results-list{grid-template-columns:1fr}}
@media(max-width:700px){.tf-matching-intro,.tf-matching-panel,.tf-matching-results-panel{padding:21px}.tf-matching-intro-icon,.tf-matching-panel-label{display:none}.tf-matching-control-row{flex-direction:column}.tf-matching-primary{width:100%}.tf-matching-results-head{align-items:flex-start;flex-direction:column}.tf-matching-card-top{flex-direction:column}.tf-matching-details{gap:14px}}
`;

export default TeamMatching;
