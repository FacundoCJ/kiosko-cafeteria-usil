import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { prisma } from "../config/prisma.js";

dotenv.config();

const createAdmin = async () => {
  try {
    const email = "admin@usil.edu.pe";
    const password = "Admin123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingAdmin = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (existingAdmin) {
      console.log("El usuario administrador ya existe:");
      console.log(`Correo: ${email}`);
      console.log("Contraseña: Admin123");
      return;
    }

    const admin = await prisma.user.create({
      data: {
        name: "Administrador USIL",
        email,
        password: hashedPassword,
        role: "ADMIN",
        isActive: true
      }
    });

    console.log("Usuario administrador creado correctamente:");
    console.log(`ID: ${admin.id}`);
    console.log(`Nombre: ${admin.name}`);
    console.log(`Correo: ${email}`);
    console.log("Contraseña: Admin123");
    console.log(`Rol: ${admin.role}`);
  } catch (error) {
    console.error("Error creando administrador:", error);
  } finally {
    await prisma.$disconnect();
  }
};

createAdmin();