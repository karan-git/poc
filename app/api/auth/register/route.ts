import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["DOCTOR", "PATIENT"]),
  // Optional doctor fields
  specialization: z.string().optional(),
  clinicName: z.string().optional(),
  // Optional patient fields
  doctorEmail: z.string().email().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const {
      name,
      email,
      password,
      role,
      specialization,
      clinicName,
      doctorEmail,
    } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    let doctorIdToLink: string | null = null;
    if (role === "PATIENT" && doctorEmail) {
      const doctor = await prisma.user.findUnique({
        where: { email: doctorEmail, role: "DOCTOR" },
        include: { doctorProfile: true },
      });
      if (doctor?.doctorProfile) {
        doctorIdToLink = doctor.doctorProfile.id;
      } else {
        return NextResponse.json(
          { error: "Doctor not found with that email" },
          { status: 400 },
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        ...(role === "DOCTOR" && {
          doctorProfile: {
            create: {
              specialization: specialization || null,
              clinicName: clinicName || null,
            },
          },
        }),
        ...(role === "PATIENT" && {
          patientProfile: {
            create: {
              doctorId: doctorIdToLink,
            },
          },
        }),
      },
    });

    return NextResponse.json(
      { message: "User created", userId: user.id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
