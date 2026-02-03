const fs = require('fs');

const inputFile = 'C:\\Users\\Eneas\\Documents\\Fashion\\Workflow_Supabase_V2.1_Final.json';
const outputFile = 'C:\\Users\\Eneas\\Documents\\Fashion\\Workflow_Supabase_V2.1_DEFINITIVO.json';

const workflow = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

// Mapa de plataformas
const platformMap = {
    'instagram': 'instagram',
    'facebook': 'facebook',
    'youtube': 'youtube',
    'x': 'x',
    'tiktok': 'tiktok',
    'linkedin': 'linkedin',
    'threads': 'threads',
    'pinterest': 'pinterest'
};

workflow.nodes = workflow.nodes.map(node => {
    if (node.type === 'n8n-nodes-base.baserow') {
        const lowerName = node.name.toLowerCase();
        let query = '';
        let newName = node.name.replace('Baserow', 'Postgres');

        // Detectar qual plataforma atualizar
        let platform = '';
        for (const [key, value] of Object.entries(platformMap)) {
            if (lowerName.includes(key)) {
                platform = value;
                break;
            }
        }

        if (platform) {
            // Update status_detalhado
            query = `UPDATE public.posts SET status_detalhado = jsonb_set(COALESCE(status_detalhado, '{}'::jsonb), '{${platform}}', '"true"') WHERE id = '{{ $('Adapter').item.json["id-row"] }}';`;
            newName = `Atualiza status ${platform} (Supabase)`;
        } else if (lowerName.includes('final') || lowerName.includes('todas') || lowerName.includes('row1') || lowerName.includes('update')) {
            // Update final (pode ser o "Update a row1" que é o final ou Threads se não caiu no if anterior)
            // Assumindo que nós genéricos de update no final são para marcar como concluído
            query = `UPDATE public.posts SET postado_em_todas = true WHERE id = '{{ $('Adapter').item.json["id-row"] }}';`;
            newName = `Finalizar Post (Supabase)`;
        }

        if (query) {
            return {
                ...node,
                type: 'n8n-nodes-base.postgres',
                typeVersion: 2.2,
                name: newName,
                parameters: {
                    operation: 'executeQuery',
                    query: query,
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
    }
    return node;
});

workflow.name = workflow.name.replace("(FINAL - SUPABASE ONLY)", "(100% SUPABASE MIGRATED)");

fs.writeFileSync(outputFile, JSON.stringify(workflow, null, 2));
console.log('Migração 100% concluída: ' + outputFile);
