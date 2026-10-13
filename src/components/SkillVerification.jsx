import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api";

export default function SkillVerification() {
  const [skills, setSkills] = useState([]);
  const [levels, setLevels] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch("/user-skills/pending");
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load pending skills.");
      if (!Array.isArray(data)) throw new Error("Unexpected server response.");
      setSkills(data);
      setLevels((previous) => {
        const next = { ...previous };
        for (const item of data) {
          if (!next[item.id]) next[item.id] = String(item.proficiency);
        }
        return next;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const verify = async (item) => {
    setBusyId(item.id);
    setError("");
    setNotice("");
    try {
      const response = await apiFetch(`/user-skills/${item.id}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedProficiency: Number(levels[item.id]) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not verify skill.");
      setNotice(`${item.skill?.name || "Skill"} verified for ${item.user?.name || "candidate"}.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="tf-overview">
      <section className="tf-panel" style={{ padding: 24 }}>
        <div className="tf-panel-heading" style={{ marginBottom: 20 }}>
          <div>
            <h2>Pending skill approvals</h2>
            <p>Review claimed proficiency and assign an approved level.</p>
          </div>
          <button type="button" className="tf-secondary-action" onClick={load} disabled={loading}>Refresh</button>
        </div>
        {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
        {notice && <p role="status" style={{ color: "#15803d" }}>{notice}</p>}
        {loading ? <p>Loading pending skills...</p> : skills.length === 0 ? (
          <div className="tf-empty-state">No skills are awaiting verification.</div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {skills.map((item) => (
              <div key={item.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 18, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <strong>{item.user?.name || "Candidate"}</strong>
                  <p style={{ margin: "5px 0" }}>{item.skill?.name || "Skill"} · Claimed level: {item.proficiency}/5</p>
                  <small style={{ color: "#b45309" }}>Pending verification</small>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <label htmlFor={`level-${item.id}`}>Approved level</label>
                  <select id={`level-${item.id}`} value={levels[item.id] || String(item.proficiency)} onChange={(event) => setLevels((previous) => ({ ...previous, [item.id]: event.target.value }))} style={{ padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}>
                    {[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{level}/5</option>)}
                  </select>
                  <button type="button" className="tf-primary-action" onClick={() => verify(item)} disabled={busyId !== null}>{busyId === item.id ? "Verifying..." : "Verify Skill"}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <p style={{ marginTop: 16, color: "#64748b" }}>Previously verified skills are not included in this pending queue.</p>
    </div>
  );
}
