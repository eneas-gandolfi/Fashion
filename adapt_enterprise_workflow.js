const fs = require('fs');

const inputFile = 'C:\\Users\\Eneas\\Documents\\Fashion\\⭐️ [ORCHESTRATOR] Postagem Automática - Enterprise (Sub-workflows por Plataforma).json';
const outputFile = 'C:\\Users\\Eneas\\Documents\\Fashion\\Workflow_Enterprise_Supabase_Ready.json';

const workflow = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

// 1. ADD WEBHOOK TRIGGER
const webhookNode = {
    "parameters": {
        "httpMethod": "POST",
        "path": "trigger-post",
        "options": {}
    },
    "name": "Webhook (Post Now)",
    "type": "n8n-nodes-base.webhook",
    "typeVersion": 1,
    "position": [-12500, 10800],
    "id": "webhook-trigger-ent"
};

workflow.nodes.push(webhookNode);

// Connect Webhook to "Buscar Posts Pendentes (Supabase)"
// The Postgres node ID is 'a3e479e6-78b2-4586-9828-1b466f96c260' (based on view_file output, checking dynamically)
const postgresNode = workflow.nodes.find(n => n.name === 'Buscar Posts Pendentes (Supabase)');
if (postgresNode) {
    if (!workflow.connections['Webhook (Post Now)']) {
        workflow.connections['Webhook (Post Now)'] = { main: [] };
    }
    workflow.connections['Webhook (Post Now)'].main.push([
        { node: postgresNode.name, type: 'main', index: 0 }
    ]);
}

// 2. UPDATE CREDENTIALS
// Using the ID found in V2.3 file: "zkfuFOWzek83XLiq" (Fashion - Postgres)
// The file has this ID already! But let's verify.
// In the viewed file, it is: "id": "zkfuFOWzek83XLiq", "name": "Fashion - Postgres".
// So credentials might already be correct if the user exported from the same instance. 
// We will force it just in case.
workflow.nodes.forEach(node => {
    if (node.type === 'n8n-nodes-base.postgres') {
        if (!node.credentials) node.credentials = {};
        node.credentials.postgres = {
            id: "zkfuFOWzek83XLiq",
            name: "Fashion - Postgres"
        };
    }
});

// 3. UPDATE LOGIC: Code Node "Normalize + Expande Plataformas"
// Problem: Backend might not send 'plataformas' column. We must infer from 'status_detalhado'.
const codeNode = workflow.nodes.find(n => n.name === 'Normalize + Expande Plataformas');
if (codeNode) {
    // Inject robust logic
    codeNode.parameters.jsCode = `
// Recebe 1 post (linha do Supabase) e transforma em N itens (1 por plataforma selecionada)
const post = $json;

// Lógica Híbrida: Se tiver coluna 'plataformas', usa. Se não, infere do 'status_detalhado'.
let plataformasRaw = post.plataformas;

if (!Array.isArray(plataformasRaw)) {
  const allPlatforms = ['instagram', 'facebook', 'youtube', 'x', 'tiktok', 'linkedin', 'threads', 'pinterest'];
  const status = post.status_detalhado || {};
  // Se status NÃO for 'true', significa que está pendente ou foi selecionado (pois o frontend marca os não-selecionados como 'true')
  plataformasRaw = allPlatforms.filter(p => status[p] !== 'true');
}

const plataformas = Array.isArray(plataformasRaw)
  ? plataformasRaw.map(p => String(p).toLowerCase()).filter(Boolean)
  : [];

// Normaliza status_detalhado (pode vir null)
const status = post.status_detalhado ?? {};

// Helper: ainda não postou nessa plataforma?
const notPosted = (key) => status?.[key] !== 'true';

// Cria lista final de plataformas que DEVEM ser postadas agora (selecionada && pendente)
const toPost = [];
for (const p of plataformas) {
  const key = (p === 'x') ? 'x' : p;
  if (notPosted(key)) toPost.push(p);
}

// Se nada a fazer, não retorna item (evita desperdício)
if (toPost.length === 0) return [];

return toPost.map((platform) => ({
  json: {
    platform,
    post_id: post.id,
    midia_tipo: post.midia_tipo,
    post_tipo: post.post_tipo,
    // Garante Textos
    texto_instagram_facebook: post.texto_instagram_facebook ?? '',
    texto_youtube: post.texto_youtube ?? '',
    texto_x_threads_tiktok: post.texto_x_threads_tiktok ?? '',
    texto_linkedin: post.texto_linkedin ?? '',
    // Garante Arquivos
    arquivos: typeof post.arquivos === 'string' ? JSON.parse(post.arquivos) : post.arquivos,
    
    status_detalhado: status,
    // Regras SaaS: idempotência (chave determinística por post+plataforma)
    idempotency_key: \`\${post.id}:\${platform}\`,
    
    // Passar Tokens se necessário (o Switch original passava Token-instagram, etc. Se os sub-workflows precisarem, tem que vir do banco ou credenciais)
  }
}));
`;
}

workflow.name += " (Supabase Adapted)";

fs.writeFileSync(outputFile, JSON.stringify(workflow, null, 2));
console.log('Workflow Enterprise adaptado salvo em: ' + outputFile);
