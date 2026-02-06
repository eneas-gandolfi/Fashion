/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Ler .env.local manualmente
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLastPostAudit() {
    console.log('Querying Last Post (Any Status)...');

    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error fetching post:', error);
        return;
    }

    if (!posts || posts.length === 0) {
        console.log('No posts found in DB.');
        return;
    }

    const post = posts[0];
    console.log(`\n--- Post ID: ${post.id} ---`);
    console.log('Created At:', post.created_at);
    console.log('Postado em todas:', post.postado_em_todas);
    console.log('Status Detalhado COMPLETO:', JSON.stringify(post.status_detalhado, null, 2));

    const statusX = post.status_detalhado?.x;

    console.log('\n--- Reviewing X Status ---');
    console.log(`Value of x in status_detalhado: "${statusX}"`);

    if (statusX === 'true') {
        console.warn('RESULT: X was marked as "true" (done/skipped) in the database.');
        console.warn('MEANS: The frontend sent a platform list THAT DID NOT INCLUDE "x".');
        console.warn('This confirms the user executed the tool without "X" effectively selected (or before the fix applied).');
    } else {
        console.log('RESULT: X is NOT marked as "true". It should be processed.');
        console.log('MEANS: If N8N skipped it, there is a bug in N8N logic or Switch node.');
    }
}

checkLastPostAudit();
