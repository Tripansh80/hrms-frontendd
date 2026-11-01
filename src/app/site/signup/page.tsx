"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

interface SignupFormData {
  name: string;
  slug: string;
  owner_full_name: string;
  owner_email: string;
  password: string;
}

interface SignupResponse {
  id: string;
  slug: string;
  status: string;
}

export default function SignupPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdTenant, setCreatedTenant] = useState<SignupResponse | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    defaultValues: {
      name: "",
      slug: "",
      owner_full_name: "",
      owner_email: "",
      password: "",
    },
  });

  const slugValue = watch("slug");

  // Helper to convert company name to slug automatically if user hasn't explicitly customized slug
  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("name", value);
    const suggestedSlug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setValue("slug", suggestedSlug, { shouldValidate: true });
  };

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const response = await axios.post<SignupResponse>(
        `${backendUrl}/tenants/signup`,
        {
          name: data.name,
          slug: data.slug,
          owner_email: data.owner_email,
          owner_full_name: data.owner_full_name,
          password: data.password,
        },
        {
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
          },
        }
      );

      setCreatedTenant(response.data);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === "string") {
          setServerError(err.response.data.detail);
        } else if (Array.isArray(err.response.data.detail)) {
          setServerError(err.response.data.detail.map((d: any) => d.msg).join(", "));
        } else {
          setServerError("Signup failed. Please check your inputs.");
        }
      } else if (err.response?.data?.message) {
        setServerError(err.response.data.message);
      } else {
        setServerError(err.message || "Failed to reach server. Please ensure backend is running.");
      }
    }
  };

  // Success view
  if (createdTenant) {
    const tenantUrl = `http://${createdTenant.slug}.localhost:3000/login`;
    return (
      <main style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div
          style={{
            maxWidth: "500px",
            width: "100%",
            borderRadius: "16px",
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--surface))",
            padding: "40px",
            textAlign: "center",
            boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "hsl(var(--success-soft))",
              color: "hsl(var(--success))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              margin: "0 auto 20px",
            }}
          >
            ✓
          </div>
          <h2 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "8px" }}>
            Workspace Created!
          </h2>
          <p style={{ color: "hsl(var(--text-muted))", fontSize: "15px", marginBottom: "24px" }}>
            Your workspace <strong>{createdTenant.slug}</strong> has been registered and is now{" "}
            <span style={{ color: "hsl(var(--success))", fontWeight: 600 }}>{createdTenant.status}</span>.
          </p>

          <div
            style={{
              background: "hsl(var(--surface-2))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "10px",
              padding: "16px",
              marginBottom: "28px",
              fontSize: "14px",
              wordBreak: "break-all",
            }}
          >
            <p style={{ color: "hsl(var(--text-subtle))", fontSize: "12px", textTransform: "uppercase", marginBottom: "4px" }}>
              Your Workspace URL
            </p>
            <a
              href={tenantUrl}
              style={{
                color: "hsl(var(--primary))",
                fontWeight: 600,
                fontSize: "15px",
                textDecoration: "none",
              }}
            >
              {tenantUrl}
            </a>
          </div>

          <a
            href={tenantUrl}
            style={{
              display: "block",
              width: "100%",
              padding: "14px 24px",
              borderRadius: "10px",
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-fg))",
              fontSize: "16px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Go to Workspace Login →
          </a>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "85vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          borderRadius: "16px",
          border: "1px solid hsl(var(--border))",
          background: "hsl(var(--surface))",
          padding: "36px 32px",
          boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "999px",
              background: "hsl(var(--primary-soft))",
              color: "hsl(var(--primary))",
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "12px",
            }}
          >
            ✦ Fast Setup
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, color: "hsl(var(--text))", marginBottom: "6px" }}>
            Create your workspace
          </h1>
          <p style={{ fontSize: "14px", color: "hsl(var(--text-muted))" }}>
            Start managing your team with AI-first workflows
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              background: "hsl(var(--danger-soft))",
              color: "hsl(var(--danger))",
              fontSize: "14px",
              marginBottom: "20px",
              border: "1px solid hsla(var(--danger), 0.2)",
            }}
          >
            {serverError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Company Name */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "hsl(var(--text))" }}>
              Company Name <span style={{ color: "hsl(var(--danger))" }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Acme Corp"
              {...register("name", { required: "Company name is required" })}
              onChange={handleCompanyNameChange}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--surface))",
                color: "hsl(var(--text))",
                fontSize: "14px",
                outline: "none",
              }}
            />
            {errors.name && (
              <span style={{ fontSize: "12px", color: "hsl(var(--danger))", marginTop: "4px", display: "block" }}>
                {errors.name.message}
              </span>
            )}
          </div>

          {/* Subdomain Slug */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "hsl(var(--text))" }}>
              Workspace URL <span style={{ color: "hsl(var(--danger))" }}>*</span>
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--surface))",
                overflow: "hidden",
              }}
            >
              <input
                type="text"
                placeholder="acme"
                {...register("slug", {
                  required: "Workspace slug is required",
                  pattern: {
                    value: /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
                    message: "Only lowercase letters, numbers, and dashes allowed",
                  },
                })}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  border: "none",
                  background: "transparent",
                  color: "hsl(var(--text))",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <span
                style={{
                  padding: "10px 14px",
                  background: "hsl(var(--surface-2))",
                  color: "hsl(var(--text-muted))",
                  fontSize: "13px",
                  borderLeft: "1px solid hsl(var(--border))",
                }}
              >
                .localhost:3000
              </span>
            </div>
            {errors.slug && (
              <span style={{ fontSize: "12px", color: "hsl(var(--danger))", marginTop: "4px", display: "block" }}>
                {errors.slug.message}
              </span>
            )}
            {slugValue && !errors.slug && (
              <span style={{ fontSize: "12px", color: "hsl(var(--text-subtle))", marginTop: "4px", display: "block" }}>
                Your workspace will be: <strong>{slugValue}.localhost:3000</strong>
              </span>
            )}
          </div>

          {/* Owner Full Name */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "hsl(var(--text))" }}>
              Your Full Name <span style={{ color: "hsl(var(--danger))" }}>*</span>
            </label>
            <input
              type="text"
              placeholder="John Doe"
              {...register("owner_full_name", { required: "Full name is required" })}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--surface))",
                color: "hsl(var(--text))",
                fontSize: "14px",
                outline: "none",
              }}
            />
            {errors.owner_full_name && (
              <span style={{ fontSize: "12px", color: "hsl(var(--danger))", marginTop: "4px", display: "block" }}>
                {errors.owner_full_name.message}
              </span>
            )}
          </div>

          {/* Owner Email */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "hsl(var(--text))" }}>
              Work Email <span style={{ color: "hsl(var(--danger))" }}>*</span>
            </label>
            <input
              type="email"
              placeholder="john@example.com"
              {...register("owner_email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email format",
                },
              })}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--surface))",
                color: "hsl(var(--text))",
                fontSize: "14px",
                outline: "none",
              }}
            />
            {errors.owner_email && (
              <span style={{ fontSize: "12px", color: "hsl(var(--danger))", marginTop: "4px", display: "block" }}>
                {errors.owner_email.message}
              </span>
            )}
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "hsl(var(--text))" }}>
              Password <span style={{ color: "hsl(var(--danger))" }}>*</span>
            </label>
            <input
              type="password"
              placeholder="Minimum 8 characters"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--surface))",
                color: "hsl(var(--text))",
                fontSize: "14px",
                outline: "none",
              }}
            />
            {errors.password && (
              <span style={{ fontSize: "12px", color: "hsl(var(--danger))", marginTop: "4px", display: "block" }}>
                {errors.password.message}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: "8px",
              padding: "12px",
              borderRadius: "8px",
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-fg))",
              fontSize: "15px",
              fontWeight: 600,
              border: "none",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {isSubmitting ? "Creating workspace..." : "Create Workspace"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "13px", color: "hsl(var(--text-muted))", marginTop: "20px" }}>
          Already have a workspace?{" "}
          <a href="/find-workspace" style={{ color: "hsl(var(--primary))", textDecoration: "none", fontWeight: 500 }}>
            Find workspace
          </a>
        </p>
      </div>
    </main>
  );
}
