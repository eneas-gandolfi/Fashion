const fs = require('fs');

const inputFile = 'C:\\Users\\Eneas\\Documents\\Fashion\\Workflow_Supabase_V2.1_Migrado.json';
const outputFile = 'C:\\Users\\Eneas\\Documents\\Fashion\\Workflow_Supabase_V2.1_Final.json';

const workflow = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

// Processar os nós
workflow.nodes = workflow.nodes.map(node => {

    // Substituir "Adiciona URL do post" (Baserow) -> Postgres Update
    if (node.type === 'n8n-nodes-base.baserow' && node.name === 'Adiciona URL do post') {
        return {
            ...node,
            type: 'n8n-nodes-base.postgres',
            typeVersion: 2.2,
            name: 'Salva URL Instagram (Supabase)',
            parameters: {
                operation: 'executeQuery',
                // Atualiza o status_detalhado com o permalink
                query: `UPDATE public.posts SET status_detalhado = jsonb_set(COALESCE(status_detalhado, '{}'::jsonb), '{instagram_permalink}', to_jsonb('{{ $json.permalink }}'::text)) WHERE id = '{{ $('Adapter').item.json["id-row"] }}';`,
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

    return node;
});

workflow.name = workflow.name.replace("(MIGRADO SUPABASE)", "(FINAL - SUPABASE ONLY)");

fs.writeFileSync(outputFile, JSON.stringify(workflow, null, 2));
console.log('Migração final concluída: ' + outputFile);
