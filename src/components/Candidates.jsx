import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../api";

const blankCandidate = () => ({
  name: "", email: "", password: "", preferredRole: "", experienceYears: "", available: true,
});
const blankSkill = () => ({ skillId: "", proficiency: 3 });
const proficiencyLabels = ["", "Beginner", "Basic", "Intermediate", "Advanced", "Expert"];

function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [originalSkills, setOriginalSkills] = useState([]);
  const [candidate, setCandidate] = useState(blankCandidate);
  const [candidateSkills, setCandidateSkills] = useState([blankSkill()]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [notice, setNotice] = useState(null);
  const formRef = useRef(null);

  const loadCandidates = async () => {
    const response = await apiFetch("/users");
    if (!response.ok) throw new Error("Could not load candidate profiles.");
    const users = await response.json();
    if (!Array.isArray(users)) throw new Error("Unexpected candidate response.");
    const enriched = await Promise.all(users.map(async (user) => {
      try {
        const result = await apiFetch(`/user-skills/user/${user.id}`);
        if (!result.ok) return { ...user, skills: [] };
        const skills = await result.json();
        return { ...user, skills: Array.isArray(skills) ? skills : [] };
      } catch {
        return { ...user, skills: [] };
      }
    }));
    setCandidates(enriched);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const skillsResponse = await apiFetch("/skills");
      if (!skillsResponse.ok) throw new Error("Could not load the skill library.");
      const skills = await skillsResponse.json();
      setAvailableSkills(Array.isArray(skills) ? skills : []);
      await loadCandidates();
    } catch (error) {
      setNotice({ type: "error", text: error.message || "Unable to load talent directory." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    if (!showForm || !formRef.current) return;
    const frame = requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [showForm, editingId]);

  const filtered = useMemo(() => candidates.filter((person) => {
    const term = search.trim().toLowerCase();
    const matchesText = !term || [person.name, person.email, person.preferredRole,
      ...(person.skills || []).map((item) => item.skill?.name)]
      .some((value) => String(value || "").toLowerCase().includes(term));
    const matchesAvailability = filter === "all" ||
      (filter === "available" ? person.available : !person.available);
    return matchesText && matchesAvailability;
  }), [candidates, search, filter]);

  const availableCount = candidates.filter((person) => person.available).length;
  const skillsCount = new Set(candidates.flatMap((person) =>
    (person.skills || []).map((item) => item.skill?.id).filter(Boolean))).size;

  const changeField = (event) => {
    const { name, value, type, checked } = event.target;
    setCandidate((previous) => ({ ...previous, [name]: type === "checkbox" ? checked : value }));
  };
  const changeSkill = (index, event) => {
    const { name, value } = event.target;
    setCandidateSkills((previous) => previous.map((item, position) =>
      position === index ? { ...item, [name]: value } : item));
  };
  const resetForm = () => {
    setCandidate(blankCandidate());
    setCandidateSkills([blankSkill()]);
    setOriginalSkills([]);
    setEditingId(null);
    setShowForm(false);
  };

  const startCreate = () => {
    resetForm();
    setNotice(null);
    setShowForm(true);
  };

  const startEdit = (person) => {
    setEditingId(person.id);
    setCandidate({
      name: person.name || "",
      email: person.email || "",
      password: "",
      preferredRole: person.preferredRole || "",
      experienceYears: person.experienceYears ?? 0,
      available: Boolean(person.available),
    });
    const assignments = (person.skills || []).filter((item) => item.skill?.id);
    setOriginalSkills(assignments);
    setCandidateSkills(assignments.length ? assignments.map((item) => ({
      skillId: String(item.skill.id), proficiency: item.proficiency,
    })) : [blankSkill()]);
    setNotice(null);
    setShowForm(true);
  };

  const readError = async (response, fallback) => {
    const body = await response.json().catch(() => ({}));
    return body.message || body.error || fallback;
  };

  const saveCandidate = async (event) => {
    event.preventDefault();
    setNotice(null);
    const selected = candidateSkills.filter((item) => String(item.skillId).trim());
    const ids = selected.map((item) => Number(item.skillId));
    if (new Set(ids).size !== ids.length) {
      setNotice({ type: "error", text: "Choose each skill only once." });
      return;
    }
    if (!candidate.name.trim() || !candidate.email.trim() ||
        (!editingId && !candidate.password) ||
        (candidate.password && candidate.password.length < 8) ||
        candidate.experienceYears === "" ||
        !Number.isInteger(Number(candidate.experienceYears)) ||
        Number(candidate.experienceYears) < 0 || Number(candidate.experienceYears) > 80) {
      setNotice({ type: "error", text: "Check the required fields. Experience must be 0–80 years and any new password must be at least 8 characters." });
      return;
    }
    setSaving(true);
    let savedUser = null;
    try {
      const payload = {
        name: candidate.name.trim(),
        email: candidate.email.trim(),
        preferredRole: candidate.preferredRole.trim(),
        experienceYears: Number(candidate.experienceYears),
        available: candidate.available,
        ...(candidate.password ? { password: candidate.password } : {}),
      };
      const userResponse = await apiFetch(editingId ? `/users/${editingId}` : "/users", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      if (!userResponse.ok) throw new Error(await readError(userResponse, "Could not save candidate profile."));
      savedUser = await userResponse.json();

      // Add new skills and update proficiency for existing assignments.
      for (const item of selected) {
        const skill = availableSkills.find((entry) => entry.id === Number(item.skillId));
        if (!skill) throw new Error("A selected skill is no longer available.");
        const response = await apiFetch("/user-skills", {
          method: "POST",
          body: JSON.stringify({ user: { id: savedUser.id }, skill: { id: skill.id }, proficiency: Number(item.proficiency) }),
        });
        if (!response.ok) throw new Error(await readError(response, `Could not save ${skill.name}.`));
      }

      // Remove only assignments that were deleted from the edit form.
      if (editingId) {
        const selectedIds = new Set(ids);
        for (const old of originalSkills) {
          if (!selectedIds.has(Number(old.skill.id))) {
            const response = await apiFetch(`/user-skills/${old.id}`, { method: "DELETE" });
            if (!response.ok) throw new Error(await readError(response, `Could not remove ${old.skill.name}.`));
          }
        }
      }

      const wasEditing = Boolean(editingId);
      resetForm();
      await loadCandidates();
      setNotice({ type: "success", text: `${savedUser.name} was ${wasEditing ? "updated" : "added"} successfully.` });
    } catch (error) {
      setNotice({ type: "error", text: `${error.message || "Could not save candidate."} Some changes may already have been saved; refresh the profile before trying again.` });
      if (savedUser) await loadCandidates().catch(() => {});
    } finally {
      setSaving(false);
    }
  };

  const deleteCandidate = async (person) => {
    if (!window.confirm(`Delete ${person.name}? This cannot be undone.`)) return;
    setDeletingId(person.id);
    setNotice(null);
    try {
      const response = await apiFetch(`/users/${person.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || "Unable to delete this candidate. They may belong to a project team.");
      }
      await loadCandidates();
      setNotice({ type: "success", text: `${person.name} was removed.` });
    } catch (error) {
      setNotice({ type: "error", text: error.message || "Could not delete candidate." });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="tf-talent">
      <style>{`
        .tf-talent{display:grid;gap:22px;color:#14243e}
        .tf-talent *{box-sizing:border-box}
        .tf-talent button,.tf-talent input,.tf-talent select{font:inherit}
        .tf-talent-hero{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:29px 34px;background:linear-gradient(112deg,#122440,#213e70);border-radius:17px;color:white}
        .tf-talent-eyebrow{display:block;font-size:11px;font-weight:800;letter-spacing:1.6px;color:#aabfff;margin-bottom:13px}
        .tf-talent-hero h2{font-size:27px;letter-spacing:-.8px;margin:0 0 9px;color:white}
        .tf-talent-hero p{font-size:14px;line-height:1.65;color:#d0dcf4;margin:0;max-width:620px}
        .tf-talent-primary{border:0;border-radius:9px;background:#365cf0;color:white;padding:13px 19px;font-size:13px;font-weight:750;cursor:pointer;white-space:nowrap}
        .tf-talent-primary:hover{background:#284bd2}
        .tf-talent-primary:disabled{opacity:.6;cursor:wait}
        .tf-talent-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
        .tf-talent-metric{padding:21px 24px;background:white;border:1px solid #e0e7f2;border-radius:13px}
        .tf-talent-metric span{display:block;font-size:12px;font-weight:750;letter-spacing:.5px;color:#7586a2;text-transform:uppercase}
        .tf-talent-metric strong{display:block;font-size:32px;letter-spacing:-1px;margin:8px 0 4px;color:#14243e}
        .tf-talent-metric small{font-size:12px;color:#8795ac}
        .tf-talent-panel{padding:26px 30px;background:white;border:1px solid #e0e7f2;border-radius:15px}
        .tf-talent-panelhead{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:21px}
        .tf-talent-panelhead h3{font-size:19px;margin:0 0 6px;color:#14243e}
        .tf-talent-panelhead p{font-size:13px;color:#8190a6;margin:0}
        .tf-talent-badge{font-size:12px;font-weight:750;color:#365cf0;background:#eff3ff;border-radius:7px;padding:8px 12px}
        .tf-talent-toolbar{display:flex;gap:12px;margin-bottom:20px}
        .tf-talent-search{flex:1;min-width:0}
        .tf-talent input,.tf-talent select,.tf-talent textarea{border:1px solid #dbe3ef;border-radius:9px;background:white;color:#24324b;outline:0}
        .tf-talent input:focus,.tf-talent select:focus,.tf-talent textarea:focus{border-color:#365cf0;box-shadow:0 0 0 3px #365cf018}
        .tf-talent-toolbar input,.tf-talent-toolbar select{height:44px;padding:0 14px;font-size:13px}
        .tf-talent-toolbar input{width:100%}
        .tf-talent-toolbar select{min-width:155px}
        .tf-talent-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
        .tf-talent-card{border:1px solid #e3eaf4;border-radius:13px;padding:21px;background:#fff;min-width:0;transition:box-shadow .2s,border-color .2s}
        .tf-talent-card:hover{border-color:#c5d4f5;box-shadow:0 8px 28px #162f5310}
        .tf-talent-person{display:flex;align-items:center;gap:12px;min-width:0}
        .tf-talent-avatar{display:grid;place-items:center;flex-shrink:0;width:45px;height:45px;border-radius:12px;background:#edf1ff;color:#365cf0;font-weight:800;font-size:16px}
        .tf-talent-personinfo{min-width:0;flex:1}
        .tf-talent-personinfo h4{margin:0 0 4px;font-size:15px;color:#14243e;overflow-wrap:anywhere}
        .tf-talent-personinfo p{margin:0;font-size:12px;color:#8190a6;overflow-wrap:anywhere}
        .tf-talent-status{white-space:nowrap;border-radius:30px;padding:6px 9px;font-size:11px;font-weight:750;background:#e9f9f1;color:#08734e}
        .tf-talent-status.off{background:#fff1ef;color:#b45345}
        .tf-talent-details{display:flex;flex-wrap:wrap;gap:10px;margin:19px 0 15px;font-size:12px;color:#63758f}
        .tf-talent-details span{padding:7px 10px;background:#f6f8fc;border-radius:7px}
        .tf-talent-skills{display:flex;flex-wrap:wrap;gap:7px;min-height:28px}
        .tf-talent-chip{font-size:11px;color:#3157d8;background:#eef3ff;border:1px solid #dce6ff;padding:6px 9px;border-radius:6px}
        .tf-talent-muted{color:#94a3b8;font-size:12px}
        .tf-talent-cardfoot{display:flex;justify-content:space-between;align-items:center;margin-top:19px;padding-top:14px;border-top:1px solid #eef1f6}
        .tf-talent-cardfoot small{color:#94a3b8;font-size:11px}
        .tf-talent-edit{background:#eef3ff;border:1px solid #dce6ff;border-radius:8px;color:#3157d8;padding:8px 12px;font-size:12px;font-weight:750;cursor:pointer}
        .tf-talent-edit:hover{background:#e2eaff}
        .tf-talent-cardbuttons{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
        .tf-talent-delete{background:transparent;border:1px solid #f4d7d7;border-radius:8px;color:#bd3c3c;padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer}
        .tf-talent-delete:hover{background:#fff2f2}
        .tf-talent-delete:disabled{opacity:.55;cursor:wait}
        .tf-talent-formgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:20px}
        .tf-talent-field{display:flex;flex-direction:column;gap:8px;font-size:12px;font-weight:750;color:#34445e}
        .tf-talent-field input,.tf-talent-field select{width:100%;height:44px;padding:0 13px;font-size:13px;font-weight:400}
        .tf-talent-field.full{grid-column:1/-1}
        .tf-talent-check{display:flex;align-items:center;gap:10px;font-size:13px;color:#34445e;font-weight:650}
        .tf-talent-check input{width:17px;height:17px;accent-color:#365cf0}
        .tf-talent-formskills{margin-top:24px;padding-top:22px;border-top:1px solid #e9eef6}
        .tf-talent-formskillshead{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:15px}
        .tf-talent-formskillshead h4{margin:0;font-size:15px}
        .tf-talent-secondary{border:1px solid #dce4f1;border-radius:9px;padding:10px 13px;background:white;color:#244065;font-size:12px;font-weight:750;cursor:pointer}
        .tf-talent-skillrow{display:grid;grid-template-columns:1.5fr 1fr auto;align-items:end;gap:12px;margin-bottom:12px}
        .tf-talent-formactions{display:flex;justify-content:flex-end;gap:10px;margin-top:22px}
        .tf-talent-notice{padding:13px 16px;border-radius:9px;font-size:13px;border:1px solid #b6e7cb;color:#086e4b;background:#effcf5}
        .tf-talent-notice.error{border-color:#f7c9c9;color:#b42318;background:#fff4f4}
        .tf-talent-empty{text-align:center;padding:38px 15px;color:#8390a5;font-size:13px}
        @media(max-width:950px){.tf-talent-grid{grid-template-columns:1fr}.tf-talent-hero{padding:24px}.tf-talent-panel{padding:22px}}
        @media(max-width:650px){.tf-talent-hero{flex-direction:column;align-items:flex-start}.tf-talent-metrics{grid-template-columns:1fr}.tf-talent-toolbar{flex-direction:column}.tf-talent-formgrid{grid-template-columns:1fr}.tf-talent-skillrow{grid-template-columns:1fr}.tf-talent-panelhead{align-items:flex-start}.tf-talent-person{flex-wrap:wrap}}
      `}</style>

      <section className="tf-talent-hero">
        <div><span className="tf-talent-eyebrow">TALENT INTELLIGENCE</span>
          <h2>Know your people. Build stronger teams.</h2>
          <p>Bring skills, experience, and availability together in one talent directory built for smarter project staffing.</p>
        </div>
        <button className="tf-talent-primary" type="button" onClick={() => { if (showForm) resetForm(); else startCreate(); }}>
          {showForm ? "Close form" : "+ Add candidate"}
        </button>
      </section>

      <div className="tf-talent-metrics">
        <div className="tf-talent-metric"><span>Talent profiles</span><strong>{loading ? "—" : candidates.length}</strong><small>Registered candidates</small></div>
        <div className="tf-talent-metric"><span>Ready to staff</span><strong>{loading ? "—" : availableCount}</strong><small>Currently available</small></div>
        <div className="tf-talent-metric"><span>Skills represented</span><strong>{loading ? "—" : skillsCount}</strong><small>Unique skills across profiles</small></div>
      </div>

      {notice && <div role={notice.type === "error" ? "alert" : "status"} className={`tf-talent-notice ${notice.type === "error" ? "error" : ""}`}>{notice.text}</div>}

      {showForm && (
        <section ref={formRef} className="tf-talent-panel" style={{ scrollMarginTop: "90px" }}>
          <div className="tf-talent-panelhead"><div><h3>{editingId ? "Edit candidate profile" : "Register a candidate"}</h3><p>{editingId ? "Update profile details, skill levels, and availability." : "Capture their profile and skill proficiency for matching."}</p></div></div>
          <form onSubmit={saveCandidate}>
            <div className="tf-talent-formgrid">
              <label className="tf-talent-field">Full name<input name="name" value={candidate.name} onChange={changeField} placeholder="e.g. Priya Sharma" required maxLength={120}/></label>
              <label className="tf-talent-field">Email address<input name="email" type="email" value={candidate.email} onChange={changeField} placeholder="name@example.com" required/></label>
              <label className="tf-talent-field">{editingId ? "New password (optional)" : "Password"}<input name="password" type="password" value={candidate.password} onChange={changeField} autoComplete="new-password" placeholder={editingId ? "Leave blank to keep current password" : "At least 8 characters"} required={!editingId} minLength={8}/></label>
              <label className="tf-talent-field">Preferred role<input name="preferredRole" value={candidate.preferredRole} onChange={changeField} placeholder="e.g. Backend Developer"/></label>
              <label className="tf-talent-field">Experience (years)<input name="experienceYears" type="number" min="0" max="80" value={candidate.experienceYears} onChange={changeField} placeholder="e.g. 3" required/></label>
              <label className="tf-talent-check"><input name="available" type="checkbox" checked={candidate.available} onChange={changeField}/>Available for new projects</label>
            </div>
            <div className="tf-talent-formskills">
              <div className="tf-talent-formskillshead"><h4>Skills & proficiency</h4><button type="button" className="tf-talent-secondary" onClick={() => setCandidateSkills((previous) => [...previous, blankSkill()])}>+ Add skill</button></div>
              {candidateSkills.map((item, index) => (
                <div className="tf-talent-skillrow" key={index}>
                  <label className="tf-talent-field">Skill<select name="skillId" value={item.skillId} onChange={(event) => changeSkill(index, event)}><option value="">Select a skill</option>{availableSkills.map((skill) => <option value={skill.id} key={skill.id}>{skill.name}</option>)}</select></label>
                  <label className="tf-talent-field">Proficiency<select name="proficiency" value={item.proficiency} onChange={(event) => changeSkill(index, event)}>{proficiencyLabels.slice(1).map((label, number) => <option value={number + 1} key={label}>{number + 1} · {label}</option>)}</select></label>
                  <button type="button" className="tf-talent-secondary" disabled={saving} onClick={() => setCandidateSkills((previous) => previous.filter((_, position) => position !== index))} aria-label={`Remove skill row ${index + 1}`}>Remove</button>
                </div>
              ))}
            </div>
            <div className="tf-talent-formactions"><button type="button" className="tf-talent-secondary" onClick={resetForm}>Cancel</button><button type="submit" className="tf-talent-primary" disabled={saving}>{saving ? "Saving changes..." : editingId ? "Save changes →" : "Create candidate →"}</button></div>
          </form>
        </section>
      )}

      <section className="tf-talent-panel">
        <div className="tf-talent-panelhead"><div><h3>Talent directory</h3><p>Find the right expertise across your candidate pool.</p></div><span className="tf-talent-badge">{filtered.length} profiles</span></div>
        <div className="tf-talent-toolbar">
          <div className="tf-talent-search"><input type="search" aria-label="Search candidates" placeholder="Search by name, role, email, or skill..." value={search} onChange={(event) => setSearch(event.target.value)}/></div>
          <select aria-label="Filter availability" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All candidates</option><option value="available">Available</option><option value="unavailable">Unavailable</option></select>
        </div>
        {loading ? <div className="tf-talent-empty">Loading candidate profiles...</div> : filtered.length === 0 ?
          <div className="tf-talent-empty">{candidates.length ? "No candidates match your filters." : "No candidates yet. Add your first candidate above."}</div> :
          <div className="tf-talent-grid">{filtered.map((person) => (
            <article className="tf-talent-card" key={person.id}>
              <div className="tf-talent-person"><div className="tf-talent-avatar">{(person.name || "?").split(/\s+/).slice(0,2).map((part) => part[0] || "").join("").toUpperCase()}</div>
                <div className="tf-talent-personinfo"><h4>{person.name}</h4><p>{person.email}</p></div>
                <span className={`tf-talent-status ${person.available ? "" : "off"}`}>{person.available ? "● Available" : "● Unavailable"}</span>
              </div>
              <div className="tf-talent-details"><span>{person.preferredRole || "Role not specified"}</span><span>{person.experienceYears ?? 0} years experience</span></div>
              <div className="tf-talent-skills">{(person.skills || []).length ? (person.skills || []).map((item) => <span className="tf-talent-chip" key={item.id}>{item.skill?.name || "Skill"} · {item.proficiency}/5</span>) : <span className="tf-talent-muted">No skills assigned yet</span>}</div>
              <div className="tf-talent-cardfoot"><small>{(person.skills || []).length} skills on profile</small><div className="tf-talent-cardbuttons"><button className="tf-talent-edit" type="button" disabled={saving || deletingId !== null} onClick={() => startEdit(person)}>Edit profile</button><button className="tf-talent-delete" type="button" disabled={saving || deletingId !== null} onClick={() => deleteCandidate(person)}>{deletingId === person.id ? "Deleting..." : "Delete profile"}</button></div></div>
            </article>
          ))}</div>
        }
      </section>
    </div>
  );
}

export default Candidates;
