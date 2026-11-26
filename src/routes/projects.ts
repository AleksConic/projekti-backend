import { Router } from "express";
import { pool } from "../db";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { EMAIL_RE, isNonEmpty } from "../validation";

const router = Router();
router.use(requireAuth);

// Uloga korisnika u projektu (null ako nije clan)
export async function uloga(projekatId: number, korisnikId: number): Promise<"admin" | "clan" | null> {
  const [rows]: any = await pool.query(
    "SELECT uloga FROM clanstvo WHERE projekat_id = ? AND korisnik_id = ?",
    [projekatId, korisnikId]
  );
  return rows[0]?.uloga ?? null;
}

// Lista mojih projekata
router.get("/", async (req: AuthRequest, res) => {
  const [rows] = await pool.query(
    `SELECT p.id, p.naziv, p.opis, c.uloga,
            (SELECT COUNT(*) FROM zadatak z WHERE z.projekat_id = p.id) AS broj_zadataka,
            (SELECT COUNT(*) FROM zadatak z WHERE z.projekat_id = p.id AND z.status = 'Done') AS zavrseno
     FROM projekat p JOIN clanstvo c ON c.projekat_id = p.id
     WHERE c.korisnik_id = ? ORDER BY p.kreiran DESC`,
    [req.userId]
  );
  res.json(rows);
});

// Kreiranje projekta: kreator postaje admin i prvi clan tima
router.post("/", async (req: AuthRequest, res) => {
  const { naziv, opis } = req.body ?? {};
  if (!isNonEmpty(naziv, 100)) return res.status(400).json({ error: "Naziv je obavezan (max 100)" });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r]: any = await conn.query(
      "INSERT INTO projekat (naziv, opis, admin_id) VALUES (?, ?, ?)",
      [naziv.trim(), opis ?? null, req.userId]
    );
    await conn.query(
      "INSERT INTO clanstvo (projekat_id, korisnik_id, uloga) VALUES (?, ?, 'admin')",
      [r.insertId, req.userId]
    );
    await conn.commit();
    res.status(201).json({ id: r.insertId });
  } catch {
    await conn.rollback();
    res.status(500).json({ error: "Greska na serveru" });
  } finally {
    conn.release();
  }
});

// Clanovi tima
router.get("/:id/clanovi", async (req: AuthRequest, res) => {
  const pid = Number(req.params.id);
  if (!(await uloga(pid, req.userId!))) return res.status(403).json({ error: "Niste clan projekta" });
  const [rows] = await pool.query(
    `SELECT k.id, k.ime, k.prezime, k.email, c.uloga
     FROM clanstvo c JOIN korisnik k ON k.id = c.korisnik_id WHERE c.projekat_id = ?`,
    [pid]
  );
  res.json(rows);
});

// Dodavanje clana u tim (samo admin), po email adresi
router.post("/:id/clanovi", async (req: AuthRequest, res) => {
  const pid = Number(req.params.id);
  if ((await uloga(pid, req.userId!)) !== "admin")
    return res.status(403).json({ error: "Samo administrator projekta moze dodavati clanove" });
  const email = String(req.body?.email ?? "").toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Neispravan email" });
  const [rows]: any = await pool.query("SELECT id FROM korisnik WHERE email = ?", [email]);
  if (!rows[0]) return res.status(404).json({ error: "Korisnik nije registrovan" });
  try {
    await pool.query("INSERT INTO clanstvo (projekat_id, korisnik_id) VALUES (?, ?)", [pid, rows[0].id]);
    res.status(201).json({ id: rows[0].id });
  } catch (e: any) {
    if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Vec je clan tima" });
    res.status(500).json({ error: "Greska na serveru" });
  }
});

// Zadaci projekta
router.get("/:id/zadaci", async (req: AuthRequest, res) => {
  const pid = Number(req.params.id);
  if (!(await uloga(pid, req.userId!))) return res.status(403).json({ error: "Niste clan projekta" });
  const [rows] = await pool.query(
    `SELECT z.id, z.naslov, z.opis, z.status, z.dodeljen_id,
            CONCAT(k.ime, ' ', k.prezime) AS dodeljen_ime
     FROM zadatak z LEFT JOIN korisnik k ON k.id = z.dodeljen_id
     WHERE z.projekat_id = ? ORDER BY z.id`,
    [pid]
  );
  res.json(rows);
});

// Kreiranje zadatka (samo admin)
router.post("/:id/zadaci", async (req: AuthRequest, res) => {
  const pid = Number(req.params.id);
  if ((await uloga(pid, req.userId!)) !== "admin")
    return res.status(403).json({ error: "Samo administrator projekta moze kreirati zadatke" });
  const { naslov, opis, dodeljen_id } = req.body ?? {};
  if (!isNonEmpty(naslov, 150)) return res.status(400).json({ error: "Naslov je obavezan (max 150)" });
  if (dodeljen_id != null && !(await uloga(pid, Number(dodeljen_id))))
    return res.status(400).json({ error: "Dodeljeni korisnik nije clan tima" });
  const [r]: any = await pool.query(
    "INSERT INTO zadatak (projekat_id, naslov, opis, dodeljen_id) VALUES (?, ?, ?, ?)",
    [pid, naslov.trim(), opis ?? null, dodeljen_id ?? null]
  );
  res.status(201).json({ id: r.insertId });
});

export default router;
