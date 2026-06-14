import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { prisma } from "../config/prisma.js";

dotenv.config();

const createAdmin = async () => {
  try {
    const email = "admin@usil.edu.pe";
    const password = "Admin123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
      where: {
        email
      },
      update: {
        name: "Administrador USIL",
        password: hashedPassword,
        role: "ADMIN",
        isActive: true
      },
      create: {
        name: "Administrador USIL",
        email,
        password: hashedPassword,
        role: "ADMIN",
        isActive: true
      }
    });

    console.log("Usuario administrador listo:");
    console.log(`ID: ${admin.id}`);
    console.log(`Nombre: ${admin.name}`);
    console.log(`Correo: ${email}`);
    console.log("Contraseña: Admin123");
    console.log(`Rol: ${admin.role}`);
    console.log(`Activo: ${admin.isActive}`);
  } catch (error) {
    console.error("Error creando o actualizando administrador:", error);
  } finally {
    await prisma.$disconnect();
  }
};

createAdmin();