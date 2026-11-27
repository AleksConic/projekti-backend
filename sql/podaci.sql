-- Test podaci za demonstraciju (sve lozinke: lozinka123)
USE evidencija_projekata;

INSERT INTO korisnik (ime, prezime, email, lozinka_hash) VALUES ('Ana', 'Petrovic', 'ana.petrovic@example.com', '$2b$10$fijLltIFa3s2HQuAf.OhZO4i0obUc0TaGaDzrHTyJafLb5AJvTzna');
SET @k1 = LAST_INSERT_ID();
INSERT INTO korisnik (ime, prezime, email, lozinka_hash) VALUES ('Marko', 'Jovic', 'marko.jovic@example.com', '$2b$10$fijLltIFa3s2HQuAf.OhZO4i0obUc0TaGaDzrHTyJafLb5AJvTzna');
SET @k2 = LAST_INSERT_ID();
INSERT INTO korisnik (ime, prezime, email, lozinka_hash) VALUES ('Jelena', 'Nikolic', 'jelena.nikolic@example.com', '$2b$10$fijLltIFa3s2HQuAf.OhZO4i0obUc0TaGaDzrHTyJafLb5AJvTzna');
SET @k3 = LAST_INSERT_ID();

-- Projekat 1: admin Ana, clanovi Marko i Jelena
INSERT INTO projekat (naziv, opis, admin_id) VALUES ('Veb sajt firme', 'Izrada novog veb sajta za klijenta', @k1);
SET @p1 = LAST_INSERT_ID();
INSERT INTO clanstvo (projekat_id, korisnik_id, uloga) VALUES (@p1, @k1, 'admin'), (@p1, @k2, 'clan'), (@p1, @k3, 'clan');

INSERT INTO zadatak (projekat_id, naslov, opis, status, dodeljen_id) VALUES (@p1, 'Dizajn pocetne strane', 'Izraditi mockup pocetne strane', 'Done', @k3);
SET @z1 = LAST_INSERT_ID();
INSERT INTO zadatak (projekat_id, naslov, opis, status, dodeljen_id) VALUES (@p1, 'Implementacija navigacije', 'Meni i rutiranje izmedju stranica', 'Doing', @k2);
SET @z2 = LAST_INSERT_ID();
INSERT INTO zadatak (projekat_id, naslov, opis, status, dodeljen_id) VALUES (@p1, 'Kontakt forma', 'Forma sa validacijom unosa', 'To Do', @k2);
INSERT INTO zadatak (projekat_id, naslov, opis, status, dodeljen_id) VALUES (@p1, 'Objava na hostingu', 'Postavljanje sajta u produkciju', 'To Do', NULL);

INSERT INTO istorija_statusa (zadatak_id, stari_status, novi_status, korisnik_id) VALUES
  (@z1, 'To Do', 'Doing', @k3), (@z1, 'Doing', 'Done', @k3), (@z2, 'To Do', 'Doing', @k2);

-- Projekat 2: admin Marko, clan Ana
INSERT INTO projekat (naziv, opis, admin_id) VALUES ('Mobilna aplikacija', 'Prototip aplikacije za evidenciju radnih sati', @k2);
SET @p2 = LAST_INSERT_ID();
INSERT INTO clanstvo (projekat_id, korisnik_id, uloga) VALUES (@p2, @k2, 'admin'), (@p2, @k1, 'clan');
INSERT INTO zadatak (projekat_id, naslov, opis, status, dodeljen_id) VALUES
  (@p2, 'Analiza zahteva', 'Prikupiti zahteve od klijenta', 'Doing', @k1),
  (@p2, 'Skice ekrana', 'Papirne i digitalne skice', 'To Do', @k1);
