"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Stethoscope, Loader2, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"DOCTOR" | "PATIENT">("PATIENT");
  const [specialization, setSpecialization] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        ...(role === "DOCTOR" && { specialization, clinicName }),
        ...(role === "PATIENT" && { doctorEmail }),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Registration failed");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#202123] text-white">
            <Stethoscope size={28} />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-200">
            Create account
          </h1>
          <p className="mt-1 text-md text-gray-500">
            Join the clinical platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-md text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-md font-medium text-neutral-400">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg bg-card-background px-3 py-4 text-white text-md transition-colors outline-none"
              placeholder="Dr. Smith"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-md font-medium text-neutral-400">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg bg-card-background px-3 py-4 text-white text-md transition-colors outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-md font-medium text-neutral-400">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg bg-card-background text-white px-3 py-4 text-md outline-none transition-colors pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-md font-medium text-neutral-400">
              Role
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRole("PATIENT")}
                className={`flex-1 rounded-lg px-3 py-4 text-md font-medium transition-colors cursor-pointer ${
                  role === "PATIENT"
                    ? "bg-card-background text-white"
                    : "border-gray-300 text-neutral-400 hover:bg-card-background/20"
                }`}
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() => setRole("DOCTOR")}
                className={`flex-1 rounded-lg px-3 py-4 text-md font-medium transition-colors cursor-pointer ${
                  role === "DOCTOR"
                    ? "bg-card-background text-white"
                    : "border-gray-300 text-neutral-400 hover:bg-card-background/20 border-background"
                }`}
              >
                Doctor
              </button>
            </div>
          </div>

          {role === "PATIENT" && (
            <div>
              <label className="mb-1.5 block text-md font-medium text-neutral-400">
                Doctor&apos;s Email (Optional)
              </label>
              <input
                type="email"
                value={doctorEmail}
                onChange={(e) => setDoctorEmail(e.target.value)}
                className="w-full rounded-lg bg-card-background px-3 py-4 text-white text-md transition-colors outline-none"
                placeholder="doctor@clinic.com"
              />
              <p className="mt-1 text-[10px] text-gray-400">
                Link your profile to your doctor to share session summaries.
              </p>
            </div>
          )}

          {role === "DOCTOR" && (
            <>
              <div>
                <label className="mb-1.5 block text-md font-medium text-neutral-400">
                  Specialization
                </label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full rounded-lg bg-card-background px-3 py-4 text-white text-md transition-colors outline-none"
                  placeholder="Psychiatry"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-md font-medium text-neutral-400">
                  Clinic Name
                </label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full rounded-lg bg-card-background px-3 py-4 text-white text-md transition-colors outline-none"
                  placeholder="ABC Clinic"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-btn-background py-4 text-md font-medium text-white hover:bg-[#373737] disabled:opacity-50 transition-colors cursor-pointer mt-12"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Create account
          </button>
        </form>

        <p className="mt-3 text-center text-md text-gray-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-neutral-200 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
