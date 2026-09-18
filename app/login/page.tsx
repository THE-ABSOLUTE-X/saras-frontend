"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    // Demo credentials for SARAS MVP
    const validUsername = "admin";
    const validPassword = "saras123";

    if (username === validUsername && password === validPassword) {
      // Store simple login state for the MVP
      sessionStorage.setItem("saras_authenticated", "true");

      router.push("/dashboard");
    } else {
      setError("Invalid username or password.");
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #172554 0%, #020617 45%, #000000 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
        }}
      >
        {/* SARAS Branding */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              letterSpacing: "7px",
              color: "#22d3ee",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            S A R A S
          </div>

          <div
            style={{
              fontSize: "14px",
              color: "#94a3b8",
              letterSpacing: "1px",
            }}
          >
            SEARCH & RESCUE AUTONOMOUS SYSTEM
          </div>
        </div>

        {/* Login Card */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.96)",
            border: "1px solid rgba(71, 85, 105, 0.5)",
            borderRadius: "18px",
            padding: "34px",
            boxShadow: "0 25px 70px rgba(0, 0, 0, 0.45)",
          }}
        >
          <div style={{ marginBottom: "26px" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: 700,
              }}
            >
              Operator Login
            </h1>

            <p
              style={{
                marginTop: "8px",
                marginBottom: 0,
                color: "#94a3b8",
                fontSize: "14px",
              }}
            >
              Sign in to access the SARAS operator center.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            {/* Username */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="username"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  color: "#cbd5e1",
                }}
              >
                Username
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px 14px",
                  borderRadius: "10px",
                  border: "1px solid #334155",
                  background: "#020617",
                  color: "white",
                  outline: "none",
                  fontSize: "15px",
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  color: "#cbd5e1",
                }}
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px 14px",
                  borderRadius: "10px",
                  border: "1px solid #334155",
                  background: "#020617",
                  color: "white",
                  outline: "none",
                  fontSize: "15px",
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  marginBottom: "18px",
                  padding: "11px 12px",
                  borderRadius: "9px",
                  background: "rgba(127, 29, 29, 0.3)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#fca5a5",
                  fontSize: "13px",
                }}
              >
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                border: "none",
                borderRadius: "10px",
                background: loading ? "#475569" : "#06b6d4",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "0.2s",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Demo credentials */}
          <div
            style={{
              marginTop: "22px",
              paddingTop: "18px",
              borderTop: "1px solid #1e293b",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#64748b",
                marginBottom: "6px",
              }}
            >
              SARAS MVP Demo Access
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "#94a3b8",
              }}
            >
              Username: <strong style={{ color: "#cbd5e1" }}>admin</strong>
              {"  •  "}
              Password:{" "}
              <strong style={{ color: "#cbd5e1" }}>saras123</strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "22px",
            fontSize: "11px",
            color: "#475569",
          }}
        >
          SARAS-01 • Operator Control System
        </div>
      </div>
    </main>
  );
}