const fs = require('fs');

const inputFile = 'C:\\Users\\Eneas\\Documents\\Fashion\\Workflow_Supabase_V2.1_DEFINITIVO.json';
const outputFile = 'C:\\Users\\Eneas\\Documents\\Fashion\\Workflow_Supabase_V2.1_CORRIGIDO.json';

const workflow = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

// Mapa manual baseado nas mudanças feitas pelos scripts anteriores
const renameMap = {
    'Get many rows': 'Buscar Posts Pendentes (Supabase)',
    'Adiciona URL do post': 'Salva URL Instagram (Supabase)',
    'Atualiza post instagram': 'Atualiza status instagram (Supabase)',
    'Atualiza post facebook': 'Atualiza status facebook (Supabase)',
    'Atualiza post Youtube': 'Atualiza status youtube (Supabase)',
    'Atualiza post X': 'Atualiza status x (Supabase)',
    'Atualiza post X1': 'Atualiza status x (Supabase)',
    'Atualiza post Tiktok': 'Atualiza status tiktok (Supabase)',
    'Atualiza post Linkedin': 'Atualiza status linkedin (Supabase)',
    'Atualiza post Threads': 'Atualiza status threads (Supabase)',
    'Update a row1': 'Finalizar Post (Supabase)',
    'Atualiza post final': 'Finalizar Post (Supabase)'
};

const validNodeNames = new Set(workflow.nodes.map(n => n.name));

// 1. Atualizar chaves do objeto connections
const newConnections = {};
for (const [sourceName, targets] of Object.entries(workflow.connections)) {
    let newSourceName = sourceName;

    // Se a chave (nome do nó de origem) mudou, use o novo nome
    if (renameMap[sourceName]) {
        newSourceName = renameMap[sourceName];
    }

    // Se o nó de origem não existe mais nem no mapa nem nos nós atuais, e não logamos ainda, avise
    if (!validNodeNames.has(newSourceName)) {
        console.warn(`Aviso: Nó de origem '${sourceName}' não encontrado nos nós atuais.`);
    }

    // 2. Atualizar alvos (destinos)
    if (targets && targets.main) {
        const newMain = targets.main.map(subOutput => {
            return subOutput.map(connection => {
                let targetNode = connection.node;

                // Verificar se o target precisa ser renomeado
                if (renameMap[targetNode]) {
                    targetNode = renameMap[targetNode];
                }

                // Debug: Verificar se link quebrado
                if (!validNodeNames.has(targetNode)) {
                    // Tentar encontrar case-insensitive se falhar
                    const match = Array.from(validNodeNames).find(n => n.toLowerCase() === targetNode.toLowerCase());
                    if (match) targetNode = match;
                    else console.error(`ERRO CRÍTICO: Conexão de '${newSourceName}' aponta para '${targetNode}' que não existe!`);
                }

                return {
                    ...connection,
                    node: targetNode
                };
            });
        });

        // Atribuir ao novo objeto de conexões
        if (!newConnections[newSourceName]) {
            newConnections[newSourceName] = {};
        }
        newConnections[newSourceName].main = newMain;
    }
}

workflow.connections = newConnections;

workflow.name = workflow.name.replace("(100% SUPABASE MIGRATED)", "(CONEXOES CORRIGIDAS)");

fs.writeFileSync(outputFile, JSON.stringify(workflow, null, 2));
console.log('Reparo de conexões concluído: ' + outputFile);
