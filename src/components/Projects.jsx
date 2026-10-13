import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../api";

const blankRequirement = () => ({ skillId: "", requiredProficiency: 3, priority: "MANDATORY" });
const priorityLabel = { MANDATORY: "Mandatory", PREFERRED: "Preferred", OPTIONAL: "Optional" };

function Projects() {
  const [projects, setProjects] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const formRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [project, setProject] = useState({ name: "", description: "", teamSize: "" });
  const [requirements, setRequirements] = useState([blankRequirement()]);

  const loadProjects = useCallback(async () => {
    const response = await apiFetch("/projects");
    if (!response.ok) throw new Error("Unable to load projects.");
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Unexpected project response.");
    const enriched = await Promise.all(data.map(async (item) => {
      try {
        const result = await apiFetch(`/project-requirements/project/${item.id}`);
        if (!result.ok) throw new Error("Requirements unavailable");
        const reqs = await result.json();
        return { ...item, requirements: Array.isArray(reqs) ? reqs : [], requirementsError: false };
      } catch {
        return { ...item, requirements: [], requirementsError: true };
      }
    }));
    setProjects(enriched);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [skillsResponse] = await Promise.all([apiFetch("/skills"), loadProjects()]);
      if (!skillsResponse.ok) throw new Error("Unable to load the skill library.");
      const skillsData = await skillsResponse.json();
      setAvailableSkills(Array.isArray(skillsData) ? skillsData : []);
    } catch (err) {
      setError(err.message || "Unable to load project information.");
    } finally {
      setLoading(false);
    }
  }, [loadProjects]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (showForm) {
      const timer = setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      return () => clearTimeout(timer);
    }
  }, [showForm, editingId]);

  const startCreate = () => {
    setEditingId(null);
    setProject({ name: "", description: "", teamSize: "" });
    setRequirements([blankRequirement()]);
    setError("");
    setNotice("");
    setShowForm(true);
  };

  const startEdit = (item) => {
    if (item.requirementsError) {
      setError("Could not load this project's requirements. Refresh before editing.");
      return;
    }
    setEditingId(item.id);
    setProject({ name: item.name || "", description: item.description || "", teamSize: String(item.teamSize ?? "") });
    setRequirements((item.requirements || []).map((req) => ({
      id: req.id,
      skillId: String(req.skill?.id ?? ""),
      requiredProficiency: Number(req.requiredProficiency ?? 3),
      priority: req.priority || "MANDATORY",
    })));
    setError("");
    setNotice("");
    setShowForm(true);
  };

  const readError = async (response, fallback) => {
    const body = await response.json().catch(() => ({}));
    return body.message || fallback;
  };

  const filteredProjects = useMemo(() => projects.filter((item) =>
    `${item.name || ""} ${item.description || ""}`.toLowerCase().includes(search.toLowerCase().trim())
  ), [projects, search]);

  const updateRequirement = (index, field, value) => {
    setRequirements((current) => current.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const resetForm = () => {
    setProject({ name: "", description: "", teamSize: "" });
    setRequirements([blankRequirement()]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const name = project.name.trim();
    const teamSize = Number(project.teamSize);
    if (name.length < 3 || name.length > 120 || !Number.isInteger(teamSize) || teamSize < 1 || teamSize > 100) {
      setError("Project name must be 3–120 characters, and team size must be between 1 and 100.");
      return;
    }
    if (project.description.length > 2000) {
      setError("Description cannot exceed 2000 characters.");
      return;
    }
    if (requirements.some((item) => !item.skillId)) {
      setError("Select a skill for every requirement, or remove unused rows.");
      return;
    }
    if (new Set(requirements.map((item) => String(item.skillId))).size !== requirements.length) {
      setError("Each skill can only be included once per project.");
      return;
    }
    if (requirements.some((item) => !Number.isInteger(Number(item.requiredProficiency)) || Number(item.requiredProficiency) < 1 || Number(item.requiredProficiency) > 5)) {
      setError("Proficiency must be between 1 and 5.");
      return;
    }

    setSaving(true);
    let savedProject = null;
    try {
      const editing = editingId !== null;
      const response = await apiFetch(editing ? `/projects/${editingId}` : "/projects", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({ name, description: project.description.trim(), teamSize }),
      });
      if (!response.ok) throw new Error(await readError(response, `Unable to ${editing ? "update" : "create"} project.`));
      savedProject = await response.json();

      // Save new and changed requirements before removing obsolete ones.
      const original = editing ? (projects.find((item) => item.id === editingId)?.requirements || []) : [];
      for (const item of requirements) {
        const skill = availableSkills.find((entry) => Number(entry.id) === Number(item.skillId));
        if (!skill) throw new Error("A selected skill is no longer available.");
        const method = item.id ? "PUT" : "POST";
        const endpoint = item.id ? `/project-requirements/${item.id}` : "/project-requirements";
        const result = await apiFetch(endpoint, {
          method,
          body: JSON.stringify({
            project: { id: savedProject.id },
            skill: { id: skill.id },
            requiredProficiency: Number(item.requiredProficiency),
            priority: item.priority,
          }),
        });
        if (!result.ok) throw new Error(await readError(result, `Could not save requirement: ${skill.name}.`));
      }
      const keepIds = new Set(requirements.map((item) => item.id).filter(Boolean));
      for (const previous of original) {
        if (!keepIds.has(previous.id)) {
          const result = await apiFetch(`/project-requirements/${previous.id}`, { method: "DELETE" });
          if (!result.ok) throw new Error(await readError(result, `Could not remove ${previous.skill?.name || "a requirement"}.`));
        }
      }

      resetForm();
      await loadProjects();
      setNotice(`“${name}” was ${editing ? "updated" : "created"} successfully.`);
    } catch (err) {
      setError(savedProject
        ? `Project details were saved, but some requirement changes may be incomplete. ${err.message} Review and save again.`
        : (err.message || "Unable to save project."));
      if (savedProject) {
        try { await loadProjects(); } catch { /* Preserve the original error */ }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (item) => {
    if (!window.confirm(`Permanently delete “${item.name}”? This cannot be undone.`)) return;
    setError("");
    setNotice("");
    setDeletingProjectId(item.id);
    try {
      const response = await apiFetch(`/projects/${item.id}`, { method: "DELETE" });
      if (!response.ok) {
        let message = "Unable to delete this project.";
        try { const data = await response.json(); message = data.message || message; } catch { /* Response may be empty */ }
        throw new Error(message);
      }
      await loadProjects();
      setNotice(`“${item.name}” was deleted.`);
    } catch (err) {
      setError(`${err.message} Projects with linked team members or requirements may require cleanup first.`);
    } finally {
      setDeletingProjectId(null);
    }
  };

  return (
    <div className="tf-projects">
      <style>{projectStyles}</style>
      <section className="tf-pj-toolbar">
        <div className="tf-pj-toolbar-copy">
          <span className="tf-pj-kicker">PROJECT PORTFOLIO</span>
          <h2>Projects built for better teams.</h2>
          <p>Define the work, set team capacity, and prioritize the skills your projects need.</p>
        </div>
        <button className="tf-pj-primary" type="button" onClick={() => { if (showForm) resetForm(); else startCreate(); }}>
          {showForm ? "Close form" : "+ Create project"}
        </button>
      </section>

      <div className="tf-pj-metrics">
        <div className="tf-pj-metric"><span>ACTIVE PROJECTS</span><strong>{projects.length}</strong><small>Projects in your workspace</small></div>
        <div className="tf-pj-metric"><span>PLANNED TEAM SEATS</span><strong>{projects.reduce((sum, item) => sum + (Number(item.teamSize) || 0), 0)}</strong><small>Combined team capacity</small></div>
        <div className="tf-pj-metric"><span>SKILL REQUIREMENTS</span><strong>{projects.reduce((sum, item) => sum + (item.requirements?.length || 0), 0)}</strong><small>Defined across projects</small></div>
      </div>

      {error && <div className="tf-pj-alert tf-pj-error" role="alert">{error}</div>}
      {notice && <div className="tf-pj-alert tf-pj-success" role="status">{notice}</div>}

      {showForm && (
        <section ref={formRef} className="tf-pj-panel tf-pj-create" style={{ scrollMarginTop: "90px" }}>
          <div className="tf-pj-panel-head"><div><span className="tf-pj-kicker">{editingId !== null ? "EDIT PROJECT" : "NEW PROJECT"}</span><h3>{editingId !== null ? "Edit project & capabilities" : "Set up a project"}</h3><p>{editingId !== null ? "Update project details and manage skill requirements." : "Start with project details, then define the capabilities needed for delivery."}</p></div></div>
          <form onSubmit={handleSubmit}>
            <div className="tf-pj-form-grid">
              <label className="tf-pj-field">Project name<input value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} placeholder="e.g. Customer Analytics Platform" maxLength={120} required /></label>
              <label className="tf-pj-field">Team size<input type="number" min="1" max="100" value={project.teamSize} onChange={(e) => setProject({ ...project, teamSize: e.target.value })} placeholder="e.g. 5" required /></label>
              <label className="tf-pj-field tf-pj-wide">Description<textarea rows="3" value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} placeholder="What will this team build?" maxLength={2000} /></label>
            </div>
            <div className="tf-pj-requirements-head"><div><h4>Required capabilities</h4><p>Mandatory skills determine candidate eligibility; preferred and optional skills help rank matches.</p></div><button className="tf-pj-secondary" type="button" onClick={() => setRequirements((prev) => [...prev, blankRequirement()])}>+ Add requirement</button></div>
            <div className="tf-pj-requirements-list">
              {requirements.map((item, index) => (
                <div className="tf-pj-requirement-row" key={index}>
                  <label className="tf-pj-field">Skill<select value={item.skillId} onChange={(e) => updateRequirement(index, "skillId", e.target.value)} required><option value="">Select a skill</option>{availableSkills.map((skill) => <option value={skill.id} key={skill.id}>{skill.name}</option>)}</select></label>
                  <label className="tf-pj-field">Proficiency<select value={item.requiredProficiency} onChange={(e) => updateRequirement(index, "requiredProficiency", e.target.value)}><option value="1">1 · Beginner</option><option value="2">2 · Basic</option><option value="3">3 · Intermediate</option><option value="4">4 · Advanced</option><option value="5">5 · Expert</option></select></label>
                  <label className="tf-pj-field">Priority<select value={item.priority} onChange={(e) => updateRequirement(index, "priority", e.target.value)}><option value="MANDATORY">Mandatory</option><option value="PREFERRED">Preferred</option><option value="OPTIONAL">Optional</option></select></label>
                  <button className="tf-pj-remove" type="button" disabled={false} onClick={() => setRequirements((prev) => prev.filter((_, i) => i !== index))} title="Remove requirement" aria-label={`Remove requirement ${index + 1}`}>×</button>
                </div>
              ))}
            </div>
            <div className="tf-pj-form-actions"><button className="tf-pj-secondary" type="button" onClick={resetForm} disabled={saving}>Cancel</button><button className="tf-pj-primary" type="submit" disabled={saving}>{saving ? "Saving project..." : editingId !== null ? "Save changes →" : "Create project →"}</button></div>
          </form>
        </section>
      )}

      <section className="tf-pj-panel">
        <div className="tf-pj-list-header"><div><h3>Project workspace</h3><p>Explore project requirements and manage your portfolio.</p></div><span className="tf-pj-count">{filteredProjects.length} projects</span></div>
        <div className="tf-pj-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search projects by name or description..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search projects" /></div>
        {loading ? <div className="tf-pj-empty">Loading projects...</div> : filteredProjects.length === 0 ? <div className="tf-pj-empty">{search ? "No projects match your search." : "No projects yet. Create your first project to get started."}</div> : (
          <div className="tf-pj-grid">{filteredProjects.map((item) => (
            <article className="tf-pj-card" key={item.id}>
              <div className="tf-pj-card-top"><span className="tf-pj-card-icon">{(item.name || "P").slice(0, 1).toUpperCase()}</span><span className="tf-pj-status"><span /> Active</span></div>
              <h4>{item.name}</h4><p className="tf-pj-description">{item.description || "No description provided."}</p>
              <div className="tf-pj-card-facts"><span>◉ &nbsp; {item.teamSize} team {Number(item.teamSize) === 1 ? "seat" : "seats"}</span><span>◇ &nbsp; {item.requirements?.length || 0} skills</span></div>
              <div className="tf-pj-card-divider" />
              <div className="tf-pj-capability-label">PROJECT REQUIREMENTS</div>
              {item.requirementsError ? <p className="tf-pj-requirement-note">Requirements could not be loaded.</p> : item.requirements.length ? <div className="tf-pj-tags">{item.requirements.map((req) => <span className={`tf-pj-tag tf-pj-${(req.priority || "OPTIONAL").toLowerCase()}`} key={req.id} title={`${priorityLabel[req.priority] || req.priority} requirement`}>{req.skill?.name || "Unknown skill"} · {req.requiredProficiency}/5 <small>{priorityLabel[req.priority] || req.priority}</small></span>)}</div> : <p className="tf-pj-requirement-note">No requirements defined yet.</p>}
              <div className="tf-pj-card-bottom"><span>Project #{item.id}</span><div className="tf-pj-card-actions"><button type="button" className="tf-pj-edit" onClick={() => startEdit(item)} disabled={saving || deletingProjectId !== null || item.requirementsError}>Edit project</button><button type="button" className="tf-pj-delete" onClick={() => handleDeleteProject(item)} disabled={deletingProjectId !== null}>{deletingProjectId === item.id ? "Deleting..." : "Delete project"}</button></div></div>
            </article>
          ))}</div>
        )}
      </section>
    </div>
  );
}

const projectStyles = `
.tf-projects{display:flex;flex-direction:column;gap:24px;color:#14243e}
.tf-pj-toolbar{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:27px 30px;background:linear-gradient(115deg,#13243f,#1d3765);border-radius:15px;color:white}
.tf-pj-kicker{display:block;font-size:11px;letter-spacing:1.6px;font-weight:800;color:#5574f5;margin-bottom:11px}
.tf-pj-toolbar .tf-pj-kicker{color:#aabdfc}.tf-pj-toolbar h2{margin:0 0 9px;font-size:25px;letter-spacing:-.6px;color:#fff}.tf-pj-toolbar p{margin:0;color:#c4d0e6;font-size:13px;line-height:1.7;max-width:610px}
.tf-pj-primary{background:#365cf0!important;color:white!important;border:0!important;border-radius:9px!important;padding:13px 19px!important;font-size:13px!important;font-weight:750!important;cursor:pointer;white-space:nowrap}.tf-pj-primary:hover{background:#274bd2!important}.tf-pj-primary:disabled{opacity:.6;cursor:wait}
.tf-pj-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px}.tf-pj-metric{background:white;border:1px solid #e2e8f0;border-radius:13px;padding:21px 24px;display:flex;flex-direction:column}.tf-pj-metric>span{font-size:11px;font-weight:800;color:#7a8aa3;letter-spacing:1px}.tf-pj-metric strong{font-size:33px;line-height:1.3;margin:6px 0;color:#182944}.tf-pj-metric small{font-size:12px;color:#8a98ad}
.tf-pj-panel{background:white;border:1px solid #e2e8f0;border-radius:15px;padding:27px 29px}.tf-pj-panel h3{margin:0 0 7px;font-size:19px;color:#17243c}.tf-pj-panel p{margin:0;color:#8190a6;font-size:13px;line-height:1.6}.tf-pj-panel-head{margin-bottom:25px}
.tf-pj-form-grid{display:grid;grid-template-columns:2fr 1fr;gap:17px}.tf-pj-field{display:flex;flex-direction:column;gap:9px;color:#334155;font-size:12px;font-weight:700;min-width:0}.tf-pj-wide{grid-column:1/-1}.tf-pj-field input,.tf-pj-field select,.tf-pj-field textarea{width:100%;box-sizing:border-box;min-width:0;padding:12px 13px;border:1px solid #dbe3ef;border-radius:8px;background:#fff;color:#24324b;font:inherit;font-size:13px;font-weight:400;outline:none}.tf-pj-field input:focus,.tf-pj-field select:focus,.tf-pj-field textarea:focus{border-color:#365cf0;box-shadow:0 0 0 3px #365cf01a}
.tf-pj-requirements-head{display:flex;align-items:center;justify-content:space-between;gap:15px;margin:28px 0 15px}.tf-pj-requirements-head h4{font-size:15px;margin:0 0 5px}.tf-pj-secondary{background:#fff!important;color:#334b76!important;border:1px solid #dbe3ef!important;border-radius:8px!important;padding:11px 15px!important;font-size:12px!important;font-weight:750!important;cursor:pointer}.tf-pj-requirements-list{display:flex;flex-direction:column;gap:10px}.tf-pj-requirement-row{display:grid;grid-template-columns:1.4fr 1fr 1fr 38px;gap:12px;align-items:end;padding:14px;border:1px solid #e7edf5;border-radius:10px;background:#fafcff}.tf-pj-remove{height:40px;width:38px;border:1px solid #f1d5d5!important;background:#fff!important;color:#b42318!important;border-radius:8px!important;font-size:21px!important;cursor:pointer}.tf-pj-remove:disabled{opacity:.35;cursor:not-allowed}.tf-pj-form-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:23px}
.tf-pj-list-header{display:flex;align-items:center;justify-content:space-between;gap:12px}.tf-pj-count{background:#eff3ff;color:#365cf0;padding:8px 12px;border-radius:7px;font-size:12px;font-weight:750}.tf-pj-search{display:flex;align-items:center;gap:10px;border:1px solid #dbe3ef;border-radius:9px;padding:0 14px;height:44px;max-width:440px;margin:23px 0}.tf-pj-search span{font-size:25px;color:#93a4bc}.tf-pj-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#17243c;font-size:13px}.tf-pj-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.tf-pj-card{border:1px solid #e2e8f0;border-radius:12px;padding:22px;min-width:0;background:#fff;transition:border-color .2s,box-shadow .2s}.tf-pj-card:hover{border-color:#b9c9f8;box-shadow:0 10px 30px #1a3b7010}.tf-pj-card-top{display:flex;justify-content:space-between;align-items:center}.tf-pj-card-icon{width:42px;height:42px;display:grid;place-items:center;background:#ecf1ff;color:#365cf0;border-radius:10px;font-weight:850;font-size:19px}.tf-pj-status{display:inline-flex;align-items:center;gap:6px;background:#eaf8f1;color:#087b53;padding:6px 10px;border-radius:20px;font-size:11px;font-weight:750}.tf-pj-status span{width:6px;height:6px;background:#12ae7a;border-radius:50%}.tf-pj-card h4{font-size:17px;line-height:1.4;margin:16px 0 7px;color:#15263f}.tf-pj-description{min-height:38px;line-height:1.6;color:#7c8ba1!important}.tf-pj-card-facts{display:flex;flex-wrap:wrap;gap:14px;margin-top:17px;color:#4f6180;font-size:12px;font-weight:700}.tf-pj-card-divider{border-top:1px solid #edf1f6;margin:18px 0}.tf-pj-capability-label{font-size:10px;font-weight:850;letter-spacing:1px;color:#8795a9;margin-bottom:11px}.tf-pj-tags{display:flex;flex-wrap:wrap;gap:7px;min-height:32px}.tf-pj-tag{display:inline-flex;align-items:center;gap:6px;border:1px solid #dce5fa;border-radius:7px;padding:7px 9px;font-size:11px;color:#3658a8;background:#f3f6ff;font-weight:700}.tf-pj-tag small{font-size:9px;opacity:.7}.tf-pj-mandatory{background:#fff5f3;border-color:#ffe0d8;color:#b04b33}.tf-pj-preferred{background:#f2f6ff;border-color:#dce5fa;color:#3658a8}.tf-pj-optional{background:#f5f7f9;border-color:#e4e9f0;color:#60718a}.tf-pj-requirement-note{font-style:italic}.tf-pj-card-bottom{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:19px;padding-top:15px;border-top:1px solid #edf1f6;color:#96a2b4;font-size:11px}.tf-pj-delete{border:0!important;background:transparent!important;color:#bf3c3c!important;font-size:12px!important;font-weight:750!important;cursor:pointer;padding:5px!important}.tf-pj-delete:disabled{opacity:.5;cursor:wait}.tf-pj-empty{text-align:center;padding:35px 10px;color:#8291a7;font-size:13px}.tf-pj-alert{padding:13px 17px;border-radius:9px;font-size:13px}.tf-pj-error{background:#fff1f0;border:1px solid #fecaca;color:#b42318}.tf-pj-success{background:#ecfdf3;border:1px solid #a6f4c5;color:#067647}
/* Professional project card actions */
.tf-pj-card-actions{display:flex;align-items:center;justify-content:flex-end;gap:9px;flex-wrap:wrap}
.tf-pj-card-actions .tf-pj-edit,.tf-pj-card-actions .tf-pj-delete{display:inline-flex;align-items:center;justify-content:center;min-height:35px;padding:8px 13px!important;border-radius:8px!important;font-size:12px!important;font-weight:750!important;line-height:1.2;transition:background-color .18s,border-color .18s,color .18s,box-shadow .18s;cursor:pointer}
.tf-pj-card-actions .tf-pj-edit{background:#eff3ff!important;border:1px solid #ccd8ff!important;color:#3152c9!important}
.tf-pj-card-actions .tf-pj-edit:hover:not(:disabled){background:#365cf5!important;border-color:#365cf5!important;color:#fff!important;box-shadow:0 4px 12px #365cf526}
.tf-pj-card-actions .tf-pj-delete{background:#fff5f5!important;border:1px solid #fbd1d1!important;color:#b42332!important}
.tf-pj-card-actions .tf-pj-delete:hover:not(:disabled){background:#dc2626!important;border-color:#dc2626!important;color:#fff!important}
.tf-pj-card-actions button:disabled{opacity:.55;cursor:not-allowed}
.tf-pj-card-actions button:focus-visible{outline:3px solid #a9b9ff;outline-offset:2px}
@media(max-width:600px){.tf-pj-card-bottom{align-items:flex-start;flex-direction:column}.tf-pj-card-actions{width:100%;justify-content:flex-start}}
@media(max-width:1050px){.tf-pj-grid{grid-template-columns:1fr}}@media(max-width:720px){.tf-pj-toolbar{flex-direction:column;align-items:stretch}.tf-pj-metrics{grid-template-columns:1fr}.tf-pj-form-grid{grid-template-columns:1fr}.tf-pj-requirement-row{grid-template-columns:1fr 1fr}.tf-pj-remove{justify-self:end}.tf-pj-panel{padding:20px}.tf-pj-requirements-head{flex-direction:column;align-items:flex-start}}
`;

export default Projects;
