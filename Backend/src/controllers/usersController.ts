import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import {
  createUser,
  deleteUser,
  findUserByEmail,
  findUserById,
  listUsers,
  updateUser
} from "../models/userModel.js";
import { ROLES, USER_STATUS } from "../utils/constants.js";

function safeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  };
}

export async function getUsers(_req: Request, res: Response) {
  try {
    const users = await listUsers();
    return res.json({ ok: true, data: users.map(safeUser) });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function createUserHandler(req: Request, res: Response) {
  const { email, password, fullName, role } = req.body || {};

  if (!email || !password || !fullName || !role) {
    return res
      .status(400)
      .json({ ok: false, message: "email, password, fullName, role vinahitajika." });
  }

  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({ ok: false, message: "Role sio sahihi." });
  }

  try {
    if (await findUserByEmail(email)) {
      return res.status(409).json({ ok: false, message: "Email tayari ipo." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({
      email: String(email).toLowerCase(),
      fullName,
      role,
      passwordHash
    });

    return res.status(201).json({ ok: true, data: safeUser(user) });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function updateUserHandler(req: Request, res: Response) {
  try {
    const user = await findUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ ok: false, message: "Mtumiaji hajapatikana." });
    }

    const updates: any = { ...(req.body || {}) };

    if (updates.password) {
      updates.passwordHash = await bcrypt.hash(String(updates.password), 10);
      delete updates.password;
    }

    const nextRole = updates.role;
    if (nextRole && !Object.values(ROLES).includes(nextRole)) {
      return res.status(400).json({ ok: false, message: "Role sio sahihi." });
    }

    const nextStatus = updates.status;
    if (nextStatus && !Object.values(USER_STATUS).includes(nextStatus)) {
      return res.status(400).json({ ok: false, message: "Status sio sahihi." });
    }

    const updated = await updateUser(user.id, updates);
    return res.json({ ok: true, data: safeUser(updated) });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function deleteUserHandler(req: Request, res: Response) {
  if (req.auth?.id === req.params.userId) {
    return res.status(400).json({ ok: false, message: "Super Admin hawezi kujifuta." });
  }

  try {
    const success = await deleteUser(req.params.userId);
    if (!success) {
      return res.status(404).json({ ok: false, message: "Mtumiaji hajapatikana." });
    }

    return res.json({ ok: true, message: "Mtumiaji amefutwa." });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}
