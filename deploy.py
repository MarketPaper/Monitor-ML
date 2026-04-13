#!/usr/bin/env python3
"""
Deploy Monitor ML to Spaceship via FTPS (FTP + TLS explícito).
Spaceship exige TLS — FTP plano da timeout.
"""
import ftplib
import socket
import sys
from pathlib import Path

# Asegurar salida UTF-8 en consolas Windows
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

FTP_HOST = "mlibretools.aigents.com.ar"
FTP_USER = "ftplay@mlibretools.aigents.com.ar"
FTP_PASS = "7948.TresSeis"
FTP_PATH = "/home/jmyqoqyfsb/mlibretools.aigents.com.ar"
LOCAL_PATH = "src"

socket.setdefaulttimeout(60)


def ensure_remote_dir(ftp, remote_dir):
    """Crea recursivamente los directorios remotos que falten."""
    parts = remote_dir.strip("/").split("/")
    cur = ""
    for p in parts:
        cur += "/" + p
        try:
            ftp.cwd(cur)
        except ftplib.error_perm:
            try:
                ftp.mkd(cur)
                ftp.cwd(cur)
            except ftplib.error_perm:
                pass


def upload_directory(ftp, local_dir, remote_dir):
    local_path = Path(local_dir)
    count = 0
    for item in sorted(local_path.rglob("*")):
        if not item.is_file():
            continue
        rel = item.relative_to(local_path).as_posix()
        remote_file = f"{remote_dir}/{rel}"
        remote_sub = remote_file.rsplit("/", 1)[0]
        ensure_remote_dir(ftp, remote_sub)
        ftp.cwd(remote_sub)
        with open(item, "rb") as f:
            ftp.storbinary(f"STOR {item.name}", f)
        print(f"[ok] {rel}")
        count += 1
    return count


def main():
    print("\n=== DEPLOY A SPACESHIP (FTPS) ===\n")
    try:
        print(f"Conectando a {FTP_HOST}...")
        ftp = ftplib.FTP_TLS(FTP_HOST)
        ftp.login(FTP_USER, FTP_PASS)
        ftp.prot_p()
        print(f"[OK] Conectado como {FTP_USER}\n")

        ftp.cwd(FTP_PATH)
        print(f"Subiendo desde '{LOCAL_PATH}' a '{FTP_PATH}'...\n")

        count = upload_directory(ftp, LOCAL_PATH, FTP_PATH)

        ftp.quit()
        print(f"\n[OK] Deploy completado — {count} archivos subidos.")
        print("Sitio: https://mlibretools.aigents.com.ar/")

    except Exception as e:
        print(f"\n[ERROR] Deploy fallido: {e!r}")
        sys.exit(1)


if __name__ == "__main__":
    main()
