import { Router } from "express";
import { pool } from "../db";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { STATUSES, isNonEmpty } from "../validation";
import { uloga } from "./projects";

const router = Router();
router.use(requireAuth);

async function ucitaj(id: number) {
  const [rows]: any = await pool.query("SELECT * FROM zadatak WHERE id = ?", [id]);
  return rows[0] as
    | { id: number; projekat_id: number; status: (typeof STATUSES)[number]; dodeljen_id: number | null }
    | undefined;
}

// Izmena opisa/naslova/dodele (samo admin projekta)
router.patch("/:id", async (req: AuthRequest, res) => {
  const z = await ucitaj(Number(req.params.id));
  if (!z) return res.status(404).json({ error: "Zadatak ne postoji" });
  if ((await uloga(z.projekat_id, req.userId!)) !== "admin")
    return res.status(403).json({ error: "Samo administrator projekta moze menjati zadatak" });
  const { naslov, opis, dodeljen_id } = req.body ?? {};
  if (naslov !== undefined && !isNonEmpty(naslov, 150))
    return res.status(400).json({ error: "Neispravan naslov" });
  if (dodeljen_id != null && !(await uloga(z.projekat_id, Number(dodeljen_id))))
    return res.status(400).json({ error: "Dodeljeni korisnik nije clan tima" });
  await pool.query(
    `UPDATE zadatak SET naslov = COALESCE(?, naslov), opis = COALESCE(?, opis),
       dodeljen_id = CASE WHEN ? THEN ? ELSE dodeljen_id END WHERE id = ?`,
    [naslov ?? null, opis ?? null, dodeljen_id !== undefined, dodeljen_id ?? null, z.id]
  );
  res.json({ ok: true });
});

// Promena statusa: samo dodeljeni clan, samo unapred
router.patch("/:id/status", async (req: AuthRequest, res) => {
  const z = await ucitaj(Number(req.params.id));
  if (!z) return res.status(404).json({ error: "Zadatak ne postoji" });
  if (z.dodeljen_id !== req.userId)
    return res.status(403).json({ error: "Status moze menjati samo clan kome je zadatak dodeljen" });
  const novi = req.body?.status;
  if (!STATUSES.includes(novi)) return res.status(400).json({ error: "Nepoznat status" });
  if (STATUSES.indexOf(novi) <= STATUSES.indexOf(z.status))
    return res.status(400).json({ error: "Status se moze menjati samo unapred" });
  try {
    await pool.query("UPDATE zadatak SET status = ? WHERE id = ?", [novi, z.id]);
    await pool.query(
      "INSERT INTO istorija_statusa (zadatak_id, stari_status, novi_status, korisnik_id) VALUES (?, ?, ?, ?)",
      [z.id, z.status, novi, req.userId]
    );
    res.json({ status: novi });
  } catch (e: any) {
    // trigger u bazi (3. sloj) odbija pomeranje unazad
    if (e.sqlState === "45000") return res.status(400).json({ error: e.sqlMessage });
    res.status(500).json({ error: "Greska na serveru" });
  }
});

export default router;
