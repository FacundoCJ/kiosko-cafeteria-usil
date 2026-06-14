import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { generateToken } from "../services/token.service.js";

const formatUser = (user) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: "Correo y contraseña son obligatorios"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      }
    });

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: "Credenciales inválidas"
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        ok: false,
        message: "Usuario inactivo"
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        ok: false,
        message: "Credenciales inválidas"
      });
    }

    const token = generateToken(user);

    return res.json({
      ok: true,
      message: "Inicio de sesión correcto",
      token,
      user: formatUser(user)
    });
  } catch (error) {
    console.error("ERROR REAL EN LOGIN:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno al iniciar sesión",
      error: error.message
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id
      }
    });

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado"
      });
    }

    return res.json({
      ok: true,
      user: formatUser(user)
    });
  } catch (error) {
    console.error("ERROR REAL EN PERFIL:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno al obtener perfil",
      error: error.message
    });
  }
};