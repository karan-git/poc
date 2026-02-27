import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, FileText, AlertTriangle, Activity } from "lucide-react";

export default async function DoctorDashboard() {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "DOCTOR") {
    redirect("/login");
  }

  // Global Visibility: Fetch all patients in the system
  const patients = await prisma.patientProfile.findMany({
    include: {
      user: { select: { name: true, email: true } },
      sessions: {
        include: {
          summary: { select: { id: true, safetyFlags: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId: session.user.id },
  });
  const totalSessions = patients.reduce((acc, p) => acc + p.sessions.length, 0);
  const totalMessages = patients.reduce(
    (acc, p) => acc + p.sessions.reduce((a, s) => a + s._count.messages, 0),
    0,
  );
  const safetyFlagCount = patients.reduce(
    (acc, p) => acc + p.sessions.filter((s) => s.summary?.safetyFlags).length,
    0,
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-neutral-600 bg-background px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">
              Doctor Dashboard
            </h1>
            <p className="text-sm text-gray-300">
              Welcome, {session.user.name}
              {doctorProfile?.specialization &&
                ` · ${doctorProfile.specialization}`}
            </p>
          </div>
          <Link
            href="/api/auth/signout"
            className="rounded-lg bg-btn-background py-2 px-4 text-md font-medium text-white hover:bg-[#373737] disabled:opacity-50 transition-colors cursor-pointer"
          >
            Sign out
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto mt-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl bg-card-background p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">
                  {patients.length}
                </p>
                <p className="text-xs text-gray-500">Patients</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-card-background p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2">
                <Activity size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">
                  {totalSessions}
                </p>
                <p className="text-xs text-gray-500">Sessions</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-card-background p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2">
                <FileText size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">
                  {totalMessages}
                </p>
                <p className="text-xs text-gray-500">Messages</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-card-background p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-50 p-2">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">
                  {safetyFlagCount}
                </p>
                <p className="text-xs text-gray-500">Safety Flags</p>
              </div>
            </div>
          </div>
        </div>

        {/* Patient List */}
        <div className="rounded-xl bg-card-background shadow-sm overflow-hidden">
          <div className="b px-6 py-4">
            <h2 className="text-lg font-semibold text-white">
              Assigned Patients
            </h2>
          </div>
          {patients.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-neutral-400">
              No patients assigned yet. Patients will appear here once they
              register and are linked to your profile.
            </div>
          ) : (
            <div className="divide-y divide-neutral-700">
              {patients.map((patient) => (
                <Link
                  key={patient.id}
                  href={`/doctor/patients/${patient.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-[#373737] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                      {patient.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {patient.user.name}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {patient.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-neutral-400">
                    <span>{patient.sessions.length} sessions</span>
                    {patient.sessions.some((s) => s.summary?.safetyFlags) && (
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertTriangle size={12} />
                        Safety flag
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// FUTURE: Advanced analytics dashboard
// FUTURE: Multi-doctor access controls
// FUTURE: Real-time notifications for safety flags
