import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db";
import { EMAIL_RE, NAME_RE, MIN_LOZINKA } from "../validation";

const router = Router();

router.post("/register", async (req, res) => {
  const { ime, prezime, email, lozinka } = req.body ?? {};
  if (!NAME_RE.test(ime ?? "") || !NAME_RE.test(prezime ?? ""))
    return res.status(400).json({ error: "Neispravno ime ili prezime" });
  if (!EMAIL_RE.test(email ?? "")) return res.status(400).json({ error: "Neispravan email" });
  if (typeof lozinka !== "string" || lozinka.length < MIN_LOZINKA)
    return res.status(400).json({ error: `Lozinka mora imati najmanje ${MIN_LOZINKA} karaktera` });
  try {
    const hash = await bcrypt.hash(lozinka, 10);
    const [r]: any = await pool.query(
      "INSERT INTO korisnik (ime, prezime, email, lozinka_hash) VALUES (?, ?, ?, ?)",
      [ime, prezime, email.toLowerCase(), hash]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e: any) {
    if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Email je vec registrovan" });
    res.status(500).json({ error: "Greska na serveru" });
  }
});

router.post("/login", async (req, res) => {
  const { email, lozinka } = req.body ?? {};
  const [rows]: any = await pool.query("SELECT * FROM korisnik WHERE email = ?", [
    String(email ?? "").toLowerCase(),
  ]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(String(lozinka ?? ""), u.lozinka_hash)))
    return res.status(401).json({ error: "Pogresan email ili lozinka" });
  const token = jwt.sign({ id: u.id }, process.env.JWT_SECRET as string, { expiresIn: "8h" });
  res.json({ token, korisnik: { id: u.id, ime: u.ime, prezime: u.prezime, email: u.email } });
});

export default router;
