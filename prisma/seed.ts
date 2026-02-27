import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create doctor
  const doctorPassword = await bcrypt.hash("doctor123", 12);
  const doctor = await prisma.user.upsert({
    where: { email: "doctor@test.com" },
    update: {},
    create: {
      name: "Dr. Sarah Smith",
      email: "doctor@test.com",
      password: doctorPassword,
      role: "DOCTOR",
      doctorProfile: {
        create: {
          specialization: "Psychiatry",
          clinicName: "Mind Wellness Clinic",
        },
      },
    },
    include: { doctorProfile: true },
  });

  console.log("✅ Doctor created:", doctor.email);

  // Create patient
  const patientPassword = await bcrypt.hash("patient123", 12);
  const patient = await prisma.user.upsert({
    where: { email: "patient@test.com" },
    update: {},
    create: {
      name: "John Doe",
      email: "patient@test.com",
      password: patientPassword,
      role: "PATIENT",
      patientProfile: {
        create: {
          doctorId: doctor.doctorProfile?.id,
          illnessInfo: "Anxiety and sleep concerns",
          demographics: "Age: 34, Gender: Male",
        },
      },
    },
  });

  console.log("✅ Patient created:", patient.email);
  console.log("");
  console.log("🔐 Test accounts:");
  console.log("  Doctor: doctor@test.com / doctor123");
  console.log("  Patient: patient@test.com / patient123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
