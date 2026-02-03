const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Ler .env.local
const envPath = path.join(__dirname, 'fashion-post-tool/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
// PRECISARÍAMOS DA SERVICE_ROLE_KEY PARA ALTERAR SCHEMA. 
// A ANON KEY NÃO PERMITE DDL (ALTER TABLE).
// MAS... Se o usuário roda local e talvez tenha permissões relaxadas ou functions DDL, podemos tentar.
// Se falhar, pediremos ao usuário para rodar o SQL no SQL Editor do Supabase.

// Vou tentar usar a ANON KEY mas é provável que falhe para ALTER TABLE.
// Se falhar, vou notificar o usuário para rodar manualmente.
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

console.log('Tentando conectar ao Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

const sql = fs.readFileSync('c:\\Users\\Eneas\\Documents\\Fashion\\migration_add_plataformas.sql', 'utf8');

async function runMigration() {
    // Supabase JS Client não suporta rodar SQL arbitrário diretamente via client-side/anon sem uma Function RPC configurada.
    // O que podemos fazer é tentar chamar uma RPC se existir, ou apenas avisar o usuário.
    // COMO NÃO TEMOS RPC DE EXEC_SQL, VAMOS PULAR A EXECUÇÃO AUTOMÁTICA E PEDIR PRO USUÁRIO.

    console.log('⚠️  ATENÇÃO: Não é possível rodar ALTER TABLE via script client-side (segurança).');
    console.log('⚠️  POR FAVOR, RODE O SQL ABAIXO NO SEU SUPABASE SQL EDITOR:');
    console.log('\n' + sql + '\n');
}

runMigration();
