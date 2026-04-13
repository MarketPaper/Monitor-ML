const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ==========================================
// 1. CONFIGURACIÓN DE CREDENCIALES
// ==========================================
const SUPABASE_URL = 'https://kdsicztkxflbeozsujob.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtkc2ljenRreGZsYmVvenN1am9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTA5OTgsImV4cCI6MjA4OTQ2Njk5OH0.W5ir2145bOtSVEQqOlGXkRkc38ReeckkW0jXrw-IbNY';

const ML_APP_ID = '632329160918931';
const ML_CLIENT_SECRET = 'zZeOE2wQEjYTEd6oT47ziLcdyELSVlon';
const TOKEN_FILE = path.join(__dirname, 'ml_token.json');

// ==========================================
// 2. INICIALIZACIÓN
// ==========================================
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const TABLE = 'ml_products';

function extractMlId(url) {
    if (!url) return null;
    const match = url.match(/MLA-?(\d+)/i);
    return match ? `MLA${match[1]}` : null;
}

async function getAccessToken() {
    if (!fs.existsSync(TOKEN_FILE)) throw new Error('❌ No existe el archivo ml_token.json.');
    const savedData = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));

    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: ML_APP_ID,
            client_secret: ML_CLIENT_SECRET,
            refresh_token: savedData.refresh_token
        })
    });
    const data = await response.json();
    if (!data.access_token) throw new Error('Error al renovar token.');
    fs.writeFileSync(TOKEN_FILE, JSON.stringify({ refresh_token: data.refresh_token }));
    return data.access_token;
}

// Capturamos la categoría si el usuario la escribió en la consola
const categoriaSolicitada = process.argv[2]; 

// ==========================================
// 3. LÓGICA DEL MONITOR HÍBRIDO DEFINITIVO
// ==========================================
async function run() {
    console.log('🚀 Iniciando monitor Híbrido Definitivo...');
    
    try {
        const token = await getAccessToken();
        console.log('🔑 Token rotado correctamente.');

        // Preparamos la consulta a Supabase
        let query = supabase.from(TABLE).select('*');

        // Si se envió una categoría por consola, agregamos el filtro
        if (categoriaSolicitada) {
            console.log(`🎯 Filtrando únicamente por la categoría: "${categoriaSolicitada}"`);
            query = query.eq('category', categoriaSolicitada);
        } else {
            console.log("🌐 No se especificó categoría. Actualizando TODOS los productos.");
        }

        // Ejecutamos la consulta
        const { data: products, error } = await query;
        if (error) throw error;

        // Verificamos si hay productos para procesar
        if (!products || products.length === 0) {
            console.log(`⚠️ No se encontraron productos${categoriaSolicitada ? ` en la categoría "${categoriaSolicitada}"` : ''} para actualizar.`);
            return;
        }

        console.log(`📊 Se encontraron ${products.length} productos para procesar.`);

        const allIds = new Set();
        products.forEach(p => {
            const myId = extractMlId(p.my_url);
            if (myId) allIds.add(myId);
            (p.competitors || []).forEach(c => {
                const cId = extractMlId(c.url);
                if (cId) allIds.add(cId);
            });
        });

        const idsArray = Array.from(allIds);
        const priceMap = {};
        const fallbackIds = [];

        // FASE 1: Intento por API (Rápido, solo pasará para tus propios productos)
        console.log(`\n📦 Fase 1: Consultando ${idsArray.length} productos por API oficial...`);
        for (let i = 0; i < idsArray.length; i += 20) {
            const chunk = idsArray.slice(i, i + 20);
            const res = await fetch(`https://api.mercadolibre.com/items?ids=${chunk.join(',')}&attributes=id,price`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const chunkData = await res.json();
            chunkData.forEach(item => {
                if (item.code === 200 && item.body) priceMap[item.body.id] = item.body.price;
            });
        }

        // Detectar a quiénes bloqueó ML
        idsArray.forEach(id => {
            if (priceMap[id] === undefined) fallbackIds.push(id);
        });

        // FASE 2: Scraper Indetectable para la Competencia
        if (fallbackIds.length > 0) {
            console.log(`\n🕵️ Fase 2: ${fallbackIds.length} productos bloqueados. Activando Scraper Indetectable...`);
            
            for (const id of fallbackIds) {
                try {
                    const searchId = id.replace('MLA', 'MLA-');
                    const url = `https://articulo.mercadolibre.com.ar/${searchId}`;
                    
                    const res = await fetch(url, {
                        headers: { 
                            // Nuestro disfraz perfecto comprobado en el test
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                            'Accept-Language': 'es-AR,es;q=0.9,en-US;q=0.8,en;q=0.7',
                            'Connection': 'keep-alive',
                            'Upgrade-Insecure-Requests': '1'
                        }
                    });
                    
                    if (res.ok) {
                        const html = await res.text();
                        
                        // Los 3 métodos de extracción (Priorizando el Modo Oculto JSON que funcionó)
                        const matchJson = html.match(/"price":(\d+(\.\d+)?)/);
                        const matchMeta = html.match(/<meta itemprop="price" content="([^"]+)"/);
                        const matchAndes = html.match(/<span class="andes-money-amount__fraction">([\d.,]+)<\/span>/);
                        
                        let price = null;
                        if (matchJson) {
                            price = parseFloat(matchJson[1]);
                        } else if (matchMeta) {
                            price = parseFloat(matchMeta[1]);
                        } else if (matchAndes) {
                            price = parseFloat(matchAndes[1].replace(/\./g, '').replace(',', '.'));
                        }

                        if (price !== null) {
                            priceMap[id] = price;
                            console.log(`   ✔️ Precio capturado: ${searchId} -> $${price}`);
                        } else {
                            console.log(`   ⚠️ Pausado o sin precio visible: ${searchId}`);
                        }
                    }
                } catch (err) {
                    console.log(`   ⚠️ Error de red con: ${id}`);
                }
                // Freno de mano de 1.5 segundos para no alertar a ML de que somos una máquina
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }

        // FASE 3: Guardar en Base de Datos
        console.log('\n✅ Extracción terminada. Actualizando base de datos...');
        let updates = 0;
        
        for (const p of products) {
            let changed = false;
            const myId = extractMlId(p.my_url);
            
            if (myId && priceMap[myId] !== undefined && priceMap[myId] !== p.my_price) {
                p.my_price = priceMap[myId];
                changed = true;
            }

            p.competitors?.forEach(c => {
                const cId = extractMlId(c.url);
                if (cId && priceMap[cId] !== undefined && priceMap[cId] !== c.price) {
                    c.price = priceMap[cId];
                    changed = true;
                }
            });

            if (changed) {
                await supabase.from(TABLE).update({
                    my_price: p.my_price,
                    competitors: p.competitors,
                    updated_at: new Date().toISOString()
                }).eq('id', p.id);
                updates++;
                console.log(`✅ Guardado en Supabase: ${p.name}`);
            }
        }
        console.log(`\n🎉 Fin del proceso. Productos actualizados: ${updates}`);
    } catch (e) { console.error('❌ Error crítico:', e.message); }
}

run();