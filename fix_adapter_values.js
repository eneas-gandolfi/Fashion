const fs = require('fs');

const inputFile = 'C:\\Users\\Eneas\\Documents\\Fashion\\⭐️ [ALUNOS] Postagem automática V2.1 - (Vídeo, Imagem e Story) (CONEXOES CORRIGIDAS) (1).json';
const outputFile = 'C:\\Users\\Eneas\\Documents\\Fashion\\Workflow_Supabase_V2.1_CORRIGIDO_V2.json';

const workflow = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

// Novo código JS do Adapter com mapeamento correto
const newAdapterCode = `
const item = $input.item.json;

// Parse arquivos
let arquivos = item.arquivos;
if (typeof arquivos === 'string') {
    try { arquivos = JSON.parse(arquivos); } catch(e) {}
}

// Mapas de Validação (Frontend sends lowercase, N8N expects Title Case/Accents)
const mapMidia = {
    'video': 'Vídeo',
    'imagem': 'Imagem',
    'story': 'Story',
    'reels': 'Vídeo'
};

const mapTipo = {
    'unica': 'Única',
    'carrossel': 'Carrossel'
};

const midiaNormalizada = mapMidia[item.midia_tipo] || item.midia_tipo; // Fallback to original
const tipoNormalizado = mapTipo[item.post_tipo] || item.post_tipo;

return {
    json: {
        ...item,
        // Compatibilidade Baserow (Mapeamento Normalizado)
        "Arquivo_media": [ { url: arquivos && arquivos[0] ? arquivos[0].url : '' } ],
        "Texto IG|FB": item.texto_instagram_facebook || '',
        "Texto Youtube": item.texto_youtube || '',
        "Texto X|Threads|Tiktok": item.texto_x_threads_tiktok || '',
        "Texto Linkedin": item.texto_linkedin || '',
        
        "Vídeo ou imagem?": { value: midiaNormalizada },
        "Única ou Carrossel?": { value: tipoNormalizado }, 
        
        "Foi postado no IG?": { value: item.status_detalhado?.instagram === 'true' ? 'sim' : 'nao' },
        "Foi postado no Youtube?": { value: item.status_detalhado?.youtube === 'true' ? 'sim' : 'nao' },
        "Foi postado no X?": { value: item.status_detalhado?.x === 'true' ? 'sim' : 'nao' },
        "Foi postado no FB?": { value: item.status_detalhado?.facebook === 'true' ? 'sim' : 'nao' },
        "Foi postado no TiKTok?": { value: item.status_detalhado?.tiktok === 'true' ? 'sim' : 'nao' },
        "Postou em todas?": { value: item.postado_em_todas ? 'sim' : 'nao' },
        "Foi postado no Linkedin?": { value: item.status_detalhado?.linkedin === 'true' ? 'sim' : 'nao' },
        "Foi postado no Pinterest": { value: 'nao' },
        "Foi postado no Threads": { value: item.status_detalhado?.threads === 'true' ? 'sim' : 'nao' },
        
        // Carrrossel Helpers
        "carrossel-1": arquivos && arquivos[0] ? [{ url: arquivos[0].url }] : [],
        "carrossel-2": arquivos && arquivos[1] ? [{ url: arquivos[1].url }] : [],
        "carrossel-3": arquivos && arquivos[2] ? [{ url: arquivos[2].url }] : [],
        "carrossel-4": arquivos && arquivos[3] ? [{ url: arquivos[3].url }] : [],
        "carrossel-5": arquivos && arquivos[4] ? [{ url: arquivos[4].url }] : [],
        "id-row": item.id
    }
};
`;

workflow.nodes = workflow.nodes.map(node => {
    if (node.name === 'Adapter' && node.type === 'n8n-nodes-base.code') {
        return {
            ...node,
            parameters: {
                jsCode: newAdapterCode
            }
        };
    }
    return node;
});

workflow.name = workflow.name.replace("(CONEXOES CORRIGIDAS)", "(FIXED ADAPTER VALUES)");

fs.writeFileSync(outputFile, JSON.stringify(workflow, null, 2));
console.log('Correção de valores do Adapter concluída: ' + outputFile);
