import { useEffect, useState } from "react";
import { apiFetch } from "../api";

const blue = "#365cf5";
const navy = "#17243a";
const muted = "#64748b";
const border = "1px solid #e1e8f4";
const panel = { background: "#fff", border, borderRadius: 18, padding: "30px 36px", marginBottom: 24 };

function TeamRecommendations() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    let active = true;
    const loadProjects = async () => {
      try {
        const response = await apiFetch("/projects");
        if (!response.ok) throw new Error("Failed to load projects");
        const data = await response.json();
        if (active) {
          setProjects(Array.isArray(data) ? data : []);
          if (Array.isArray(data) && data.length) setSelectedProjectId(String(data[0].id));
        }
      } catch (err) {
        console.error(err);
        if (active) setError("Unable to load projects. Check if the backend is running.");
      }
    };
    loadProjects();
    return () => { active = false; };
  }, []);

  const handleProjectChange = (event) => {
    setSelectedProjectId(event.target.value);
    setRecommendations([]);
    setHasSearched(false);
    setError("");
  };

  const findRecommendations = async () => {
    if (!selectedProjectId) { setError("Please select a project."); return; }
    setLoading(true);
    setError("");
    setHasSearched(false);
    try {
      const response = await apiFetch(`/team-recommendations/project/${selectedProjectId}`);
      if (!response.ok) throw new Error("Failed to fetch recommendations");
      const data = await response.json();
      setRecommendations(Array.isArray(data) ? data : []);
      setHasSearched(true);
    } catch (err) {
      console.error(err);
      setError("Unable to load team recommendations. Please try again.");
    } finally { setLoading(false); }
  };

  const selectedProject = projects.find((project) => String(project.id) === String(selectedProjectId));
  const clampScore = (score) => Math.min(100, Math.max(0, Number(score) || 0));

  return (
    <div style={{ width: "100%", color: navy }}>
      <section style={{ borderRadius: 20, padding: "38px 44px", background: "linear-gradient(115deg, #12223e, #234276)", color: "white", marginBottom: 30 }}>
        <p style={{ fontSize: 12, letterSpacing: 2, fontWeight: 800, color: "#a9c1ff", margin: "0 0 18px" }}>TEAM CONTRIBUTION INTELLIGENCE</p>
        <h2 style={{ fontSize: "clamp(23px, 3vw, 31px)", margin: "0 0 14px", lineHeight: 1.3 }}>Find the talent your team is missing.</h2>
        <p style={{ color: "#dbe7ff", margin: 0, lineHeight: 1.7 }}>Identify available candidates who can close skill gaps and strengthen your existing project team.</p>
      </section>

      <section style={panel}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ fontSize: 23, margin: "0 0 10px" }}>Find team recommendations</h3>
            <p style={{ margin: "0 0 25px", color: muted }}>Choose a project to evaluate candidates based on their additional skill contribution.</p>
          </div>
          <span style={{ color: blue, background: "#edf1ff", padding: "12px 16px", borderRadius: 10, fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>RECOMMENDATION ENGINE</span>
        </div>
        <label htmlFor="tf-recommend-project" style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Project</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <select id="tf-recommend-project" value={selectedProjectId} onChange={handleProjectChange} style={{ flex: "1 1 300px", minWidth: 0, padding: "17px 18px", borderRadius: 10, border, background: "white", color: navy, fontSize: 15 }}>
            <option value="">-- Select a Project --</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <button type="button" onClick={findRecommendations} disabled={loading || !selectedProjectId} style={{ background: blue, color: "white", border: 0, borderRadius: 10, padding: "17px 25px", fontWeight: 700, cursor: loading || !selectedProjectId ? "not-allowed" : "pointer", opacity: loading || !selectedProjectId ? 0.6 : 1 }}>
            {loading ? "Analyzing..." : "Find recommendations →"}
          </button>
        </div>
        {error && <p role="alert" style={{ color: "#b91c1c", background: "#fff1f2", padding: 14, borderRadius: 9, marginBottom: 0 }}>{error}</p>}
      </section>

      {hasSearched && (
        <section style={panel}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, paddingBottom: 22, borderBottom: border, marginBottom: 24 }}>
            <div>
              <p style={{ color: blue, fontSize: 12, fontWeight: 800, letterSpacing: 1.7, margin: "0 0 10px" }}>RECOMMENDATION RESULTS</p>
              <h3 style={{ fontSize: 23, margin: "0 0 9px" }}>Candidates who improve team coverage</h3>
              <p style={{ margin: 0, color: muted }}>Results for {selectedProject?.name || "selected project"}</p>
            </div>
            <div style={{ background: "#f1f4ff", padding: "16px 24px", borderRadius: 13, textAlign: "center" }}>
              <strong style={{ display: "block", fontSize: 28, color: blue }}>{recommendations.length}</strong>
              <span style={{ fontSize: 12, color: muted }}>Recommendations</span>
            </div>
          </div>
          {recommendations.length === 0 ? (
            <div style={{ background: "#f7f9fc", borderRadius: 14, padding: 28 }}>
              <h4 style={{ margin: "0 0 9px", fontSize: 18 }}>No additional recommendations</h4>
              <p style={{ margin: 0, color: muted, lineHeight: 1.6 }}>There may be no uncovered requirements, or no available candidates whose skills improve the current team's coverage.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 370px), 1fr))", gap: 20 }}>
              {recommendations.map((result, index) => {
                const user = result.user || {};
                const score = clampScore(result.contributionScore);
                const initials = (user.name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
                return (
                  <article key={user.id ?? index} style={{ border, borderRadius: 16, padding: 26, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ color: muted, fontWeight: 800, fontSize: 13 }}>#{index + 1}</span>
                      <div style={{ display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: 13, color: blue, background: "#edf1ff", fontWeight: 800 }}>{initials}</div>
                      <div style={{ flex: "1 1 150px", minWidth: 0 }}>
                        <h4 style={{ margin: "0 0 5px", fontSize: 17, overflowWrap: "anywhere" }}>{user.name || "Candidate"}</h4>
                        <p style={{ margin: 0, fontSize: 13, color: muted, overflowWrap: "anywhere" }}>{user.email || ""}</p>
                      </div>
                      <span style={{ color: "#047857", background: "#e8f8f0", padding: "9px 12px", borderRadius: 25, fontWeight: 700, fontSize: 12 }}>● Recommended</span>
                    </div>
                    <div style={{ marginTop: 28 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                        <span style={{ color: muted, fontSize: 14 }}>Team contribution score</span>
                        <strong style={{ fontSize: 23 }}>{score.toFixed(2)}%</strong>
                      </div>
                      <div role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={`Team contribution score for ${user.name || "candidate"}`} style={{ background: "#e8edf6", height: 11, borderRadius: 20, marginTop: 12, overflow: "hidden" }}>
                        <div style={{ width: `${score}%`, height: "100%", borderRadius: 20, background: "linear-gradient(90deg, #365cf5, #6c86ff)" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 30, flexWrap: "wrap", marginTop: 24 }}>
                      <div><span style={{ color: muted, fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>PREFERRED ROLE</span><p style={{ margin: "8px 0 0", fontSize: 14 }}>{user.preferredRole || "Not specified"}</p></div>
                      <div><span style={{ color: muted, fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>EXPERIENCE</span><p style={{ margin: "8px 0 0", fontSize: 14 }}>{user.experienceYears ?? 0} years</p></div>
                    </div>
                    <div style={{ background: "#f5f7fb", borderLeft: `3px solid ${blue}`, borderRadius: 10, padding: "17px 19px", marginTop: 25 }}>
                      <strong style={{ fontSize: 13 }}>Why this candidate is recommended</strong>
                      <p style={{ margin: "10px 0 0", fontSize: 14, color: muted, lineHeight: 1.6 }}>{result.explanation || "Contributes to uncovered project requirements."}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          <p style={{ margin: "24px 0 0", color: muted, fontSize: 13 }}>Recommendations are advisory. To assign a candidate, use Team Management.</p>
        </section>
      )}
    </div>
  );
}

export default TeamRecommendations;
