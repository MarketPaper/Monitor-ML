#!/usr/bin/env python3
"""
Deploy Monitor ML to Spaceship via FTP
"""
import ftplib
import os
import sys
from pathlib import Path

# Configuración
FTP_HOST = "mlibretools.aigents.com.ar"
FTP_USER = "ftplay@mlibretools.aigents.com.ar"
FTP_PASS = "7948.TresSeis"
FTP_PATH = "/home/jmyqoqyfsb/mlibretools.aigents.com.ar"
LOCAL_PATH = "src"

def upload_directory(ftp, local_dir, remote_dir):
    """Sube recursivamente todos los archivos de un directorio local a FTP"""
    local_path = Path(local_dir)

    for item in local_path.rglob('*'):
        if item.is_file():
            relative_path = item.relative_to(local_path)
            remote_file_path = f"{remote_dir}/{str(relative_path).replace(chr(92), '/')}"

            # Crear directorio remoto si no existe
            remote_dir_path = remote_file_path.rsplit('/', 1)[0]
            try:
                ftp.cwd(remote_dir_path)
                ftp.cwd(remote_dir)
            except ftplib.all_errors:
                parts = remote_dir_path.split('/')
                for i in range(len(parts)):
                    try:
                        ftp.cwd('/'.join(parts[:i+1]))
                    except ftplib.all_errors:
                        ftp.mkd('/'.join(parts[:i+1]))
                        ftp.cwd('/'.join(parts[:i+1]))

            # Subir archivo
            print(f"Subiendo: {relative_path}")
            with open(item, 'rb') as f:
                ftp.storbinary(f"STOR {item.name}", f)

def main():
    print("\n=== DEPLOY A SPACESHIP ===\n")

    try:
        print(f"Conectando a {FTP_HOST}...")
        ftp = ftplib.FTP(FTP_HOST)
        ftp.login(FTP_USER, FTP_PASS)
        print(f"✓ Conectado como {FTP_USER}\n")

        print(f"Navegando a {FTP_PATH}...")
        ftp.cwd(FTP_PATH)
        print(f"✓ Directorio remoto: {FTP_PATH}\n")

        print(f"Subiendo archivos desde {LOCAL_PATH}...\n")
        upload_directory(ftp, LOCAL_PATH, FTP_PATH)

        ftp.quit()

        print(f"\n✓ Deploy completado!")
        print(f"Sitio: https://mlibretools.aigents.com.ar/")

    except Exception as e:
        print(f"\n✗ Error en el deploy: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
