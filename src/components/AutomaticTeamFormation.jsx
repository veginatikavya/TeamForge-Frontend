import { useEffect, useState } from "react";
import { apiFetch } from "../api";

function AutomaticTeamFormation() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [suggestedTeam, setSuggestedTeam] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProjects() {
      try {
        const response = await apiFetch("/projects");
        if (!response.ok) throw new Error("Unable to load projects. Please check the backend.");
        const data = await response.json();
        if (active) setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setError(err.message || "Unable to load projects.");
      }
    }
    loadProjects();
    return () => { active = false; };
  }, []);

  const selectedProject = projects.find((project) => String(project.id) === selectedProjectId);
  const teamCapacity = Number(selectedProject?.teamSize) || 0;
  const openPositions = Math.max(0, teamCapacity - suggestedTeam.length);

  const handleProjectChange = (event) => {
    setSelectedProjectId(event.target.value);
    setSuggestedTeam([]);
    setHasGenerated(false);
    setError("");
  };

  const generateTeam = async () => {
    if (!selectedProjectId) {
      setError("Please select a project.");
      return;
    }
    setLoading(true);
    setError("");
    setHasGenerated(false);
    setSuggestedTeam([]);
    try {
      const response = await apiFetch(`/automatic-team/project/${selectedProjectId}`);
      if (!response.ok) throw new Error("Unable to generate a team. Please try again.");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Unexpected team recommendation response.");
      setSuggestedTeam(data);
      setHasGenerated(true);
    } catch (err) {
      setError(err.message || "Unable to generate a team.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tf-auto-page">
      <section className="tf-auto-hero">
        <div>
          <span className="tf-auto-eyebrow">AUTOMATED TEAM INTELLIGENCE</span>
          <h2>Build stronger teams with smarter recommendations.</h2>
          <p>Generate a suggested team using skill coverage, candidate availability, and project capacity.</p>
        </div>
        <div className="tf-auto-hero-icon" aria-hidden="true">✦</div>
      </section>

      <section className="tf-auto-panel">
        <div className="tf-auto-panel-header">
          <div>
            <h3>Generate a project team</h3>
            <p>Select a project to run the skill-coverage-based team formation algorithm.</p>
          </div>
          <span className="tf-auto-label">TEAM BUILDER</span>
        </div>
        <label className="tf-auto-field-label" htmlFor="tf-auto-project">Project</label>
        <div className="tf-auto-controls">
          <select id="tf-auto-project" value={selectedProjectId} onChange={handleProjectChange} disabled={loading}>
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <button type="button" className="tf-auto-primary" onClick={generateTeam} disabled={loading || !selectedProjectId}>
            {loading ? "Generating team..." : "Generate team →"}
          </button>
        </div>
        {error && <div className="tf-auto-error" role="alert">{error}</div>}
      </section>

      {hasGenerated && (
        <section className="tf-auto-panel" aria-live="polite">
          <div className="tf-auto-panel-header">
            <div>
              <span className="tf-auto-section-eyebrow">TEAM RECOMMENDATION</span>
              <h3>Suggested team</h3>
              <p>Results for {selectedProject?.name || "the selected project"}</p>
            </div>
            <span className="tf-auto-label">{suggestedTeam.length} / {teamCapacity} MEMBERS</span>
          </div>

          <div className="tf-auto-stats">
            <div className="tf-auto-stat"><span>TEAM CAPACITY</span><strong>{teamCapacity}</strong><small>Project team seats</small></div>
            <div className="tf-auto-stat"><span>SUGGESTED MEMBERS</span><strong>{suggestedTeam.length}</strong><small>Selected by the algorithm</small></div>
            <div className="tf-auto-stat"><span>UNFILLED POSITIONS</span><strong>{openPositions}</strong><small>Remaining team seats</small></div>
          </div>

          <div className="tf-auto-note"><span aria-hidden="true">ⓘ</span><p><strong>Recommendation only.</strong> No candidates are added to the project automatically. Use Team Management to assign members.</p></div>

          {suggestedTeam.length < teamCapacity && (
            <div className="tf-auto-warning"><strong>Partial team recommendation</strong><p>The algorithm selected {suggestedTeam.length} of {teamCapacity} positions. It may stop early when no remaining available candidate improves the project's skill coverage. Review skill requirements and candidate profiles if more coverage is needed.</p></div>
          )}

          {suggestedTeam.length === 0 ? (
            <div className="tf-auto-empty"><h4>No team could be suggested</h4><p>Check candidate availability and whether their skills match the project's requirements.</p></div>
          ) : (
            <div className="tf-auto-grid">
              {suggestedTeam.map((candidate, index) => (
                <article className="tf-auto-member" key={candidate.id}>
                  <div className="tf-auto-member-top">
                    <span className="tf-auto-rank">#{index + 1}</span>
                    <span className="tf-auto-avatar">{(candidate.name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase()}</span>
                    <div className="tf-auto-member-identity"><h4>{candidate.name}</h4><p>{candidate.email}</p></div>
                    <span className="tf-auto-badge">Suggested</span>
                  </div>
                  <div className="tf-auto-member-details">
                    <div><span>PREFERRED ROLE</span><strong>{candidate.preferredRole || "Not specified"}</strong></div>
                    <div><span>EXPERIENCE</span><strong>{candidate.experienceYears ?? 0} years</strong></div>
                  </div>
                  <div className="tf-auto-availability"><span className={candidate.available ? "tf-auto-dot" : "tf-auto-dot tf-auto-dot-off"} />{candidate.available ? "Available for assignment" : "Currently unavailable"}</div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <style>{`
        .tf-auto-page{display:flex;flex-direction:column;gap:26px;color:#17243a}
        .tf-auto-hero{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:36px 40px;background:linear-gradient(110deg,#132440,#213e72);border-radius:18px;color:white}
        .tf-auto-eyebrow,.tf-auto-section-eyebrow{display:block;font-size:11px;letter-spacing:1.7px;font-weight:800;color:#aabfff;margin-bottom:16px}
        .tf-auto-hero h2{font-size:28px;line-height:1.3;letter-spacing:-.6px;color:#fff;margin:0 0 14px;max-width:680px}
        .tf-auto-hero p{font-size:14px;line-height:1.7;color:#d3def0;margin:0;max-width:690px}
        .tf-auto-hero-icon{width:64px;height:64px;flex-shrink:0;display:grid;place-items:center;border:1px solid #ffffff22;background:#ffffff14;border-radius:17px;font-size:32px;color:#dce7ff}
        .tf-auto-panel{background:#fff;border:1px solid #e1e8f2;border-radius:17px;padding:32px 36px}
        .tf-auto-panel-header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:26px}
        .tf-auto-panel-header h3{margin:0 0 8px;color:#14243e;font-size:21px;letter-spacing:-.35px}
        .tf-auto-panel-header p{margin:0;color:#64748b;font-size:13px;line-height:1.6}
        .tf-auto-label{background:#edf2ff;color:#365cf5;border-radius:9px;padding:11px 13px;font-size:11px;letter-spacing:.6px;font-weight:800;white-space:nowrap}
        .tf-auto-field-label{display:block;margin-bottom:11px;color:#243551;font-size:12px;font-weight:800}
        .tf-auto-controls{display:flex;align-items:stretch;gap:15px}
        .tf-auto-controls select{flex:1;min-width:0;background:#fff;border:1px solid #dbe4f1;border-radius:10px;padding:14px 17px;color:#17243a;font-size:14px;outline:none}
        .tf-auto-controls select:focus-visible{border-color:#365cf5;box-shadow:0 0 0 3px #365cf51c}
        .tf-auto-primary{border:0;border-radius:10px;background:#365cf5;color:#fff;font-weight:750;font-size:13px;padding:14px 22px;cursor:pointer;white-space:nowrap;transition:background .2s,transform .2s}
        .tf-auto-primary:hover:not(:disabled){background:#284bd4;transform:translateY(-1px)}
        .tf-auto-primary:disabled{opacity:.55;cursor:not-allowed}
        .tf-auto-error{margin-top:16px;padding:13px 16px;border-radius:9px;background:#fff1f2;border:1px solid #fecdd3;color:#b91c1c;font-size:13px}
        .tf-auto-section-eyebrow{color:#365cf5;margin-bottom:9px}
        .tf-auto-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px;margin-bottom:20px}
        .tf-auto-stat{display:flex;flex-direction:column;background:#f8faff;border:1px solid #e6ebf6;border-radius:13px;padding:21px 23px}
        .tf-auto-stat>span{font-size:10px;font-weight:850;letter-spacing:1px;color:#64748b}
        .tf-auto-stat strong{font-size:32px;color:#17243a;line-height:1.35;margin:5px 0}
        .tf-auto-stat small{font-size:12px;color:#8090a7}
        .tf-auto-note{display:flex;gap:11px;align-items:flex-start;padding:14px 16px;background:#eef4ff;border:1px solid #dce8ff;border-radius:11px;color:#375a9a;margin-bottom:16px}
        .tf-auto-note>span{font-size:20px;line-height:1}
        .tf-auto-note p,.tf-auto-warning p{font-size:12px;line-height:1.65;margin:0}
        .tf-auto-warning{background:#fffbeb;border:1px solid #fde68a;border-radius:11px;padding:15px 17px;margin-bottom:22px;color:#92400e}
        .tf-auto-warning strong{display:block;font-size:13px;margin-bottom:5px}
        .tf-auto-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
        .tf-auto-member{background:#fff;border:1px solid #e1e8f2;border-radius:14px;padding:24px;min-width:0;transition:box-shadow .2s,border-color .2s}
        .tf-auto-member:hover{border-color:#b9c9ff;box-shadow:0 10px 25px #1b367010}
        .tf-auto-member-top{display:flex;align-items:center;gap:12px;min-width:0}
        .tf-auto-rank{color:#64748b;font-weight:800;font-size:12px}
        .tf-auto-avatar{width:46px;height:46px;display:grid;place-items:center;border-radius:12px;background:#ebf0ff;color:#365cf5;font-weight:850;flex-shrink:0}
        .tf-auto-member-identity{min-width:0;flex:1}
        .tf-auto-member-identity h4{margin:0 0 5px;font-size:14px;color:#17243a;overflow-wrap:anywhere}
        .tf-auto-member-identity p{margin:0;font-size:12px;color:#8a98ad;overflow-wrap:anywhere}
        .tf-auto-badge{background:#eaf8f1;color:#087b53;border-radius:20px;padding:7px 10px;font-size:11px;font-weight:750;white-space:nowrap}
        .tf-auto-member-details{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-top:25px;padding:18px 0;border-top:1px solid #edf1f6;border-bottom:1px solid #edf1f6}
        .tf-auto-member-details div{display:flex;flex-direction:column;gap:7px;min-width:0}
        .tf-auto-member-details span{color:#8190a7;font-size:10px;font-weight:800;letter-spacing:.7px}
        .tf-auto-member-details strong{color:#324563;font-size:12px;font-weight:650;overflow-wrap:anywhere}
        .tf-auto-availability{display:flex;align-items:center;gap:7px;font-size:12px;color:#64748b;margin-top:16px}
        .tf-auto-dot{width:7px;height:7px;border-radius:50%;background:#0ca678}
        .tf-auto-dot-off{background:#d97706}
        .tf-auto-empty{text-align:center;padding:36px 12px;color:#64748b}
        .tf-auto-empty h4{color:#17243a;font-size:17px;margin:0 0 8px}.tf-auto-empty p{font-size:13px;margin:0}
        @media(max-width:900px){.tf-auto-grid{grid-template-columns:1fr}}
        @media(max-width:700px){.tf-auto-hero{padding:26px;align-items:flex-start}.tf-auto-hero h2{font-size:23px}.tf-auto-hero-icon{display:none}.tf-auto-panel{padding:23px}.tf-auto-controls{flex-direction:column}.tf-auto-stats{grid-template-columns:1fr}.tf-auto-panel-header{align-items:flex-start;flex-direction:column}}
        @media(max-width:420px){.tf-auto-member-top{flex-wrap:wrap}.tf-auto-badge{margin-left:auto}.tf-auto-member-details{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}

export default AutomaticTeamFormation;
