import { useState } from "react";
import { apiFetch } from "../api";

function Login({ onLogin }) {
  const [email, setEmail] = useState("demo@teamforge.com");
  const [password, setPassword] = useState("YOUR_DEMO_PASSWORD");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password.");
      }

      if (!data.token) {
        throw new Error("Authentication token was not received.");
      }

      if (!["ADMIN", "CANDIDATE"].includes(data.role)) {
        throw new Error("Invalid account role.");
      }

      const user = {
        id: data.accountId,
        name: data.name,
        email: data.email,
        role: data.role,
      };

      sessionStorage.setItem("teamforge_token", data.token);
      sessionStorage.setItem(
        "teamforge_user",
        JSON.stringify(user)
      );

      onLogin(user);
    } catch (err) {
      setError(err.message || "Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tf-login-page">

      {/* LEFT BRANDING PANEL */}
      <div className="tf-login-brand">

        <div className="tf-login-logo">
          <div className="tf-login-logo-icon">T</div>

          <div>
            <h2>TeamForge</h2>
            <span>TEAM INTELLIGENCE PLATFORM</span>
          </div>
        </div>

        <div className="tf-login-brand-content">

          <div className="tf-login-badge">
            INTELLIGENT WORKFORCE MANAGEMENT
          </div>

          <h1>
            Build stronger teams.
            <br />
            <span>Make smarter decisions.</span>
          </h1>

          <p>
            Transform the way organizations discover talent,
            evaluate skills, and build high-performing teams.
          </p>

          <div className="tf-login-features">

            <div className="tf-login-feature">
              <div className="tf-login-feature-icon">✓</div>
              <div>
                <strong>Intelligent Skill Matching</strong>
                <span>
                  Match verified skills with project requirements.
                </span>
              </div>
            </div>

            <div className="tf-login-feature">
              <div className="tf-login-feature-icon">✓</div>
              <div>
                <strong>Automatic Team Formation</strong>
                <span>
                  Build balanced teams based on skill coverage.
                </span>
              </div>
            </div>

            <div className="tf-login-feature">
              <div className="tf-login-feature-icon">✓</div>
              <div>
                <strong>Skill Gap Intelligence</strong>
                <span>
                  Identify missing capabilities and improve planning.
                </span>
              </div>
            </div>

          </div>
        </div>

        <div className="tf-login-brand-footer">
          © 2026 TeamForge · Intelligent Team Building
        </div>

      </div>

      {/* RIGHT LOGIN PANEL */}
      <div className="tf-login-form-side">

        <div className="tf-login-form-container">

          <div className="tf-login-form-header">

            <div className="tf-login-welcome-badge">
              WELCOME TO TEAMFORGE
            </div>

            <h1>Welcome back</h1>

            <p>
              Sign in to access your TeamForge workspace.
            </p>

          </div>

          <form onSubmit={handleSubmit}>

            <div className="tf-login-field">

              <label htmlFor="login-email">
                Email Address
              </label>

              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter your email address"
                autoComplete="email"
                required
              />

            </div>

            <div className="tf-login-field">

              <label htmlFor="login-password">
                Password
              </label>

              <div className="tf-login-password-wrapper">

                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="tf-login-password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

            </div>

            {error && (
              <div
                className="tf-login-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="tf-login-submit"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In →"}
            </button>

          </form>

          <div className="tf-login-info">

            <div className="tf-login-info-icon">
              i
            </div>

            <p>
              Candidate accounts are created and managed
              by your organization administrator.
            </p>

          </div>

          <div className="tf-login-bottom">
            Secure access to your TeamForge workspace
          </div>

        </div>

      </div>
    </div>
  );
}

export default Login;
