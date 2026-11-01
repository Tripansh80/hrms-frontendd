"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export interface PlanLimits {
  employees: number;
  storage_mb: number;
  imports_per_month: number;
  ai_commands_per_month: number;
}

export interface PlanFeatures {
  ai?: boolean;
  workflows?: boolean;
  recruitment?: boolean;
  audit_export?: boolean;
  sso?: boolean;
  [key: string]: boolean | undefined;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  price: string;
  currency: string;
  billing_interval: string;
  limits_json: PlanLimits;
  features_json: PlanFeatures;
}

interface PricingApiResponse {
  plans: Plan[];
}

// Fallback plans if backend server is not running or unreachable
const FALLBACK_PLANS: Plan[] = [
  {
    id: "5b3bae0b-ef01-470c-bddf-835a5ffc39a4",
    code: "free",
    name: "Free",
    price: "0.00",
    currency: "USD",
    billing_interval: "monthly",
    limits_json: {
      employees: 10,
      storage_mb: 250,
      imports_per_month: 2,
      ai_commands_per_month: 25,
    },
    features_json: {
      ai: true,
      workflows: true,
      recruitment: false,
      audit_export: false,
    },
  },
  {
    id: "207ab8a4-ff3f-4239-8c00-543d21349e56",
    code: "growth",
    name: "Growth",
    price: "49.00",
    currency: "USD",
    billing_interval: "monthly",
    limits_json: {
      employees: 100,
      storage_mb: 5000,
      imports_per_month: 20,
      ai_commands_per_month: 500,
    },
    features_json: {
      ai: true,
      workflows: true,
      recruitment: true,
      audit_export: true,
    },
  },
  {
    id: "e9251a83-524b-4020-bbdb-8d4feb4e44a4",
    code: "enterprise",
    name: "Enterprise",
    price: "299.00",
    currency: "USD",
    billing_interval: "monthly",
    limits_json: {
      employees: 5000,
      storage_mb: 100000,
      imports_per_month: 500,
      ai_commands_per_month: 10000,
    },
    features_json: {
      ai: true,
      sso: true,
      workflows: true,
      recruitment: true,
      audit_export: true,
    },
  },
];

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchPricing() {
      setLoading(true);
      setError(null);
      try {
        // Try direct backend or proxied endpoint
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const response = await axios.get<PricingApiResponse>(`${backendUrl}/pricing`, {
          headers: {
            Accept: "*/*",
          },
          timeout: 4000,
        });

        if (isMounted) {
          if (response.data && Array.isArray(response.data.plans)) {
            setPlans(response.data.plans);
          } else {
            setPlans(FALLBACK_PLANS);
          }
          setLoading(false);
        }
      } catch (err: any) {
        console.warn("Failed to fetch from backend /pricing, using fallback data:", err.message);
        if (isMounted) {
          setError(err.message || "Failed to load pricing from server");
          setPlans(FALLBACK_PLANS);
          setIsUsingFallback(true);
          setLoading(false);
        }
      }
    }

    fetchPricing();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "64px 24px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "56px" }}>
        <div
          style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: "999px",
            background: "hsl(var(--primary-soft))",
            color: "hsl(var(--primary))",
            fontSize: "12px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "16px",
          }}
        >
          Simple & Transparent Pricing
        </div>
        <h1
          style={{
            fontSize: "44px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: "16px",
            color: "hsl(var(--text))",
          }}
        >
          Choose the right plan for your team
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: "hsl(var(--text-muted))",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          All plans include our modern UI, fast workflows, and AI assistant capabilities.
        </p>

        {isUsingFallback && (
          <div
            style={{
              marginTop: "20px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "8px",
              background: "hsl(var(--warning-soft))",
              color: "hsl(var(--warning))",
              fontSize: "13px",
            }}
          >
            <span>ℹ️ Showing cached/sample plan data (Backend at http://localhost:8000 unreachable)</span>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid hsl(var(--border))",
              borderTopColor: "hsl(var(--primary))",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "15px" }}>Loading plans from http://localhost:8000/pricing...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        /* Plan Cards Grid */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "28px",
            alignItems: "stretch",
          }}
        >
          {plans.map((plan) => {
            const isPopular = plan.code === "growth";
            const isEnterprise = plan.code === "enterprise";

            return (
              <div
                key={plan.id}
                style={{
                  position: "relative",
                  borderRadius: "16px",
                  border: isPopular
                    ? "2px solid hsl(var(--primary))"
                    : "1px solid hsl(var(--border))",
                  background: "hsl(var(--surface))",
                  padding: "36px 32px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: isPopular
                    ? "0 12px 30px -10px hsla(var(--primary), 0.25)"
                    : "0 4px 12px -2px rgba(0,0,0,0.04)",
                  transform: isPopular ? "scale(1.02)" : "none",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-14px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "hsl(var(--primary))",
                      color: "hsl(var(--primary-fg))",
                      fontSize: "12px",
                      fontWeight: 600,
                      padding: "4px 16px",
                      borderRadius: "999px",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Most Popular
                  </div>
                )}

                {/* Plan Title & Price */}
                <div style={{ marginBottom: "24px" }}>
                  <h3
                    style={{
                      fontSize: "22px",
                      fontWeight: 700,
                      color: "hsl(var(--text))",
                      marginBottom: "6px",
                    }}
                  >
                    {plan.name}
                  </h3>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "12px" }}>
                    <span style={{ fontSize: "18px", fontWeight: 600, color: "hsl(var(--text-muted))" }}>
                      {plan.currency === "USD" ? "$" : plan.currency}
                    </span>
                    <span
                      style={{
                        fontSize: "44px",
                        fontWeight: 700,
                        fontFamily: "monospace",
                        color: "hsl(var(--text))",
                        lineHeight: 1,
                      }}
                    >
                      {parseFloat(plan.price) === 0 ? "0" : plan.price}
                    </span>
                    <span style={{ fontSize: "14px", color: "hsl(var(--text-muted))" }}>
                      /{plan.billing_interval}
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <a
                  href={`/signup?plan=${plan.code}`}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "12px 20px",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: 600,
                    textDecoration: "none",
                    marginBottom: "32px",
                    transition: "all 0.15s ease",
                    background: isPopular
                      ? "hsl(var(--primary))"
                      : "hsl(var(--surface-2))",
                    color: isPopular
                      ? "hsl(var(--primary-fg))"
                      : "hsl(var(--text))",
                    border: isPopular
                      ? "none"
                      : "1px solid hsl(var(--border))",
                  }}
                >
                  {plan.price === "0.00" ? "Start Free" : `Choose ${plan.name}`}
                </a>

                {/* Resource Limits List */}
                <div style={{ borderTop: "1px solid hsl(var(--border))", paddingTop: "24px", marginBottom: "24px" }}>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color: "hsl(var(--text-subtle))",
                      letterSpacing: "0.06em",
                      marginBottom: "14px",
                    }}
                  >
                    Resource Limits
                  </p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                    <li style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ color: "hsl(var(--primary))", fontWeight: "bold" }}>✓</span>
                      <span>
                        Up to <strong>{plan.limits_json.employees.toLocaleString()}</strong> employees
                      </span>
                    </li>
                    <li style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ color: "hsl(var(--primary))", fontWeight: "bold" }}>✓</span>
                      <span>
                        <strong>
                          {plan.limits_json.storage_mb >= 1024
                            ? `${(plan.limits_json.storage_mb / 1024).toFixed(0)} GB`
                            : `${plan.limits_json.storage_mb} MB`}
                        </strong>{" "}
                        document storage
                      </span>
                    </li>
                    <li style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ color: "hsl(var(--primary))", fontWeight: "bold" }}>✓</span>
                      <span>
                        <strong>{plan.limits_json.ai_commands_per_month.toLocaleString()}</strong> AI commands / month
                      </span>
                    </li>
                    <li style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ color: "hsl(var(--primary))", fontWeight: "bold" }}>✓</span>
                      <span>
                        <strong>{plan.limits_json.imports_per_month}</strong> bulk imports / month
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Features List */}
                <div style={{ marginTop: "auto" }}>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color: "hsl(var(--text-subtle))",
                      letterSpacing: "0.06em",
                      marginBottom: "14px",
                    }}
                  >
                    Included Features
                  </p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                    <li style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ color: plan.features_json.ai ? "hsl(var(--primary))" : "hsl(var(--text-subtle))" }}>
                        {plan.features_json.ai ? "✓" : "—"}
                      </span>
                      <span style={{ color: plan.features_json.ai ? "hsl(var(--text))" : "hsl(var(--text-muted))" }}>
                        ✦ AI-powered natural language commands
                      </span>
                    </li>
                    <li style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ color: plan.features_json.workflows ? "hsl(var(--primary))" : "hsl(var(--text-subtle))" }}>
                        {plan.features_json.workflows ? "✓" : "—"}
                      </span>
                      <span style={{ color: plan.features_json.workflows ? "hsl(var(--text))" : "hsl(var(--text-muted))" }}>
                        Custom multi-step approval workflows
                      </span>
                    </li>
                    <li style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ color: plan.features_json.recruitment ? "hsl(var(--primary))" : "hsl(var(--text-subtle))" }}>
                        {plan.features_json.recruitment ? "✓" : "—"}
                      </span>
                      <span style={{ color: plan.features_json.recruitment ? "hsl(var(--text))" : "hsl(var(--text-muted))" }}>
                        Recruitment pipeline & candidate tracking
                      </span>
                    </li>
                    <li style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ color: plan.features_json.audit_export ? "hsl(var(--primary))" : "hsl(var(--text-subtle))" }}>
                        {plan.features_json.audit_export ? "✓" : "—"}
                      </span>
                      <span style={{ color: plan.features_json.audit_export ? "hsl(var(--text))" : "hsl(var(--text-muted))" }}>
                        Audit logs & compliance exports
                      </span>
                    </li>
                    {plan.features_json.sso !== undefined && (
                      <li style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ color: plan.features_json.sso ? "hsl(var(--primary))" : "hsl(var(--text-subtle))" }}>
                          {plan.features_json.sso ? "✓" : "—"}
                        </span>
                        <span style={{ color: plan.features_json.sso ? "hsl(var(--text))" : "hsl(var(--text-muted))" }}>
                          Enterprise Single Sign-On (SAML / OIDC)
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
