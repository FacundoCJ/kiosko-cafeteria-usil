import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";

const allowedRoles = ["ADMIN", "CAFETERIA", "COCINA"];

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

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        id: "asc"
      }
    });

    res.json({
      ok: true,
      total: users.length,
      users: users.map(formatUser)
    });
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al obtener usuarios"
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const user = await prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado"
      });
    }

    res.json({
      ok: true,
      user: formatUser(user)
    });
  } catch (error) {
    console.error("Error obteniendo usuario:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al obtener usuario"
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        ok: false,
        message: "Nombre, correo, contraseña y rol son obligatorios"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = role.trim().toUpperCase();

    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({
        ok: false,
        message: "Rol no válido",
        allowedRoles
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        ok: false,
        message: "La contraseña debe tener al menos 6 caracteres"
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      }
    });

    if (existingUser) {
      return res.status(400).json({
        ok: false,
        message: "Ya existe un usuario con ese correo"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: normalizedRole,
        isActive: true
      }
    });

    res.status(201).json({
      ok: true,
      message: "Usuario creado correctamente",
      user: formatUser(newUser)
    });
  } catch (error) {
    console.error("Error creando usuario:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al crear usuario"
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { name, email, password, role, isActive } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado"
      });
    }

    const dataToUpdate = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          ok: false,
          message: "El nombre no puede estar vacío"
        });
      }

      dataToUpdate.name = name.trim();
    }

    if (email !== undefined) {
      if (!email.trim()) {
        return res.status(400).json({
          ok: false,
          message: "El correo no puede estar vacío"
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const duplicatedUser = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          NOT: {
            id: userId
          }
        }
      });

      if (duplicatedUser) {
        return res.status(400).json({
          ok: false,
          message: "Ya existe otro usuario con ese correo"
        });
      }

      dataToUpdate.email = normalizedEmail;
    }

    if (password !== undefined && password.trim()) {
      if (password.length < 6) {
        return res.status(400).json({
          ok: false,
          message: "La contraseña debe tener al menos 6 caracteres"
        });
      }

      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    if (role !== undefined) {
      const normalizedRole = role.trim().toUpperCase();

      if (!allowedRoles.includes(normalizedRole)) {
        return res.status(400).json({
          ok: false,
          message: "Rol no válido",
          allowedRoles
        });
      }

      if (req.user.id === userId && existingUser.role === "ADMIN" && normalizedRole !== "ADMIN") {
        return res.status(400).json({
          ok: false,
          message: "No puedes quitarte el rol ADMIN a ti mismo"
        });
      }

      dataToUpdate.role = normalizedRole;
    }

    if (isActive !== undefined) {
      if (req.user.id === userId && isActive === false) {
        return res.status(400).json({
          ok: false,
          message: "No puedes desactivar tu propio usuario"
        });
      }

      dataToUpdate.isActive = Boolean(isActive);
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId
      },
      data: dataToUpdate
    });

    res.json({
      ok: true,
      message: "Usuario actualizado correctamente",
      user: formatUser(updatedUser)
    });
  } catch (error) {
    console.error("Error actualizando usuario:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al actualizar usuario"
    });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado"
      });
    }

    if (req.user.id === userId) {
      return res.status(400).json({
        ok: false,
        message: "No puedes activar o desactivar tu propio usuario desde esta opción"
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        isActive: !existingUser.isActive
      }
    });

    res.json({
      ok: true,
      message: updatedUser.isActive
        ? "Usuario activado correctamente"
        : "Usuario desactivado correctamente",
      user: formatUser(updatedUser)
    });
  } catch (error) {
    console.error("Error cambiando estado de usuario:", error);

    res.status(500).json({
      ok: false,
      message: "Error interno al cambiar estado del usuario"
    });
  }
};