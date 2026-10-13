import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";

const normalizeName = (value) => value.trim().replace(/\s+/g, " ");

async function getApiError(response, fallback) {
  try {
    const body = await response.json();
    if (typeof body?.message === "string" && body.message.trim()) return body.message;
    if (typeof body?.error === "string" && body.error.trim()) return body.error;
  } catch {
    // The API may return an empty or non-JSON error response.
  }
  return fallback;
}

function Skills() {
  const [skills, setSkills] = useState([]);
  const [skillName, setSkillName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSkills = async ({ showLoading = true } = {}) => {
    if (showLoading) setLoading(true);
    try {
      const response = await apiFetch("/skills");
      if (!response.ok) throw new Error(await getApiError(response, "Unable to load the skill library."));
      const data = await response.json();
      setSkills(Array.isArray(data) ? data : []);
      return true;
    } catch (err) {
      setError(err.message || "Failed to load skills.");
      return false;
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const filteredSkills = useMemo(
    () => skills
      .filter((skill) => (skill.name || "").toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [skills, search]
  );

  const addSkill = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const name = normalizeName(skillName);

    if (!name) return setError("Please enter a skill name.");
    if (name.length < 2 || name.length > 60) return setError("Skill name must contain between 2 and 60 characters.");
    if (!/\p{L}/u.test(name)) return setError("Skill name must contain at least one letter.");
    if (!/^[\p{L}\p{N} .+#/_-]+$/u.test(name)) return setError("Skill name contains unsupported characters.");
    if (skills.some((skill) => normalizeName(skill.name || "").toLowerCase() === name.toLowerCase())) {
      return setError(`“${name}” already exists in the skill library.`);
    }

    setSaving(true);
    try {
      const response = await apiFetch("/skills", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error(await getApiError(response, "Unable to add skill."));
      const created = await response.json();
      if (created && created.id != null) {
        setSkills((current) => [...current, created]);
      } else {
        await loadSkills({ showLoading: false });
      }
      setSkillName("");
      setSuccess(`“${name}” was added successfully.`);
    } catch (err) {
      setError(err.message || "Failed to add skill.");
    } finally {
      setSaving(false);
    }
  };

  const deleteSkill = async (skill) => {
    if (deletingId !== null || saving) return;
    const confirmed = window.confirm(
      `Delete “${skill.name}” from the skill library?\n\nDeletion is allowed only if no candidate or project uses this skill.`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(skill.id);
    try {
      const response = await apiFetch(`/skills/${skill.id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await getApiError(response, "Unable to delete this skill."));
      }
      setSkills((current) => current.filter((item) => item.id !== skill.id));
      setSuccess(`“${skill.name}” was deleted successfully.`);
    } catch (err) {
      setError(err.message || "Failed to delete skill.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="tf-skills-page">
      <div className="tf-skills-summary">
        <div>
          <span className="tf-skills-eyebrow">SKILL INVENTORY</span>
          <h2>Manage your skill library</h2>
          <p>Keep skills consistent across candidate profiles, project requirements, and team matching.</p>
        </div>
        <div className="tf-skills-count">
          <strong>{loading ? "—" : skills.length}</strong>
          <span>Total skills</span>
        </div>
      </div>

      {(error || success) && (
        <div className={`tf-skills-message ${error ? "tf-skills-error" : "tf-skills-success"}`} role={error ? "alert" : "status"}>
          <span>{error || success}</span>
          <button type="button" onClick={() => { setError(""); setSuccess(""); }} aria-label="Dismiss message">×</button>
        </div>
      )}

      <section className="tf-skills-panel">
        <div className="tf-skills-panel-heading">
          <div>
            <h3>Add a skill</h3>
            <p>Register a technology or competency. Custom skills are supported.</p>
          </div>
        </div>
        <form className="tf-skills-form" onSubmit={addSkill}>
          <div className="tf-skills-input-group">
            <label htmlFor="new-skill-name">Skill name</label>
            <input
              id="new-skill-name"
              type="text"
              value={skillName}
              onChange={(event) => setSkillName(event.target.value)}
              placeholder="e.g. Kubernetes, Python, C++"
              maxLength={60}
              disabled={saving || deletingId !== null}
              required
            />
          </div>
          <button type="submit" className="tf-skills-add-button" disabled={saving || deletingId !== null}>
            {saving ? "Adding..." : "+ Add skill"}
          </button>
        </form>
        <p className="tf-skills-hint">2–60 characters. Duplicate names are not allowed. Unfamiliar names are permitted for custom skills.</p>
      </section>

      <section className="tf-skills-panel">
        <div className="tf-skills-library-header">
          <div>
            <h3>Skill directory</h3>
            <p>Search skills or remove entries that are no longer used.</p>
          </div>
          <span className="tf-skills-library-count">{filteredSkills.length} skills</span>
        </div>
        <div className="tf-skills-search-wrap">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
          </svg>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search skills..." aria-label="Search skills" />
        </div>

        {loading ? (
          <div className="tf-skills-empty">Loading skill library...</div>
        ) : filteredSkills.length === 0 ? (
          <div className="tf-skills-empty">{search ? "No skills match your search." : "Your skill library is empty. Add your first skill above."}</div>
        ) : (
          <div className="tf-skills-directory">
            {filteredSkills.map((skill) => (
              <div className="tf-skills-directory-item" key={skill.id}>
                <span className="tf-skills-directory-icon">{(skill.name || "S").charAt(0).toUpperCase()}</span>
                <span className="tf-skills-directory-name">{skill.name}</span>
                <span className="tf-skills-directory-status">Registered</span>
                <button
                  type="button"
                  className="tf-skills-delete-button"
                  onClick={() => deleteSkill(skill)}
                  disabled={deletingId !== null || saving}
                  aria-label={`Delete ${skill.name}`}
                  title="Delete if unused"
                >
                  {deletingId === skill.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <style>{`
        .tf-skills-page { display: grid; gap: 18px; }
        .tf-skills-page .tf-skills-summary { padding: 22px 26px; min-height: 0; }
        .tf-skills-page .tf-skills-summary h2 { margin: 7px 0 6px; }
        .tf-skills-page .tf-skills-summary p { margin-bottom: 0; }
        .tf-skills-page .tf-skills-panel { padding: 22px 26px; }
        .tf-skills-page .tf-skills-panel-heading { margin-bottom: 14px; }
        .tf-skills-page .tf-skills-form { align-items: end; }
        .tf-skills-page .tf-skills-hint { font-size: 12px; color: #64748b; margin: 10px 0 0; }
        .tf-skills-page .tf-skills-message { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 0; }
        .tf-skills-page .tf-skills-message button { background: transparent; border: 0; font-size: 22px; cursor: pointer; color: inherit; }
        .tf-skills-page .tf-skills-directory { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .tf-skills-page .tf-skills-directory-item { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .tf-skills-page .tf-skills-directory-name { flex: 1 1 auto; min-width: 0; overflow: visible; white-space: normal; overflow-wrap: anywhere; font-weight: 600; line-height: 1.45; }
        .tf-skills-page .tf-skills-directory-status { flex-shrink: 0; }
        .tf-skills-page .tf-skills-delete-button { flex-shrink: 0; border: 1px solid #fecaca; background: #fff7f7; color: #b91c1c; border-radius: 8px; padding: 7px 12px; font-weight: 600; cursor: pointer; margin-left: 12px; }
        .tf-skills-page .tf-skills-delete-button:hover:not(:disabled) { background: #fee2e2; }
        .tf-skills-page .tf-skills-delete-button:disabled { opacity: .5; cursor: not-allowed; }
        @media (max-width: 900px) { .tf-skills-page .tf-skills-directory { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .tf-skills-page .tf-skills-panel { padding: 18px; } .tf-skills-page .tf-skills-directory-status { display: none; } .tf-skills-page .tf-skills-delete-button { margin-left: 0; } }
      `}</style>
    </div>
  );
}

export default Skills;
