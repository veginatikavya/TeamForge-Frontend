import { useEffect, useState } from "react";
import "./App.css";

import { apiFetch } from "./api";

import Login from "./components/Login";
import CandidateDashboard from "./components/CandidateDashboard";
import Candidates from "./components/Candidates";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import TeamMatching from "./components/TeamMatching";
import TeamFormation from "./components/TeamFormation";
import CapabilityGaps from "./components/CapabilityGaps";
import TeamRecommendations from "./components/TeamRecommendations";
import AutomaticTeamFormation from "./components/AutomaticTeamFormation";
import TeamReplacement from "./components/TeamReplacement";
import SkillVerification from "./components/SkillVerification";

const navigation = [
  {
    label: "Workspace",
    items: [
      { id: "dashboard", label: "Overview", icon: "overview" },
      { id: "projects", label: "Projects", icon: "projects" },
      { id: "candidates", label: "Candidates", icon: "candidates" },
      { id: "skills", label: "Skill Library", icon: "skills" },
      { id: "verification", label: "Skill Verification", icon: "skills" },
    ],
  },
  {
    label: "Team Intelligence",
    items: [
      { id: "matching", label: "Candidate Matching", icon: "matching" },
      { id: "formation", label: "Team Management", icon: "formation" },
      { id: "automatic-team", label: "Auto Team Builder", icon: "automatic" },
      { id: "gaps", label: "Capability Gaps", icon: "gaps" },
      {
        id: "recommendations",
        label: "Recommendations",
        icon: "recommendations",
      },
      { id: "replacement", label: "Team Replacement", icon: "replacement" },
    ],
  },
];

const pageDetails = {
  dashboard: {
    title: "Overview",
    subtitle: "Your workspace at a glance",
  },
  projects: {
    title: "Projects",
    subtitle: "Manage projects and their skill requirements",
  },
  candidates: {
    title: "Candidates",
    subtitle: "Manage talent profiles and availability",
  },
  skills: {
    title: "Skill Library",
    subtitle: "Manage your organization's skill inventory",
  },
  verification: {
    title: "Skill Verification",
    subtitle: "Review and approve candidate skill submissions",
  },
  matching: {
    title: "Candidate Matching",
    subtitle: "Evaluate candidates against project requirements",
  },
  formation: {
    title: "Team Management",
    subtitle: "Manage project teams and their members",
  },
  "automatic-team": {
    title: "Automatic Team Builder",
    subtitle: "Generate teams using skill and capacity constraints",
  },
  gaps: {
    title: "Capability Gaps",
    subtitle: "Identify missing and underrepresented skills",
  },
  recommendations: {
    title: "Team Recommendations",
    subtitle: "Find candidates who improve team coverage",
  },
  replacement: {
    title: "Team Replacement",
    subtitle: "Find suitable replacements for existing members",
  },
};

function Icon({ name, size = 20 }) {
  const paths = {
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    projects: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 5V3h8v2M3 11h18" />
      </>
    ),
    candidates: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5" />
      </>
    ),
    skills: (
      <>
        <path d="m12 2 2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2Z" />
        <path d="m19 18 1 2.5L22.5 21l-2.5 1-1 2.5" />
      </>
    ),
    matching: (
      <>
        <circle cx="7" cy="7" r="3" />
        <circle cx="17" cy="17" r="3" />
        <path d="m10 9 4 5M14 7h7M17.5 3.5v7" />
      </>
    ),
    formation: (
      <>
        <circle cx="12" cy="7" r="3" />
        <circle cx="5" cy="10" r="2" />
        <circle cx="19" cy="10" r="2" />
        <path d="M6 21v-2a6 6 0 0 1 12 0v2M1 19v-2a4 4 0 0 1 4-4M23 19v-2a4 4 0 0 0-4-4" />
      </>
    ),
    automatic: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="m13 6-5 7h4l-1 5 5-7h-4l1-5Z" />
      </>
    ),
    gaps: (
      <>
        <path d="M4 20V12M10 20V7M16 20V4M22 20V10" />
        <path d="M2 20h20" />
      </>
    ),
    recommendations: (
      <>
        <path d="m12 3 2.7 5.5L21 9.4l-4.5 4.4 1.1 6.2L12 17.1 6.4 20l1.1-6.2L3 9.4l6.3-.9L12 3Z" />
      </>
    ),
    replacement: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5.5 9A8 8 0 0 1 19 7l1 5M4 12l1 5a8 8 0 0 0 13.5-2" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    logout: (
      <>
        <path d="M10 17l5-5-5-5M15 12H3" />
        <path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6" />
      </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="M5 5l14 14M19 5 5 19" />,
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5.5 9A8 8 0 0 1 19 7M18.5 15A8 8 0 0 1 5 17" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.overview}
    </svg>
  );
}

function Dashboard({ onNavigate }) {
  const [data, setData] = useState({
    projects: [],
    candidates: [],
    skills: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const [projectsResponse, usersResponse, skillsResponse] =
        await Promise.all([
          apiFetch("/projects"),
          apiFetch("/users"),
          apiFetch("/skills"),
        ]);

      if (
        !projectsResponse.ok ||
        !usersResponse.ok ||
        !skillsResponse.ok
      ) {
        throw new Error("Unable to load dashboard information.");
      }

      const [projects, candidates, skills] = await Promise.all([
        projectsResponse.json(),
        usersResponse.json(),
        skillsResponse.json(),
      ]);

      setData({
        projects: Array.isArray(projects) ? projects : [],
        candidates: Array.isArray(candidates) ? candidates : [],
        skills: Array.isArray(skills) ? skills : [],
      });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const availableCandidates = data.candidates.filter(
    (candidate) => candidate.available === true
  ).length;

  const stats = [
    {
      label: "Total Projects",
      value: data.projects.length,
      icon: "projects",
      detail: "Projects in your workspace",
    },
    {
      label: "Total Candidates",
      value: data.candidates.length,
      icon: "candidates",
      detail: "Registered talent profiles",
    },
    {
      label: "Available Talent",
      value: availableCandidates,
      icon: "formation",
      detail: "Candidates available for teams",
    },
    {
      label: "Skills Tracked",
      value: data.skills.length,
      icon: "skills",
      detail: "Skills in your library",
    },
  ];

  return (
    <div className="tf-overview">
      <div className="tf-page-intro">
        <div>
          <div className="tf-eyebrow">WORKSPACE OVERVIEW</div>
          <h1>Build better teams, with confidence.</h1>
          <p>
            Turn project requirements into informed team decisions
            with skill-based matching and capability analysis.
          </p>
        </div>

        <button
          type="button"
          className="tf-primary-action"
          onClick={() => onNavigate("projects")}
        >
          <Icon name="projects" size={18} />
          New project
          <Icon name="arrow" size={17} />
        </button>
      </div>

      {error && (
        <div className="tf-error-panel" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadDashboard}>
            Try again
          </button>
        </div>
      )}

      <div className="tf-stats-grid">
        {stats.map((stat) => (
          <div className="tf-stat-card" key={stat.label}>
            <div className="tf-stat-top">
              <span>{stat.label}</span>
              <div className="tf-stat-icon">
                <Icon name={stat.icon} size={20} />
              </div>
            </div>

            <strong>{loading ? "—" : stat.value}</strong>
            <small>{stat.detail}</small>
          </div>
        ))}
      </div>

      <div className="tf-content-grid">
        <section className="tf-panel tf-project-panel">
          <div className="tf-panel-heading">
            <div>
              <h2>Project workspace</h2>
              <p>Pick up where your team left off.</p>
            </div>

            <button
              type="button"
              className="tf-text-action"
              onClick={() => onNavigate("projects")}
            >
              View all <Icon name="arrow" size={16} />
            </button>
          </div>

          {loading ? (
            <div className="tf-empty-state">Loading projects...</div>
          ) : data.projects.length === 0 ? (
            <div className="tf-empty-state">
              <h3>No projects yet</h3>
              <p>Create your first project to start matching candidates.</p>
              <button
                type="button"
                className="tf-secondary-action"
                onClick={() => onNavigate("projects")}
              >
                Create project
              </button>
            </div>
          ) : (
            <div className="tf-project-list">
              {data.projects.slice(0, 5).map((project) => (
                <button
                  type="button"
                  className="tf-project-row"
                  key={project.id}
                  onClick={() => onNavigate("projects")}
                >
                  <div className="tf-project-avatar">
                    {(project.name || "P").slice(0, 1).toUpperCase()}
                  </div>

                  <div className="tf-project-info">
                    <strong>{project.name || "Untitled project"}</strong>
                    <span>
                      Team capacity: {project.teamSize ?? "Not set"}
                    </span>
                  </div>

                  <span className="tf-project-status">Active</span>
                  <Icon name="chevron" size={18} />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="tf-panel tf-insights-panel">
          <div className="tf-panel-heading">
            <div>
              <h2>Team intelligence</h2>
              <p>Make every team decision count.</p>
            </div>
          </div>

          <div className="tf-intelligence-list">
            <button
              type="button"
              className="tf-intelligence-item"
              onClick={() => onNavigate("automatic-team")}
            >
              <span className="tf-intelligence-icon">
                <Icon name="automatic" size={21} />
              </span>
              <span>
                <strong>Generate an optimal team</strong>
                <small>Build a team around required skills.</small>
              </span>
              <Icon name="chevron" size={18} />
            </button>

            <button
              type="button"
              className="tf-intelligence-item"
              onClick={() => onNavigate("matching")}
            >
              <span className="tf-intelligence-icon">
                <Icon name="matching" size={21} />
              </span>
              <span>
                <strong>Explore candidate matches</strong>
                <small>Compare talent against project needs.</small>
              </span>
              <Icon name="chevron" size={18} />
            </button>

            <button
              type="button"
              className="tf-intelligence-item"
              onClick={() => onNavigate("gaps")}
            >
              <span className="tf-intelligence-icon">
                <Icon name="gaps" size={21} />
              </span>
              <span>
                <strong>Analyze capability gaps</strong>
                <small>Find missing skills before delivery.</small>
              </span>
              <Icon name="chevron" size={18} />
            </button>
          </div>
        </section>
      </div>

      <section className="tf-workflow">
        <div className="tf-workflow-heading">
          <div>
            <div className="tf-eyebrow">HOW TEAMFORGE WORKS</div>
            <h2>From project brief to the right team.</h2>
          </div>
          <p>
            A connected workflow powered by your project's requirements
            and candidate skill data.
          </p>
        </div>

        <div className="tf-workflow-grid">
          {[
            {
              number: "01",
              title: "Define requirements",
              description:
                "Set project priorities, proficiency levels, and team capacity.",
              page: "projects",
            },
            {
              number: "02",
              title: "Evaluate talent",
              description:
                "Match candidates using weighted skills and mandatory constraints.",
              page: "matching",
            },
            {
              number: "03",
              title: "Build the team",
              description:
                "Generate a team suggestion within project size limits.",
              page: "automatic-team",
            },
            {
              number: "04",
              title: "Close skill gaps",
              description:
                "Analyze coverage and find candidates who improve capability.",
              page: "gaps",
            },
          ].map((step) => (
            <button
              type="button"
              className="tf-workflow-step"
              key={step.number}
              onClick={() => onNavigate(step.page)}
            >
              <span className="tf-workflow-number">{step.number}</span>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
              <span className="tf-workflow-link">
                Open module <Icon name="arrow" size={16} />
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [loggedInUser, setLoggedInUser] = useState(() => {
    const token = sessionStorage.getItem("teamforge_token");
    const savedUser = sessionStorage.getItem("teamforge_user");

    if (!token || !savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      sessionStorage.removeItem("teamforge_token");
      sessionStorage.removeItem("teamforge_user");
      return null;
    }
  });

  const navigate = (page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleLogin = (user) => {
    setLoggedInUser(user);
    navigate("dashboard");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("teamforge_token");
    sessionStorage.removeItem("teamforge_user");

    setLoggedInUser(null);
    navigate("dashboard");
  };

  if (!loggedInUser) {
    return <Login onLogin={handleLogin} />;
  }

  if (loggedInUser.role === "CANDIDATE") {
    return (
      <CandidateDashboard
        user={loggedInUser}
        onLogout={handleLogout}
      />
    );
  }

  if (loggedInUser.role !== "ADMIN") {
    return (
      <div className="app">
        <main className="dashboard">
          <h2>Access Denied</h2>
          <p>Your account does not have a valid role.</p>
          <button
            type="button"
            className="save-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </main>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "projects":
        return <Projects onBack={() => navigate("dashboard")} />;

      case "candidates":
        return <Candidates onBack={() => navigate("dashboard")} />;

      case "skills":
        return <Skills onBack={() => navigate("dashboard")} />;

      case "verification":
        return <SkillVerification />;

      case "matching":
        return <TeamMatching onBack={() => navigate("dashboard")} />;

      case "formation":
        return <TeamFormation onBack={() => navigate("dashboard")} />;

      case "gaps":
        return <CapabilityGaps onBack={() => navigate("dashboard")} />;

      case "recommendations":
        return <TeamRecommendations onBack={() => navigate("dashboard")} />;

      case "automatic-team":
        return (
          <AutomaticTeamFormation
            onBack={() => navigate("dashboard")}
          />
        );

      case "replacement":
        return <TeamReplacement onBack={() => navigate("dashboard")} />;

      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  const activePage = pageDetails[currentPage] || pageDetails.dashboard;

  const initials = (loggedInUser.name || "User")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="tf-app-shell">
      {mobileMenuOpen && (
        <button
          type="button"
          className="tf-mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`tf-sidebar ${mobileMenuOpen ? "tf-sidebar-open" : ""}`}
      >
        <div className="tf-brand">
          <div className="tf-brand-symbol">T</div>
          <div>
            <strong>TeamForge</strong>
            <span>TEAM INTELLIGENCE</span>
          </div>
        </div>

        <div className="tf-sidebar-body">
          {navigation.map((group) => (
            <div className="tf-nav-group" key={group.label}>
              <div className="tf-nav-label">{group.label}</div>

              {group.items.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`tf-nav-item ${
                    currentPage === item.id ? "tf-nav-active" : ""
                  }`}
                  onClick={() => navigate(item.id)}
                  aria-current={
                    currentPage === item.id ? "page" : undefined
                  }
                >
                  <Icon name={item.icon} size={19} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="tf-sidebar-footer">
          <div className="tf-sidebar-footer-icon">
            <Icon name="automatic" size={20} />
          </div>
          <div>
            <strong>Intelligent team building</strong>
            <span>Powered by skill-based matching</span>
          </div>
        </div>
      </aside>

      <div className="tf-main-shell">
        <header className="tf-topbar">
          <div className="tf-topbar-left">
            <button
              type="button"
              className="tf-mobile-menu-button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Icon name="menu" size={23} />
            </button>

            <div className="tf-breadcrumb">
              <span>Workspace</span>
              <Icon name="chevron" size={15} />
              <strong>{activePage.title}</strong>
            </div>
          </div>

          <div className="tf-topbar-right">
            <span className="tf-system-status">
              <span className="tf-status-dot" />
              Workspace
            </span>

            <div className="tf-user-profile">
              <span className="tf-user-avatar">{initials}</span>
              <span className="tf-user-name">
                {loggedInUser.name || "User"}
              </span>
            </div>

            <button
              type="button"
              className="tf-logout-button"
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
            >
              <Icon name="logout" size={19} />
            </button>
          </div>
        </header>

        <main className="tf-main-content">
          {currentPage !== "dashboard" && (
            <div className="tf-module-heading">
              <div>
                <div className="tf-eyebrow">TEAMFORGE WORKSPACE</div>
                <h1>{activePage.title}</h1>
                <p>{activePage.subtitle}</p>
              </div>

              <button
                type="button"
                className="tf-back-link"
                onClick={() => navigate("dashboard")}
              >
                <Icon name="overview" size={17} />
                Overview
              </button>
            </div>
          )}

          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;