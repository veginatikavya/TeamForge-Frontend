import { useEffect, useState } from "react";
import { apiFetch } from "../api";

const palette = {
  navy: "#17243a",
  blue: "#365cf5",
  muted: "#64748b",
  border: "#e0e8f5",
  background: "#f5f7fb",
};

const panel = {
  background: "#fff",
  border: `1px solid ${palette.border}`,
  borderRadius: 18,
  padding: "32px 36px",
  marginBottom: 26,
};

function CapabilityGaps() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProjects() {
      try {
        const response = await apiFetch("/projects");
        if (!response.ok) throw new Error("Failed to load projects");
        const data = await response.json();
        if (active) setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        if (active) setError("Unable to load projects. Check whether the backend is running.");
      }
    }
    loadProjects();
    return () => { active = false; };
  }, []);

  const selectedProject = projects.find(
    (project) => String(project.id) === String(selectedProjectId)
  );

  function handleProjectChange(event) {
    setSelectedProjectId(event.target.value);
    setGaps([]);
    setHasAnalyzed(false);
    setError("");
  }

  async function analyzeGaps() {
    if (!selectedProjectId) {
      setError("Please select a project.");
      return;
    }
    setLoading(true);
    setError("");
    setHasAnalyzed(false);
    try {
      const response = await apiFetch(`/gaps/project/${selectedProjectId}`);
      if (!response.ok) throw new Error("Failed to analyze capability gaps");
      const data = await response.json();
      setGaps(Array.isArray(data) ? data : []);
      setHasAnalyzed(true);
    } catch (err) {
      console.error(err);
      setError("Unable to analyze gaps. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const coveredCount = gaps.filter((gap) => gap.covered === true).length;
  const missingCount = gaps.length - coveredCount;
  const coveragePercent = gaps.length ? Math.round((coveredCount / gaps.length) * 100) : 0;

  return (
    <div style={{ color: palette.navy, width: "100%" }}>
      <section style={{
        background: "linear-gradient(115deg, #12223e, #203e72)",
        borderRadius: 20,
        padding: "38px 40px",
        color: "white",
        marginBottom: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
      }}>
        <div>
          <div style={{ color: "#a9c2ff", fontSize: 12, fontWeight: 800, letterSpacing: 2, marginBottom: 16 }}>
            CAPABILITY INTELLIGENCE
          </div>
          <h2 style={{ margin: "0 0 14px", fontSize: "clamp(23px, 2.5vw, 32px)", lineHeight: 1.25, color: "white" }}>
            Turn skill gaps into actionable insights.
          </h2>
          <p style={{ margin: 0, color: "#dbe7ff", fontSize: 15, lineHeight: 1.7 }}>
            Compare project requirements with your assigned team's skills and proficiency levels.
          </p>
        </div>
        <div aria-hidden="true" style={{ flexShrink: 0, background: "#ffffff15", border: "1px solid #ffffff25", borderRadius: 18, padding: "15px 20px", fontSize: 28 }}>✦</div>
      </section>

      <section style={panel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: "0 0 8px", fontSize: 23 }}>Analyze project capabilities</h2>
            <p style={{ margin: "0 0 25px", color: palette.muted }}>
              Choose a project to identify covered skills and requirements that need attention.
            </p>
          </div>
          <span style={{ background: "#eef2ff", color: palette.blue, padding: "11px 15px", borderRadius: 10, fontSize: 12, fontWeight: 800, letterSpacing: 0.6 }}>
            GAP ANALYSIS
          </span>
        </div>
        <label htmlFor="gap-project" style={{ display: "block", fontWeight: 700, marginBottom: 12, fontSize: 13 }}>Project</label>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <select
            id="gap-project"
            value={selectedProjectId}
            onChange={handleProjectChange}
            style={{ flex: "1 1 300px", minWidth: 0, height: 56, padding: "0 18px", borderRadius: 11, border: `1px solid ${palette.border}`, background: "white", color: palette.navy, fontSize: 15 }}
          >
            <option value="">-- Select a Project --</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <button
            type="button"
            onClick={analyzeGaps}
            disabled={loading || !selectedProjectId}
            style={{ height: 56, padding: "0 26px", border: 0, borderRadius: 11, background: palette.blue, color: "white", fontWeight: 800, fontSize: 14, cursor: loading || !selectedProjectId ? "not-allowed" : "pointer", opacity: loading || !selectedProjectId ? 0.6 : 1 }}
          >
            {loading ? "Analyzing..." : "Analyze gaps →"}
          </button>
        </div>
        {error && <p role="alert" style={{ color: "#b91c1c", background: "#fff1f2", padding: 14, borderRadius: 10, marginTop: 16 }}>{error}</p>}
      </section>

      {hasAnalyzed && (
        <section style={panel}>
          <div style={{ color: palette.blue, fontWeight: 800, fontSize: 12, letterSpacing: 1.8, marginBottom: 12 }}>ANALYSIS RESULTS</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 24 }}>Skill coverage overview</h2>
          <p style={{ color: palette.muted, margin: "0 0 26px" }}>Evaluation for {selectedProject?.name ?? "selected project"}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: 14, marginBottom: 28 }}>
            {[
              ["REQUIRED SKILLS", gaps.length, palette.blue],
              ["COVERED SKILLS", coveredCount, "#059669"],
              ["SKILL GAPS", missingCount, "#dc2626"],
              ["COVERAGE", `${coveragePercent}%`, palette.navy],
            ].map(([label, value, color]) => (
              <div key={label} style={{ background: palette.background, border: `1px solid ${palette.border}`, borderRadius: 14, padding: "22px 20px" }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.7, color: palette.muted, marginBottom: 12 }}>{label}</div>
                <div style={{ fontSize: 30, fontWeight: 800, color }}>{value}</div>
              </div>
            ))}
          </div>

          {gaps.length === 0 ? (
            <div style={{ background: palette.background, borderRadius: 14, padding: 26, color: palette.muted }}>
              <strong style={{ color: palette.navy }}>No skill requirements to analyze</strong>
              <p style={{ marginBottom: 0 }}>Add skill requirements to this project to see capability coverage.</p>
            </div>
          ) : (
            <>
              <div style={{ height: 10, background: "#e8edf6", borderRadius: 99, overflow: "hidden", marginBottom: 28 }} aria-label={`${coveragePercent}% of project skills covered`}>
                <div style={{ width: `${coveragePercent}%`, height: "100%", background: "#059669", borderRadius: 99, transition: "width .3s" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: 18 }}>
                {gaps.map((gap, index) => {
                  const isCovered = gap.covered === true;
                  const required = Number(gap.requiredProficiency);
                  // Only display team proficiency when explicitly supplied by the API.
                  const teamValue = gap.currentProficiency ?? gap.teamProficiency ?? gap.highestProficiency ?? null;
                  const teamNumber = teamValue == null ? null : Number(teamValue);
                  const requiredWidth = Number.isFinite(required) ? Math.max(0, Math.min(100, (required / 5) * 100)) : 0;
                  const teamWidth = teamNumber != null && Number.isFinite(teamNumber) ? Math.max(0, Math.min(100, (teamNumber / 5) * 100)) : 0;
                  return (
                    <article key={gap.id ?? `${gap.skillId ?? "skill"}-${index}`} style={{ border: `1px solid ${palette.border}`, borderRadius: 15, padding: 24, background: "white" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
                        <h3 style={{ margin: 0, fontSize: 18, overflowWrap: "anywhere" }}>{gap.skillName ?? gap.skill?.name ?? "Skill"}</h3>
                        <span style={{ flexShrink: 0, borderRadius: 99, padding: "8px 12px", fontSize: 12, fontWeight: 800, color: isCovered ? "#047857" : "#b91c1c", background: isCovered ? "#e8f8f1" : "#fff0f1" }}>
                          {isCovered ? "● Covered" : "● Missing"}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 15, fontSize: 13 }}>
                        <span style={{ color: palette.muted }}>Priority</span>
                        <strong style={{ textTransform: "capitalize" }}>{String(gap.priority ?? "Not specified").toLowerCase()}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10, fontSize: 13 }}>
                        <span style={{ color: palette.muted }}>Required proficiency</span>
                        <strong>{Number.isFinite(required) ? `${required}/5` : "N/A"}</strong>
                      </div>
                      <div style={{ height: 8, borderRadius: 99, background: "#e9eef8", overflow: "hidden", marginBottom: 16 }}>
                        <div style={{ height: "100%", width: `${requiredWidth}%`, background: palette.blue, borderRadius: 99 }} />
                      </div>
                      {teamNumber != null && Number.isFinite(teamNumber) && (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10, fontSize: 13 }}>
                            <span style={{ color: palette.muted }}>Team proficiency</span>
                            <strong>{teamNumber}/5</strong>
                          </div>
                          <div style={{ height: 8, borderRadius: 99, background: "#e9eef8", overflow: "hidden", marginBottom: 16 }}>
                            <div style={{ height: "100%", width: `${teamWidth}%`, background: isCovered ? "#059669" : "#e59b31", borderRadius: 99 }} />
                          </div>
                        </>
                      )}
                      <div style={{ background: isCovered ? "#f0fbf5" : "#fff7f5", borderLeft: `3px solid ${isCovered ? "#059669" : "#dc2626"}`, borderRadius: 8, padding: "12px 14px", color: isCovered ? "#047857" : "#9f3434", fontSize: 13, lineHeight: 1.5 }}>
                        {isCovered ? "Current team meets this skill requirement." : "Current team does not fully meet this skill requirement."}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default CapabilityGaps;
