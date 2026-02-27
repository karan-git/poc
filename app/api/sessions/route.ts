import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET: List sessions for the authenticated patient
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patientProfile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!patientProfile) {
    return NextResponse.json(
      { error: "Patient profile not found" },
      { status: 404 },
    );
  }

  const sessions = await prisma.session.findMany({
    where: { patientId: patientProfile.id },
    orderBy: { updatedAt: "desc" },
    include: {
      summary: { select: { id: true } },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(sessions);
}

// POST: Create a new session
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patientProfile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    include: { doctor: true },
  });

  if (!patientProfile) {
    return NextResponse.json(
      { error: "Patient profile not found" },
      { status: 404 },
    );
  }

  const newSession = await prisma.session.create({
    data: {
      patientId: patientProfile.id,
      doctorId: patientProfile.doctorId || null,
      title: "New Session",
    },
  });

  return NextResponse.json(newSession, { status: 201 });
}
