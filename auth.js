const readline = require('readline');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EMPRESAS_FILE = path.join(__dirname, 'empresas.json');
const REDIRECT_URI = 'https://art2mart.com.ar';

const empresaKey = process.argv[2];
if (!empresaKey) {
    console.log('Uso: node auth.js <nombre_empresa>');
    if (fs.existsSync(EMPRESAS_FILE)) {
        const { empresas } = JSON.parse(fs.readFileSync(EMPRESAS_FILE, 'utf8'));
        console.log('\nEmpresas disponibles:');
        Object.keys(empresas).forEach(k => console.log(`  - ${k}  (${empresas[k].nombre || ''})`));
    }
    process.exit(1);
}

if (!fs.existsSync(EMPRESAS_FILE)) {
    console.log('❌ No existe empresas.json.');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(EMPRESAS_FILE, 'utf8'));
const empresa = data.empresas[empresaKey];
if (!empresa) {
    console.log(`❌ Empresa "${empresaKey}" no encontrada en empresas.json.`);
    console.log('Disponibles:', Object.keys(data.empresas).join(', '));
    process.exit(1);
}

const APP_ID = empresa.ml_app_id;
const CLIENT_SECRET = empresa.ml_client_secret;

// ==========================================
// 1. GENERADOR DE SEGURIDAD PKCE
// ==========================================
function base64URLEncode(buffer) {
    return buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

const verifier = base64URLEncode(crypto.randomBytes(32));
const challenge = base64URLEncode(crypto.createHash('sha256').update(verifier).digest());

// ==========================================
// 2. INTERFAZ DE USUARIO
// ==========================================
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log('\n======================================================');
console.log(`Empresa: ${empresa.nombre || empresaKey}`);
console.log('PASO 1: Abre este NUEVO enlace (CTRL + Clic):');
console.log(`https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&code_challenge=${challenge}&code_challenge_method=S256`);
console.log('======================================================\n');
console.log('PASO 2: Inicia sesión y Permite el acceso.');

rl.question('PASO 3: Pega aquí la URL completa de art2mart que te devolvió el navegador:\n> ', async (pastedUrl) => {
    try {
        const codeMatch = pastedUrl.match(/code=([^&]+)/);
        if (!codeMatch) {
            console.log('\n❌ Error: No hay código en la URL.');
            rl.close(); return;
        }

        console.log(`\n⏳ Generando llave maestra con seguridad PKCE...`);
        const response = await fetch('https://api.mercadolibre.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: APP_ID,
                client_secret: CLIENT_SECRET,
                code: codeMatch[1],
                redirect_uri: REDIRECT_URI,
                code_verifier: verifier
            })
        });

        const result = await response.json();

        if (result.refresh_token) {
            data.empresas[empresaKey].ml_refresh_token = result.refresh_token;
            fs.writeFileSync(EMPRESAS_FILE, JSON.stringify(data, null, 2));
            console.log('\n======================================================');
            console.log(`✅ ¡ÉXITO! refresh_token guardado en empresas.json → "${empresaKey}".`);
            console.log('======================================================\n');
        } else {
            console.log('\n❌ Error devuelto por Mercado Libre:', result);
        }
    } catch (error) { console.error('Error crítico:', error); }
    rl.close();
});
