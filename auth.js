const readline = require('readline');
const fs = require('fs');
const crypto = require('crypto'); // Librería nativa para encriptar

const APP_ID = '632329160918931';
const CLIENT_SECRET = 'zZeOE2wQEjYTEd6oT47ziLcdyELSVlon';
const REDIRECT_URI = 'https://art2mart.com.ar';

// ==========================================
// 1. GENERADOR DE SEGURIDAD PKCE
// ==========================================
function base64URLEncode(buffer) {
    return buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// Generamos el código secreto (Verifier) y el reto público (Challenge)
const verifier = base64URLEncode(crypto.randomBytes(32));
const challenge = base64URLEncode(crypto.createHash('sha256').update(verifier).digest());

// ==========================================
// 2. INTERFAZ DE USUARIO
// ==========================================
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log('\n======================================================');
console.log('PASO 1: Abre este NUEVO enlace (CTRL + Clic):');
// Fíjate que ahora la URL incluye el code_challenge
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
                code_verifier: verifier // ¡Aquí enviamos la pieza criptográfica que exigían!
            })
        });

        const data = await response.json();

        if (data.refresh_token) {
            fs.writeFileSync('ml_token.json', JSON.stringify({ refresh_token: data.refresh_token }));
            console.log('\n======================================================');
            console.log('✅ ¡ÉXITO ROTUNDO! Se ha creado el archivo "ml_token.json".');
            console.log('El candado de Mercado Libre ha sido superado.');
            console.log('======================================================\n');
        } else {
            console.log('\n❌ Error devuelto por Mercado Libre:', data);
        }
    } catch (error) { console.error('Error crítico:', error); }
    rl.close();
});