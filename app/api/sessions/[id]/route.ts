import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET: Get session with messages
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chatSession = await prisma.session.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      summary: true,
      patient: { include: { user: { select: { name: true } } } },
    },
  });

  if (!chatSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Verify access: patient can only see own sessions, doctor can see assigned patients
  const userRole = (session.user as { role: string }).role;
  if (userRole === "PATIENT") {
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (chatSession.patientId !== patientProfile?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (userRole === "DOCTOR") {
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (chatSession.doctorId !== doctorProfile?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json(chatSession);
}
