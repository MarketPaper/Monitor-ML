#!/bin/bash

# Script de deploy a Spaceship vía FTP
# Uso: ./deploy.sh

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando deploy a Spaceship...${NC}"

# Variables
FTP_HOST="mlibretools.aigents.com.ar"
FTP_USER="ftplay@mlibretools.aigents.com.ar"
FTP_PASS="7948.TresSeis"
FTP_PATH="/home/jmyqoqyfsb/mlibretools.aigents.com.ar/"
LOCAL_PATH="./src/"

# Verificar que lftp está instalado
if ! command -v lftp &> /dev/null; then
    echo -e "${RED}❌ lftp no está instalado. Instálalo con: apt-get install lftp (Linux) o brew install lftp (Mac)${NC}"
    exit 1
fi

echo -e "${BLUE}📁 Conectando a $FTP_HOST...${NC}"

# Hacer upload vía FTP con lftp (más robusto que ftp puro)
lftp -u "$FTP_USER","$FTP_PASS" "$FTP_HOST" <<EOF
set ssl:verify-certificate no
cd "$FTP_PATH"
mirror --reverse --delete --verbose "$LOCAL_PATH" .
quit
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deploy completado exitosamente!${NC}"
    echo -e "${GREEN}Sitio actualizado: http://mlibretools.aigents.com.ar/${NC}"
else
    echo -e "${RED}❌ Error en el deploy${NC}"
    exit 1
fi
