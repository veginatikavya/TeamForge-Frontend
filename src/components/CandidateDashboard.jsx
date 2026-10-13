import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:8081/api/candidate";

function CandidateDashboard({ user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [proficiency, setProficiency] = useState("3");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activePage, setActivePage] = useState("overview");
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [editedProficiency, setEditedProficiency] = useState("3");
  const [savingEdit, setSavingEdit] = useState(false);

  const apiRequest = async (path, options = {}) => {
    const token = sessionStorage.getItem("teamforge_token");
    if (!token) throw new Error("Your session has expired. Please log in again.");

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Something went wrong.");
    return data;
  };

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileData, skillsData, mySkillsData] = await Promise.all([
        apiRequest("/profile"),
        apiRequest("/available-skills"),
        apiRequest("/skills"),
      ]);
      setProfile(profileData);
      setAvailableSkills(skillsData);
      setMySkills(mySkillsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // Initial dashboard fetch only; identical to the original component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitSkill = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedSkill) {
      setError("Please select a skill.");
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("/skills", {
        method: "POST",
        body: JSON.stringify({
          skillId: Number(selectedSkill),
          proficiency: Number(proficiency),
        }),
      });
      setSuccess("Skill submitted successfully! Waiting for administrator verification.");
      const updatedSkills = await apiRequest("/skills");
      setMySkills(updatedSkills);
      setSelectedSkill("");
      setProficiency("3");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (item) => {
    setEditingSkillId(item.id);
    setEditedProficiency(String(item.proficiency));
    setError("");
    setSuccess("");
  };

  const saveEditedSkill = async (item) => {
    if (savingEdit) return;
    setError("");
    setSuccess("");
    if (Number(editedProficiency) === Number(item.proficiency)) {
      setEditingSkillId(null);
      return;
    }
    setSavingEdit(true);
    try {
      await apiRequest("/skills", {
        method: "POST",
        body: JSON.stringify({
          skillId: Number(item.skill.id),
          proficiency: Number(editedProficiency),
        }),
      });
      const updatedSkills = await apiRequest("/skills");
      setMySkills(updatedSkills);
      setEditingSkillId(null);
      setSuccess(`${item.skill?.name || "Skill"} updated. Your new level is pending admin review; any previously approved level remains active.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const displayName = profile?.name || user?.name || "Candidate";
  const verifiedCount = mySkills.filter((item) => item.verified === true).length;
  const pendingCount = mySkills.filter(
    (item) => item.pendingReview === true || item.verified !== true
  ).length;
  const navItems = [
    { id: "overview", icon: "▦", label: "Overview" },
    { id: "profile", icon: "♙", label: "My Profile" },
    { id: "skills", icon: "✧", label: "My Skills" },
    { id: "projects", icon: "▣", label: "My Projects" },
  ];

  const ProfileCard = () => (
    <section className="tf-candidate-card">
      <div className="tf-candidate-card-heading">
        <div><span className="tf-candidate-eyebrow">PERSONAL DETAILS</span><h2>My Profile</h2></div>
        <span className="tf-candidate-card-icon">♙</span>
      </div>
      <div className="tf-candidate-profile-row"><span>Name</span><strong>{displayName}</strong></div>
      <div className="tf-candidate-profile-row"><span>Email</span><strong>{profile?.email || user?.email || "—"}</strong></div>
      <div className="tf-candidate-profile-row"><span>Preferred Role</span><strong>{profile?.preferredRole || "Not specified"}</strong></div>
      <div className="tf-candidate-profile-row"><span>Experience</span><strong>{profile?.experienceYears == null ? "Not specified" : `${profile.experienceYears} years`}</strong></div>
      <div className="tf-candidate-profile-row"><span>Availability</span><strong className={profile?.available ? "tf-candidate-status-good" : ""}>{profile?.available ? "● Available" : "Unavailable"}</strong></div>
      <div className="tf-candidate-profile-row"><span>Account Type</span><strong>Candidate</strong></div>
    </section>
  );

  const SkillsCard = () => (
    <section className="tf-candidate-card">
      <div className="tf-candidate-card-heading">
        <div><span className="tf-candidate-eyebrow">SKILL MANAGEMENT</span><h2>My Skills</h2></div>
        <span className="tf-candidate-card-icon">✧</span>
      </div>
      <p className="tf-candidate-muted">Submit skills for administrator review. Only approved proficiency levels count toward project matching.</p>
      <form className="tf-candidate-skill-form" onSubmit={handleSubmitSkill}>
        <label htmlFor="candidate-skill">Select Skill</label>
        <select id="candidate-skill" value={selectedSkill} onChange={(event) => setSelectedSkill(event.target.value)} required>
          <option value="">-- Choose a skill --</option>
          {availableSkills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
        </select>
        <label htmlFor="candidate-proficiency">Your Proficiency</label>
        <select id="candidate-proficiency" value={proficiency} onChange={(event) => setProficiency(event.target.value)}>
          <option value="1">1 - Beginner</option>
          <option value="2">2 - Basic</option>
          <option value="3">3 - Intermediate</option>
          <option value="4">4 - Advanced</option>
          <option value="5">5 - Expert</option>
        </select>
        <button type="submit" className="tf-candidate-primary-button" disabled={submitting || availableSkills.length === 0}>
          {submitting ? "Submitting..." : "+ Submit Skill"}
        </button>
      </form>
      <div className="tf-candidate-subheading"><h3>Submitted Skills</h3><span>{mySkills.length} total</span></div>
      {mySkills.length === 0 ? (
        <p className="tf-candidate-muted">No skills submitted yet.</p>
      ) : (
        <div className="tf-candidate-skill-list">
          {mySkills.map((item) => {
            const verified = item.verified === true;
            const pending = item.pendingReview === true || !verified;
            const editing = editingSkillId === item.id;
            return (
              <div className="tf-candidate-skill-item" key={item.id}>
                <div className="tf-candidate-skill-top">
                  <strong>{item.skill?.name || "Unknown Skill"}</strong>
                  <span className={pending ? "tf-candidate-pill tf-candidate-pill-wait" : "tf-candidate-pill tf-candidate-pill-good"}>
                    {pending ? (verified ? "⏳ Update Pending Review" : "⏳ Pending Verification") : "✓ Verified"}
                  </span>
                </div>
                <p>Claimed level: <strong>{item.proficiency}/5</strong></p>
                {verified && <p>Approved level: <strong>{item.approvedProficiency}/5</strong>{pending && " (still active for matching)"}</p>}
                {editing ? (
                  <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
                    <label htmlFor={`edit-skill-${item.id}`} style={{ fontWeight: 600 }}>New level</label>
                    <select
                      id={`edit-skill-${item.id}`}
                      aria-label={`New proficiency for ${item.skill?.name || "skill"}`}
                      value={editedProficiency}
                      onChange={(event) => setEditedProficiency(event.target.value)}
                      disabled={savingEdit}
                      style={{ padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 8, background: "white" }}
                    >
                      <option value="1">1 - Beginner</option>
                      <option value="2">2 - Basic</option>
                      <option value="3">3 - Intermediate</option>
                      <option value="4">4 - Advanced</option>
                      <option value="5">5 - Expert</option>
                    </select>
                    <button type="button" className="tf-candidate-primary-button" onClick={() => saveEditedSkill(item)} disabled={savingEdit} style={{ padding: "9px 14px" }}>
                      {savingEdit ? "Saving..." : "Save Changes"}
                    </button>
                    <button type="button" onClick={() => setEditingSkillId(null)} disabled={savingEdit} style={{ padding: "9px 14px", border: "1px solid #cbd5e1", borderRadius: 8, background: "white", color: "#334155", cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditing(item)}
                    disabled={savingEdit}
                    style={{ marginTop: 10, padding: "8px 14px", border: "1px solid #bfdbfe", borderRadius: 8, background: "#eff6ff", color: "#1d4ed8", fontWeight: 600, cursor: "pointer" }}
                  >
                    ✎ Edit Proficiency
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  const ProjectsCard = () => (
    <section className="tf-candidate-card">
      <div className="tf-candidate-card-heading">
        <div><span className="tf-candidate-eyebrow">PROJECT WORKSPACE</span><h2>My Assigned Projects</h2></div>
        <span className="tf-candidate-card-icon">▣</span>
      </div>
      <p className="tf-candidate-muted">Projects assigned to you by your administrator will appear here.</p>
      <div className="tf-candidate-empty-state"><span>▣</span><strong>No assignments displayed yet</strong><p>Your project assignments will appear here when available.</p></div>
    </section>
  );

  const titles = {
    overview: "My Workspace",
    profile: "My Profile",
    skills: "My Skills",
    projects: "My Projects",
  };

  return (
    <div className="tf-candidate-layout">
      <aside className="tf-candidate-sidebar">
        <div className="tf-candidate-brand"><div className="tf-candidate-brand-icon">T</div><div><strong>TeamForge</strong><small>TEAM INTELLIGENCE</small></div></div>
        <div className="tf-candidate-sidebar-label">CANDIDATE WORKSPACE</div>
        <nav className="tf-candidate-nav" aria-label="Candidate navigation">
          {navItems.map((item) => (
            <button key={item.id} type="button" className={activePage === item.id ? "tf-candidate-nav-item active" : "tf-candidate-nav-item"} onClick={() => { setActivePage(item.id); setError(""); setSuccess(""); }}>
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="tf-candidate-sidebar-bottom"><span>✧</span><div><strong>Grow your skills</strong><small>Build your professional profile</small></div></div>
      </aside>

      <div className="tf-candidate-main">
        <header className="tf-candidate-topbar">
          <div className="tf-candidate-breadcrumb">Workspace <span>›</span> <strong>{titles[activePage]}</strong></div>
          <div className="tf-candidate-top-actions"><span className="tf-candidate-online">● &nbsp;Workspace</span><span className="tf-candidate-avatar">{displayName.slice(0, 1).toUpperCase()}</span><strong>{displayName}</strong><button type="button" onClick={onLogout} className="tf-candidate-logout">Logout</button></div>
        </header>

        <main className="tf-candidate-content">
          <div className="tf-candidate-page-intro"><span className="tf-candidate-eyebrow">TEAMFORGE WORKSPACE</span><h1>{activePage === "overview" ? `Welcome, ${displayName}!` : titles[activePage]}</h1><p>{activePage === "overview" ? "Manage your professional profile, track your skills, and view project assignments." : "Your personal workspace for verified skills and project information."}</p></div>
          {error && <div className="tf-candidate-alert tf-candidate-alert-error" role="alert">{error}</div>}
          {success && <div className="tf-candidate-alert tf-candidate-alert-success" role="status">{success}</div>}
          {loading ? <p className="tf-candidate-muted">Loading your dashboard...</p> : (
            <>
              {activePage === "overview" && (
                <>
                  <div className="tf-candidate-stats">
                    <div className="tf-candidate-stat"><span>Skills Submitted</span><strong>{mySkills.length}</strong><small>Skills on your profile</small></div>
                    <div className="tf-candidate-stat"><span>Verified Skills</span><strong>{verifiedCount}</strong><small>Administrator approved</small></div>
                    <div className="tf-candidate-stat"><span>Pending Review</span><strong>{pendingCount}</strong><small>Awaiting verification or review</small></div>
                  </div>
                  <div className="tf-candidate-grid"><ProfileCard /><SkillsCard /><ProjectsCard /></div>
                </>
              )}
              {activePage === "profile" && <div className="tf-candidate-single"><ProfileCard /></div>}
              {activePage === "skills" && <div className="tf-candidate-single"><SkillsCard /></div>}
              {activePage === "projects" && <div className="tf-candidate-single"><ProjectsCard /></div>}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default CandidateDashboard;
