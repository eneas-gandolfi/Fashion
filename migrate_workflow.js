const fs = require('fs');
const path = require('path');

const inputFile = 'C:\\Users\\Eneas\\Documents\\Fashion\\⭐️ [ALUNOS] Postagem automática V2.1 - (Vídeo, Imagem e Story).json';
const outputFile = 'C:\\Users\\Eneas\\Documents\\Fashion\\Workflow_Supabase_V2.1_Migrado.json';

const workflow = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

// Mapa de nós para substituir
const newNodes = [];
const connections = workflow.connections;

// Função para criar nó Postgres de Leitura
function createPostgresReadNode(originalNode) {
    return {
        ...originalNode,
        type: 'n8n-nodes-base.postgres',
        typeVersion: 2.2,
        name: 'Buscar Posts Pendentes (Supabase)',
        parameters: {
            operation: 'executeQuery',
            query: "SELECT * FROM public.posts WHERE postado_em_todas = false ORDER BY created_at ASC;",
            options: {}
        },
        credentials: {
            postgres: {
                id: "MUDAR_PARA_SEU_ID",
                name: "Postgres account"
            }
        }
    };
}

// Nó de Adaptação (Code) para converter snake_case -> Baserow format
function createAdapterNode(originalNodeId, position) {
    return {
        id: 'adapter-node-' + Date.now(),
        name: 'Adaptador Supabase',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [position[0] + 200, position[1]], // Shift a bit
        parameters: {
            jsCode: `
const item = $input.item.json;

// Parse arquivos
let arquivos = item.arquivos;
if (typeof arquivos === 'string') {
    try { arquivos = JSON.parse(arquivos); } catch(e) {}
}

return {
    json: {
        ...item,
        // Compatibilidade Baserow
        "Arquivo_media": [ { url: arquivos && arquivos[0] ? arquivos[0].url : '' } ],
        "Texto IG|FB": item.texto_instagram_facebook || '',
        "Texto Youtube": item.texto_youtube || '',
        "Texto X|Threads|Tiktok": item.texto_x_threads_tiktok || '',
        "Texto Linkedin": item.texto_linkedin || '',
        "Vídeo ou imagem?": { value: item.midia_tipo },
        "Única ou Carrossel?": { value: item.post_tipo }, 
        "Foi postado no IG?": { value: item.status_detalhado?.instagram === 'true' ? 'sim' : 'nao' },
        "Foi postado no Youtube?": { value: item.status_detalhado?.youtube === 'true' ? 'sim' : 'nao' },
        "Foi postado no X?": { value: item.status_detalhado?.x === 'true' ? 'sim' : 'nao' },
        "Foi postado no FB?\": { value: item.status_detalhado?.facebook === 'true' ? 'sim' : 'nao' },
        "Foi postado no TiKTok?": { value: item.status_detalhado?.tiktok === 'true' ? 'sim' : 'nao' },
        "Postou em todas?": { value: item.postado_em_todas ? 'sim' : 'nao' },
        "Foi postado no Linkedin?": { value: item.status_detalhado?.linkedin === 'true' ? 'sim' : 'nao' },
        "Foi postado no Pinterest": { value: 'nao' },
        "Foi postado no Threads": { value: item.status_detalhado?.threads === 'true' ? 'sim' : 'nao' },
        
        // Carrossel
        "carrossel-1": arquivos && arquivos[0] ? [{ url: arquivos[0].url }] : [],
        "carrossel-2": arquivos && arquivos[1] ? [{ url: arquivos[1].url }] : [],
        "carrossel-3": arquivos && arquivos[2] ? [{ url: arquivos[2].url }] : [],
        "carrossel-4": arquivos && arquivos[3] ? [{ url: arquivos[3].url }] : [],
        "carrossel-5": arquivos && arquivos[4] ? [{ url: arquivos[4].url }] : [],
        "id-row": item.id
    }
};
            `
        }
    };
}

// Processar os nós
workflow.nodes = workflow.nodes.map(node => {
    // 1. Substituir Leitura do Baserow ("Get many rows")
    if (node.type === 'n8n-nodes-base.baserow' && node.name === 'Get many rows') {
        const newNode = createPostgresReadNode(node);
        // Precisamos inserir o Adaptador DEPOIS deste nó
        // Isso é complexo no array map, vamos lidar ajustando as conexões depois
        newNode.name = 'Buscar Posts Pendentes (Supabase)';
        return newNode;
    }

    // 2. Substituir Updates (Instagram, Facebook, Youtube, etc)
    if (node.type === 'n8n-nodes-base.baserow' && node.name.startsWith('Atualiza')) {
        let platformField = '';
        if (node.name.toLowerCase().includes('instagram')) platformField = 'instagram';
        if (node.name.toLowerCase().includes('facebook')) platformField = 'facebook';
        if (node.name.toLowerCase().includes('youtube')) platformField = 'youtube';

        if (platformField) {
            return {
                ...node,
                type: 'n8n-nodes-base.postgres',
                typeVersion: 2.2,
                parameters: {
                    operation: 'executeQuery',
                    query: `UPDATE public.posts SET status_detalhado = jsonb_set(COALESCE(status_detalhado, '{}'::jsonb), '{${platformField}}', '"true"') WHERE id = '{{ $('Adapter').item.json["id-row"] }}';`,
                    options: {}
                }
            };
        }
    }

    return node;
});

// Adicionar Webhook e Cron
workflow.nodes.push({
    "parameters": {
        "httpMethod": "POST",
        "path": "trigger-post",
        "options": {}
    },
    "name": "Webhook (Post Now)",
    "type": "n8n-nodes-base.webhook",
    "typeVersion": 1,
    "position": [-3600, 4200],
    "id": "webhook-trigger-new"
});

workflow.nodes.push({
    "parameters": {
        "rule": {
            "interval": [{ "field": "minutes", "minutesInterval": 30 }]
        }
    },
    "name": "Agendamento (30min)",
    "type": "n8n-nodes-base.scheduleTrigger",
    "typeVersion": 1.1,
    "position": [-3600, 4400],
    "id": "schedule-trigger-new"
});

// Ajustar Conexões
// Conectar Webhook e Schedule ao "Buscar Posts Pendentes (Supabase)"
// Precisamos encontrar o ID do nó de leitura
const readNode = workflow.nodes.find(n => n.name === 'Buscar Posts Pendentes (Supabase)');
if (readNode) {
    if (!workflow.connections['Webhook (Post Now)']) workflow.connections['Webhook (Post Now)'] = { main: [] };
    workflow.connections['Webhook (Post Now)'].main.push([{ node: readNode.name, type: 'main', index: 0 }]);

    if (!workflow.connections['Agendamento (30min)']) workflow.connections['Agendamento (30min)'] = { main: [] };
    workflow.connections['Agendamento (30min)'].main.push([{ node: readNode.name, type: 'main', index: 0 }]);
}

// Inserir nó Adaptador entre Read e o próximo (Loop ou Split)
// Simplificação: Vamos assumir que o próximo nó é o 'Limit' ou 'informacoes'
// Vamos adicionar o Code Node Adapter na lista de nodes e fazer ele ser o destino do Postgres Read

const adapterNode = createAdapterNode('adapter', [-2900, 4400]);
adapterNode.name = 'Adapter';
workflow.nodes.push(adapterNode);

// Redirecionar saída do Postgres Read para o Adapter
if (readNode) {
    // Apagar conexões antigas saindo do Baserow Read (se houver no objeto connections)
    // Na verdade, o objeto connections usa o NOME do nó como chave.
    // Como mudamos o nome para 'Buscar Posts Pendentes (Supabase)', as conexões antigas 'Get many rows' ficaram órfãs.
    // Mas precisamos ver QUEM consumia 'Get many rows'.

    const oldReadName = 'Get many rows';
    const consumers = workflow.connections[oldReadName]; // Quem 'Get many rows' alimentava?

    workflow.connections['Buscar Posts Pendentes (Supabase)'] = {
        main: [[{ node: 'Adapter', type: 'main', index: 0 }]]
    };

    // O Adapter deve alimentar quem o 'Get many rows' alimentava
    if (consumers && consumers.main) {
        workflow.connections['Adapter'] = consumers;
    }

    delete workflow.connections[oldReadName];
}

workflow.name += " (MIGRADO SUPABASE)";

fs.writeFileSync(outputFile, JSON.stringify(workflow, null, 2));
console.log('Migração concluída: ' + outputFile);
