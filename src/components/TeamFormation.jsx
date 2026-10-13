import { useEffect, useState } from "react";
import { apiFetch } from "../api";

function TeamFormation({ onBack }) {
  const [projects, setProjects] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProjects();
    loadCandidates();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadTeamMembers(selectedProjectId);
    } else {
      setTeamMembers([]);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      const response = await apiFetch(`/projects`);

      if (!response.ok) {
        throw new Error("Failed to load projects");
      }

      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error(error);
      setError("Unable to load projects.");
    }
  };

  const loadCandidates = async () => {
    try {
      const response = await apiFetch(`/users`);

      if (!response.ok) {
        throw new Error("Failed to load candidates");
      }

      const data = await response.json();
      setCandidates(data);
    } catch (error) {
      console.error(error);
      setError("Unable to load candidates.");
    }
  };

  const loadTeamMembers = async (projectId) => {
    setLoading(true);

    try {
      const response = await apiFetch(
        `/team-members/project/${projectId}`
      );

      if (!response.ok) {
        throw new Error("Failed to load team members");
      }

      const data = await response.json();
      setTeamMembers(data);
    } catch (error) {
      console.error(error);
      setError("Unable to load team members.");
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find(
    (project) => project.id === Number(selectedProjectId)
  );

  const availableCandidates = candidates.filter((candidate) => {
    const alreadySelected = teamMembers.some(
      (member) => member.user.id === candidate.id
    );

    return candidate.available === true && !alreadySelected;
  });

  const addTeamMember = async () => {
    setMessage("");
    setError("");

    if (!selectedProject || !selectedCandidateId) {
      setError("Please select a project and candidate.");
      return;
    }

    if (teamMembers.length >= selectedProject.teamSize) {
      setError("Team is full. Remove a member before adding another.");
      return;
    }

    const candidate = candidates.find(
      (person) => person.id === Number(selectedCandidateId)
    );

    if (!candidate) {
      setError("Candidate not found.");
      return;
    }

    const alreadySelected = teamMembers.some(
      (member) => member.user.id === candidate.id
    );

    if (alreadySelected) {
      setError("This candidate is already part of the team.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch(`/team-members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project: selectedProject,
          user: candidate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add team member");
      }

      setSelectedCandidateId("");
      setMessage(`${candidate.name} added to the team successfully!`);

      await loadTeamMembers(selectedProjectId);
    } catch (error) {
      console.error(error);
      setError("Unable to add candidate to the team.");
    } finally {
      setLoading(false);
    }
  };

  const removeTeamMember = async (member) => {
    const confirmed = window.confirm(
      `Remove ${member.user.name} from this team?`
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch(
        `/team-members/${member.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove team member");
      }

      setMessage(`${member.user.name} removed from the team.`);

      await loadTeamMembers(selectedProjectId);
    } catch (error) {
      console.error(error);
      setError("Unable to remove team member.");
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (event) => {
    setSelectedProjectId(event.target.value);
    setSelectedCandidateId("");
    setMessage("");
    setError("");
  };

  const capacity = Number(selectedProject?.teamSize || 0);
  const remaining = Math.max(0, capacity - teamMembers.length);
  const isFull = !!selectedProject && remaining === 0;

  return (
    <div className="tf-team-page">
      <style>{teamStyles}</style>
      <section className="tf-team-hero">
        <div>
          <span className="tf-team-eyebrow">TEAM OPERATIONS</span>
          <h2>Build teams with clarity and control.</h2>
          <p>Assign available talent, track team capacity, and manage project membership in one place.</p>
        </div>
        <span className="tf-team-hero-icon" aria-hidden="true">✦</span>
      </section>

      <section className="tf-team-panel">
        <div className="tf-team-section-head">
          <div><h3>Project team workspace</h3><p>Choose a project to view and manage its team.</p></div>
          <span className="tf-team-pill">TEAM MANAGEMENT</span>
        </div>
        <label className="tf-team-label" htmlFor="tf-team-project">Project</label>
        <select id="tf-team-project" className="tf-team-select" value={selectedProjectId} onChange={handleProjectChange}>
          <option value="">Select a project</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        {!selectedProject && <p className="tf-team-hint">Select a project to see assigned members and remaining positions.</p>}
      </section>

      {error && <div className="tf-team-alert tf-team-error" role="alert">{error}</div>}
      {message && <div className="tf-team-alert tf-team-success" role="status">{message}</div>}

      {selectedProject && (
        <>
          <div className="tf-team-metrics">
            <div className="tf-team-metric"><span>TEAM CAPACITY</span><strong>{capacity}</strong><small>Planned positions</small></div>
            <div className="tf-team-metric"><span>ASSIGNED MEMBERS</span><strong>{teamMembers.length}</strong><small>Currently on the team</small></div>
            <div className="tf-team-metric"><span>AVAILABLE POSITIONS</span><strong>{remaining}</strong><small>{isFull ? "Team is at capacity" : "Open team seats"}</small></div>
          </div>

          <section className="tf-team-panel">
            <div className="tf-team-section-head">
              <div><h3>Add a team member</h3><p>Choose an available candidate who is not already assigned to this team.</p></div>
              {isFull && <span className="tf-team-full">Team full</span>}
            </div>
            <div className="tf-team-controls">
              <label className="tf-team-field" htmlFor="tf-team-candidate">
                <span>Available candidates</span>
                <select id="tf-team-candidate" className="tf-team-select" value={selectedCandidateId}
                  onChange={(event) => setSelectedCandidateId(event.target.value)} disabled={loading || isFull}>
                  <option value="">Select a candidate</option>
                  {availableCandidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} — {candidate.preferredRole || "Role not specified"}</option>)}
                </select>
              </label>
              <button className="tf-team-primary" type="button" onClick={addTeamMember}
                disabled={loading || !selectedCandidateId || isFull}>
                {loading ? "Please wait..." : "+ Add to team"}
              </button>
            </div>
            {isFull && <p className="tf-team-hint">This team has reached its required size. Remove a member to free a position.</p>}
            {!isFull && availableCandidates.length === 0 && <p className="tf-team-hint">No unassigned available candidates found for this project.</p>}
          </section>

          <section className="tf-team-panel">
            <div className="tf-team-section-head">
              <div><h3>Assigned team members</h3><p>People currently contributing to {selectedProject.name}.</p></div>
              <span className="tf-team-count">{teamMembers.length} / {capacity} assigned</span>
            </div>
            {loading && teamMembers.length === 0 ? <div className="tf-team-empty">Loading team members...</div> :
              teamMembers.length === 0 ? <div className="tf-team-empty">No team members assigned yet. Select a candidate above to get started.</div> :
              <div className="tf-team-member-grid">
                {teamMembers.map((member) => (
                  <article className="tf-team-member" key={member.id}>
                    <div className="tf-team-member-top">
                      <div className="tf-team-avatar">{(member.user?.name || "?").split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase()}</div>
                      <div className="tf-team-person"><h4>{member.user.name}</h4><p>{member.user.email}</p></div>
                      <span className="tf-team-assigned">Assigned</span>
                    </div>
                    <div className="tf-team-member-info">
                      <div><span>PREFERRED ROLE</span><strong>{member.user.preferredRole || "Not specified"}</strong></div>
                      <div><span>EXPERIENCE</span><strong>{member.user.experienceYears ?? 0} years</strong></div>
                    </div>
                    <div className="tf-team-member-bottom">
                      <span>Team member</span>
                      <button type="button" className="tf-team-remove" onClick={() => removeTeamMember(member)} disabled={loading}>Remove member</button>
                    </div>
                  </article>
                ))}
              </div>}
          </section>
        </>
      )}
    </div>
  );
}

const teamStyles = `
.tf-team-page{display:flex;flex-direction:column;gap:24px;color:#17243a}
.tf-team-hero{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:34px 38px;border-radius:17px;background:linear-gradient(115deg,#13243f,#1e3a6a);color:#fff}
.tf-team-eyebrow{font-size:11px;font-weight:800;letter-spacing:1.6px;color:#aebfff}
.tf-team-hero h2{margin:14px 0 12px;font-size:27px;letter-spacing:-.5px;color:white}
.tf-team-hero p{margin:0;font-size:14px;color:#cbd5e7;line-height:1.7;max-width:720px}
.tf-team-hero-icon{display:grid;place-items:center;flex-shrink:0;width:64px;height:64px;border-radius:17px;background:#ffffff16;border:1px solid #ffffff20;color:#e6edff;font-size:34px}
.tf-team-panel{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px 32px}
.tf-team-section-head{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:24px}
.tf-team-section-head h3{margin:0 0 8px;color:#17243a;font-size:21px;letter-spacing:-.3px}
.tf-team-section-head p{margin:0;color:#64748b;font-size:13px;line-height:1.6}
.tf-team-pill,.tf-team-count{white-space:nowrap;padding:10px 13px;border-radius:9px;background:#eef2ff;color:#365cf5;font-size:11px;font-weight:800;letter-spacing:.6px}
.tf-team-label,.tf-team-field span{display:block;margin-bottom:10px;font-size:12px;font-weight:750;color:#334155}
.tf-team-select{display:block;width:100%;min-width:0;box-sizing:border-box;border:1px solid #dbe3ef;border-radius:10px;background:#fff;color:#17243a;padding:14px 15px;font-size:14px;outline:none}
.tf-team-select:focus{border-color:#365cf5;box-shadow:0 0 0 3px #365cf51c}
.tf-team-select:disabled{background:#f8fafc;color:#94a3b8}
.tf-team-hint{margin:13px 0 0;color:#64748b;font-size:12px;line-height:1.6}
.tf-team-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px}
.tf-team-metric{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:22px 24px;display:flex;flex-direction:column}
.tf-team-metric span{font-size:11px;font-weight:800;letter-spacing:.9px;color:#64748b}
.tf-team-metric strong{font-size:34px;line-height:1.3;margin:7px 0;color:#17243a}
.tf-team-metric small{font-size:12px;color:#8190a6}
.tf-team-controls{display:flex;align-items:end;gap:16px}
.tf-team-field{flex:1;min-width:0}
.tf-team-primary{white-space:nowrap;border:0;border-radius:10px;padding:15px 22px;background:#365cf5;color:white;font-size:13px;font-weight:750;cursor:pointer;transition:background .2s}
.tf-team-primary:hover:not(:disabled){background:#274bd2}
.tf-team-primary:disabled{opacity:.5;cursor:not-allowed}
.tf-team-full{padding:8px 12px;border-radius:20px;background:#fff3e8;color:#b45309;font-size:12px;font-weight:750}
.tf-team-alert{border-radius:10px;padding:13px 17px;font-size:13px}
.tf-team-error{background:#fff1f2;border:1px solid #fecdd3;color:#b91c1c}
.tf-team-success{background:#ecfdf5;border:1px solid #a7f3d0;color:#047857}
.tf-team-member-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:17px}
.tf-team-member{border:1px solid #e2e8f0;border-radius:13px;padding:22px;min-width:0;background:white;transition:border-color .2s,box-shadow .2s}
.tf-team-member:hover{border-color:#c4d2fc;box-shadow:0 8px 24px #1a3b7010}
.tf-team-member-top{display:flex;align-items:center;gap:12px;min-width:0}
.tf-team-avatar{display:grid;place-items:center;flex-shrink:0;width:47px;height:47px;border-radius:11px;background:#eaf0ff;color:#365cf5;font-weight:850;font-size:16px}
.tf-team-person{flex:1;min-width:0}.tf-team-person h4{margin:0 0 5px;font-size:15px;color:#17243a;overflow-wrap:anywhere}.tf-team-person p{margin:0;font-size:12px;color:#8190a6;overflow-wrap:anywhere}
.tf-team-assigned{flex-shrink:0;padding:7px 10px;border-radius:20px;background:#eaf8f1;color:#087b53;font-size:11px;font-weight:750}
.tf-team-member-info{display:flex;gap:28px;margin:24px 0}.tf-team-member-info>div{display:flex;flex-direction:column;gap:8px;min-width:0}.tf-team-member-info span{font-size:10px;font-weight:800;letter-spacing:.6px;color:#8190a6}.tf-team-member-info strong{font-size:13px;color:#334155;font-weight:650;overflow-wrap:anywhere}
.tf-team-member-bottom{border-top:1px solid #edf1f6;padding-top:16px;display:flex;justify-content:space-between;align-items:center;gap:12px;color:#94a3b8;font-size:12px}
.tf-team-remove{border:1px solid #fecaca;border-radius:9px;background:#fff7f7;color:#b91c1c;padding:10px 13px;font-size:12px;font-weight:750;cursor:pointer}.tf-team-remove:hover:not(:disabled){background:#fee2e2}.tf-team-remove:disabled{opacity:.5;cursor:not-allowed}
.tf-team-empty{border:1px dashed #dbe3ef;border-radius:12px;padding:35px;text-align:center;color:#64748b;font-size:13px}
@media(max-width:900px){.tf-team-member-grid{grid-template-columns:1fr}}
@media(max-width:720px){.tf-team-hero{padding:25px}.tf-team-hero-icon{display:none}.tf-team-panel{padding:21px}.tf-team-metrics{grid-template-columns:1fr}.tf-team-section-head{align-items:flex-start;flex-direction:column}.tf-team-controls{flex-direction:column;align-items:stretch}.tf-team-field{width:100%}.tf-team-primary{width:100%}}
`;

export default TeamFormation;
