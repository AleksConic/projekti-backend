-- Evidencija realizacije projekata: sema baze (MySQL / MariaDB)
CREATE DATABASE IF NOT EXISTS evidencija_projekata
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE evidencija_projekata;

CREATE TABLE korisnik (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  ime           VARCHAR(50)  NOT NULL,
  prezime       VARCHAR(50)  NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  lozinka_hash  VARCHAR(100) NOT NULL,
  kreiran       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE projekat (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  naziv     VARCHAR(100) NOT NULL,
  opis      TEXT NULL,
  admin_id  INT NOT NULL,
  kreiran   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_projekat_admin FOREIGN KEY (admin_id) REFERENCES korisnik(id)
) ENGINE=InnoDB;

-- Clanstvo = tim projekta (veza M:N korisnik-projekat sa ulogom)
CREATE TABLE clanstvo (
  projekat_id  INT NOT NULL,
  korisnik_id  INT NOT NULL,
  uloga        ENUM('admin','clan') NOT NULL DEFAULT 'clan',
  PRIMARY KEY (projekat_id, korisnik_id),
  CONSTRAINT fk_clanstvo_projekat FOREIGN KEY (projekat_id) REFERENCES projekat(id) ON DELETE CASCADE,
  CONSTRAINT fk_clanstvo_korisnik FOREIGN KEY (korisnik_id) REFERENCES korisnik(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE zadatak (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  projekat_id  INT NOT NULL,
  naslov       VARCHAR(150) NOT NULL,
  opis         TEXT NULL,
  status       ENUM('To Do','Doing','Done') NOT NULL DEFAULT 'To Do',
  dodeljen_id  INT NULL,
  kreiran      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_zadatak_projekat FOREIGN KEY (projekat_id) REFERENCES projekat(id) ON DELETE CASCADE,
  CONSTRAINT fk_zadatak_dodeljen FOREIGN KEY (dodeljen_id) REFERENCES korisnik(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Audit trag promena statusa
CREATE TABLE istorija_statusa (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  zadatak_id   INT NOT NULL,
  stari_status ENUM('To Do','Doing','Done') NOT NULL,
  novi_status  ENUM('To Do','Doing','Done') NOT NULL,
  korisnik_id  INT NOT NULL,
  vreme        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ist_zadatak FOREIGN KEY (zadatak_id) REFERENCES zadatak(id) ON DELETE CASCADE,
  CONSTRAINT fk_ist_korisnik FOREIGN KEY (korisnik_id) REFERENCES korisnik(id)
) ENGINE=InnoDB;

-- 3. sloj validacije: status se sme menjati samo unapred
DELIMITER $$
CREATE TRIGGER zadatak_status_samo_unapred
BEFORE UPDATE ON zadatak
FOR EACH ROW
BEGIN
  IF FIELD(NEW.status, 'To Do', 'Doing', 'Done') < FIELD(OLD.status, 'To Do', 'Doing', 'Done') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Status zadatka se moze menjati samo unapred';
  END IF;
END$$
DELIMITER ;
