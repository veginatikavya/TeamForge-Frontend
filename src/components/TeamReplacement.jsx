import { useEffect, useState } from "react";
import { apiFetch } from "../api";

const ui = {
  hero: { background: "linear-gradient(120deg,#12233f,#243f73)", color: "#fff", borderRadius: 20, padding: "36px 42px", marginBottom: 30, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20 },
  panel: { background: "#fff", border: "1px solid #dfe7f4", borderRadius: 20, padding: "34px 36px", marginBottom: 28 },
  label: { display: "block", fontSize: 13, fontWeight: 700, color: "#182b49", marginBottom: 10 },
  select: { width: "100%", padding: "17px 18px", border: "1px solid #dce5f3", borderRadius: 12, background: "#fff", color: "#142541", fontSize: 15, boxSizing: "border-box" },
  button: { border: 0, background: "#385af4", color: "#fff", fontWeight: 700, fontSize: 14, borderRadius: 12, padding: "17px 23px", cursor: "pointer" },
  muted: { color: "#7587a5", fontSize: 15 },
  eyebrow: { color: "#385af4", fontWeight: 800, fontSize: 12, letterSpacing: 2, margin: "0 0 14px" },
  title: { color: "#142541", fontSize: 25, margin: "0 0 10px", fontWeight: 800 },
  card: { border: "1px solid #dfe7f4", borderRadius: 18, padding: "30px 32px", background: "#fff" },
};

function TeamReplacement() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await apiFetch("/projects");
        if (!response.ok) throw new Error("Failed to load projects");
        const data = await response.json();
        if (active) {
          setProjects(data);
          if (data.length) setSelectedProjectId(String(data[0].id));
        }
      } catch (err) {
        console.error(err);
        if (active) setError("Unable to load projects. Check that your backend is running.");
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    let active = true;
    (async () => {
      setLoadingMembers(true);
      setTeamMembers([]);
      setSelectedMemberId("");
      setRecommendations([]);
      setHasSearched(false);
      setError("");
      try {
        const response = await apiFetch(`/team-members/project/${selectedProjectId}`);
        if (!response.ok) throw new Error("Failed to load team members");
        const data = await response.json();
        if (active) {
          setTeamMembers(data);
          if (data.length) setSelectedMemberId(String(data[0].id));
        }
      } catch (err) {
        console.error(err);
        if (active) setError("Unable to load team members.");
      } finally {
        if (active) setLoadingMembers(false);
      }
    })();
    return () => { active = false; };
  }, [selectedProjectId]);

  const findReplacements = async () => {
    if (!selectedProjectId || !selectedMemberId) {
      setError("Please select a project and a team member.");
      return;
    }
    setLoading(true);
    setError("");
    setHasSearched(false);
    try {
      const response = await apiFetch(`/team-replacement/project/${selectedProjectId}/member/${selectedMemberId}`);
      if (!response.ok) throw new Error("Failed to fetch replacements");
      setRecommendations(await response.json());
      setHasSearched(true);
    } catch (err) {
      console.error(err);
      setError("Unable to find replacement candidates. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find((p) => String(p.id) === selectedProjectId);
  const selectedMember = teamMembers.find((m) => String(m.id) === selectedMemberId);

  return (
    <div style={{ color: "#142541", width: "100%" }}>
      <section style={ui.hero}>
        <div>
          <p style={{ ...ui.eyebrow, color: "#a9c0ff" }}>WORKFORCE CONTINUITY</p>
          <h2 style={{ fontSize: "clamp(24px,3vw,32px)", fontWeight: 800, margin: "0 0 12px" }}>Find the right replacement, with confidence.</h2>
          <p style={{ margin: 0, color: "#d5e2ff", lineHeight: 1.7 }}>Evaluate available talent against the skill coverage a departing team member would leave behind.</p>
        </div>
        <div aria-hidden="true" style={{ flexShrink: 0, border: "1px solid #ffffff33", background: "#ffffff12", borderRadius: 18, width: 72, height: 72, display: "grid", placeItems: "center", fontSize: 32 }}>✧</div>
      </section>

      <section style={ui.panel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 26 }}>
          <div>
            <h3 style={ui.title}>Find a team member replacement</h3>
            <p style={{ ...ui.muted, margin: 0 }}>Choose a project and the member you want to evaluate replacing.</p>
          </div>
          <span style={{ background: "#edf1ff", color: "#385af4", fontWeight: 800, fontSize: 12, letterSpacing: 1, borderRadius: 10, padding: "12px 15px" }}>REPLACEMENT ANALYSIS</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18, alignItems: "end" }}>
          <div>
            <label htmlFor="replacement-project" style={ui.label}>Project</label>
            <select id="replacement-project" style={ui.select} value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
              <option value="">Select a project</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="replacement-member" style={ui.label}>Member to replace</label>
            <select id="replacement-member" style={ui.select} value={selectedMemberId} disabled={!selectedProjectId || loadingMembers || teamMembers.length === 0} onChange={(e) => { setSelectedMemberId(e.target.value); setRecommendations([]); setHasSearched(false); setError(""); }}>
              <option value="">{loadingMembers ? "Loading members..." : "Select a team member"}</option>
              {teamMembers.map((member) => <option key={member.id} value={member.id}>{member.user?.name || `Member #${member.id}`}</option>)}
            </select>
          </div>
          <button type="button" style={{ ...ui.button, opacity: loading || !selectedMemberId ? 0.55 : 1 }} disabled={loading || !selectedMemberId} onClick={findReplacements}>
            {loading ? "Analyzing..." : "Find replacements →"}
          </button>
        </div>
        {selectedProjectId && !loadingMembers && teamMembers.length === 0 && <p style={{ ...ui.muted, marginBottom: 0 }}>No members assigned yet. Add team members in Team Management first.</p>}
        {error && <p role="alert" style={{ color: "#b42318", background: "#fff2f0", padding: 14, borderRadius: 10, marginBottom: 0 }}>{error}</p>}
      </section>

      {hasSearched && (
        <section style={ui.panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20, paddingBottom: 28, borderBottom: "1px solid #e8edf5", marginBottom: 28 }}>
            <div>
              <p style={ui.eyebrow}>REPLACEMENT RESULTS</p>
              <h3 style={ui.title}>Recommended replacement candidates</h3>
              <p style={{ ...ui.muted, margin: 0 }}>Project: <strong style={{ color: "#142541" }}>{selectedProject?.name}</strong> · Replacing: <strong style={{ color: "#142541" }}>{selectedMember?.user?.name}</strong></p>
            </div>
            <div style={{ background: "#f0f3ff", padding: "17px 25px", borderRadius: 16, textAlign: "center", minWidth: 110 }}>
              <div style={{ fontSize: 29, fontWeight: 800, color: "#385af4" }}>{recommendations.length}</div>
              <div style={{ fontSize: 12, color: "#7587a5" }}>Recommendations</div>
            </div>
          </div>

          <div style={{ padding: "15px 19px", background: "#f3f6fc", borderLeft: "4px solid #385af4", borderRadius: 10, marginBottom: 26, color: "#425775", fontSize: 14, lineHeight: 1.7 }}>
            <strong style={{ color: "#142541" }}>Recommendation only.</strong> No member will be removed or replaced automatically. A high coverage score does not guarantee that every mandatory skill is satisfied.
          </div>

          {recommendations.length === 0 ? (
            <div style={{ ...ui.card, textAlign: "center", padding: 44 }}>
              <h4 style={{ fontSize: 20, margin: "0 0 10px" }}>No suitable replacements found</h4>
              <p style={ui.muted}>No available candidate currently improves the required skill coverage.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,390px),1fr))", gap: 20 }}>
              {recommendations.map((result, index) => {
                const score = Math.min(100, Math.max(0, Number(result.contributionScore) || 0));
                const initials = (result.user?.name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
                return (
                  <article key={result.user?.id ?? index} style={ui.card}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 30 }}>
                      <span style={{ color: "#647796", fontWeight: 800, fontSize: 13 }}>#{index + 1}</span>
                      <span style={{ background: "#eaf0ff", color: "#385af4", width: 54, height: 54, borderRadius: 13, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 18 }}>{initials}</span>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <h4 style={{ margin: "0 0 6px", fontSize: 18 }}>{result.user?.name}</h4>
                        <p style={{ ...ui.muted, margin: 0, fontSize: 13, overflowWrap: "anywhere" }}>{result.user?.email}</p>
                      </div>
                      <span style={{ background: "#e7f8f0", color: "#007d58", padding: "10px 14px", borderRadius: 30, fontSize: 12, fontWeight: 800 }}>● Recommended</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
                      <span style={ui.muted}>Replacement coverage score</span>
                      <strong style={{ fontSize: 24 }}>{score.toFixed(2)}%</strong>
                    </div>
                    <div role="progressbar" aria-label="Replacement coverage score" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} style={{ background: "#e6ebf5", height: 12, borderRadius: 20, overflow: "hidden", marginBottom: 28 }}>
                      <div style={{ height: "100%", width: `${score}%`, background: "linear-gradient(90deg,#385af4,#7089ff)", borderRadius: 20 }} />
                    </div>
                    <div style={{ display: "flex", gap: 32, flexWrap: "wrap", marginBottom: 28 }}>
                      <div><div style={{ ...ui.label, color: "#697f9d", fontSize: 11, letterSpacing: 1 }}>PREFERRED ROLE</div><div>{result.user?.preferredRole || "Not specified"}</div></div>
                      <div><div style={{ ...ui.label, color: "#697f9d", fontSize: 11, letterSpacing: 1 }}>EXPERIENCE</div><div>{result.user?.experienceYears ?? 0} years</div></div>
                    </div>
                    <div style={{ background: "#f4f6fb", borderLeft: "4px solid #385af4", padding: "20px 22px", borderRadius: 12 }}>
                      <strong style={{ fontSize: 14 }}>Why this candidate is recommended</strong>
                      <p style={{ ...ui.muted, lineHeight: 1.7, margin: "12px 0 0" }}>{result.explanation || "Improves project skill coverage."}</p>
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

export default TeamReplacement;
