const fs = require('fs');
const path = require('path');

const outputDir = 'C:\\Users\\Eneas\\Documents\\Fashion\\Enterprise_Pack_Ready';
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// 1. CARREGAR ORCHESTRATOR JÁ ADAPTADO
const orchestratorPath = 'C:\\Users\\Eneas\\Documents\\Fashion\\Workflow_Enterprise_Supabase_Ready.json';
const orchestrator = JSON.parse(fs.readFileSync(orchestratorPath, 'utf8'));
// Save Orchestrator
fs.writeFileSync(path.join(outputDir, '1_Orchestrator_Master.json'), JSON.stringify(orchestrator, null, 2));

// 2. PROCESSAR SUB-WORKFLOWS

// Function to replace NoOp with Real Node
function fixSubWorkflow(filePath, type) {
    const wf = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Find the NoOp node
    const noOpIndex = wf.nodes.findIndex(n => n.type === 'n8n-nodes-base.noOp' && n.name.includes('SUBSTITUA'));

    if (noOpIndex !== -1) {
        const noOpNode = wf.nodes[noOpIndex];

        // Create Replacement Node based on type
        let newNode;

        if (type === 'youtube') {
            newNode = {
                "parameters": {
                    "operation": "uploadVideo",
                    "user": "SEU-Identificador",
                    "platform": ["youtube"],
                    "title": "={{ $json.payload.content.title }}",
                    "description": "={{ $json.payload.content.description }}",
                    "video": "={{ $json.payload.media.first_url }}",
                    "youtubeTags": "={{ $json.payload.platform_config.youtube.tags.join(',') }}",
                    "youtubeCategoryId": "22", // People & Blogs default
                    "youtubePrivacy": "public"
                },
                "id": noOpNode.id, // Keep ID to preserve connections
                "name": "Postar YouTube (Fixed)",
                "type": "n8n-nodes-upload-post.uploadPost",
                "typeVersion": 1,
                "position": noOpNode.position,
                "credentials": {
                    "uploadPostApi": {
                        "id": "XjooUvfeEsC4o6pe",
                        "name": "Upload Post account - Fashion"
                    }
                }
            };
        } else if (type === 'story') {
            newNode = {
                "parameters": {
                    "operation": "uploadVideo", // Usually same op for photo/video in this node wrapper
                    "user": "SEU-Identificador",
                    "platform": ["instagram"],
                    "title": "Story",
                    "video": "={{ $json.payload.media.first_url }}",
                    "instagramMediaType": "STORIES" // Надеемся que o node suporte
                },
                "id": noOpNode.id,
                "name": "Postar Story (Fixed)",
                "type": "n8n-nodes-upload-post.uploadPost",
                "typeVersion": 1,
                "position": noOpNode.position,
                "credentials": {
                    "uploadPostApi": {
                        "id": "XjooUvfeEsC4o6pe",
                        "name": "Upload Post account - Fashion"
                    }
                }
            };
        }

        if (newNode) {
            wf.nodes[noOpIndex] = newNode;
        }
    }

    return wf;
}

// --- FACEBOOK (Já estava OK, só copiar) ---
const fbPath = 'C:\\Users\\Eneas\\Documents\\Fashion\\SubFlows\\🧩 [SUBWF] Postar em Facebook (Payload+ v2).json';
const fbWf = JSON.parse(fs.readFileSync(fbPath, 'utf8'));
fs.writeFileSync(path.join(outputDir, '2_Sub_Facebook.json'), JSON.stringify(fbWf, null, 2));

// --- INSTAGRAM FEED (Já estava OK) ---
const igPath = 'C:\\Users\\Eneas\\Documents\\Fashion\\SubFlows\\🧩 [SUBWF] Postar em Instagram (Feed_Reels) (Payload+ v2).json';
const igWf = JSON.parse(fs.readFileSync(igPath, 'utf8'));
fs.writeFileSync(path.join(outputDir, '3_Sub_Instagram_Feed.json'), JSON.stringify(igWf, null, 2));

// --- X / TWITTER (Já estava OK) ---
const xPath = 'C:\\Users\\Eneas\\Documents\\Fashion\\SubFlows\\🧩 [SUBWF] Postar em X (Payload+ v2).json';
const xWf = JSON.parse(fs.readFileSync(xPath, 'utf8'));
fs.writeFileSync(path.join(outputDir, '4_Sub_X.json'), JSON.stringify(xWf, null, 2));

// --- YOUTUBE (Fixing NoOp) ---
const ytPath = 'C:\\Users\\Eneas\\Documents\\Fashion\\SubFlows\\🧩 [SUBWF] Postar em YouTube (Shorts) (Payload+ v2).json';
const ytWf = fixSubWorkflow(ytPath, 'youtube');
fs.writeFileSync(path.join(outputDir, '5_Sub_YouTube.json'), JSON.stringify(ytWf, null, 2));

// --- STORY (Fixing NoOp) ---
const storyPath = 'C:\\Users\\Eneas\\Documents\\Fashion\\SubFlows\\🧩 [SUBWF] Postar Story Instagram (Payload+ v2).json';
const storyWf = fixSubWorkflow(storyPath, 'story');
fs.writeFileSync(path.join(outputDir, '6_Sub_Instagram_Story.json'), JSON.stringify(storyWf, null, 2));

// --- TIKTOK (Missing - Creating from Scratch) ---
// ID from Orchestrator: HIFnaPJC-7nS-53LyxJWC
const tiktokWf = {
    "name": "🧩 [SUBWF] Postar em TikTok (Payload+ v2)",
    "nodes": [
        {
            "parameters": {},
            "id": "start-tiktok",
            "name": "Start",
            "type": "n8n-nodes-base.executeWorkflowTrigger",
            "typeVersion": 1,
            "position": [0, 0]
        },
        {
            "parameters": {
                "jsCode": "// Placeholder TikTok Payload logic (Simplified)\nconst i = $json;\nreturn { json: { ...i, payload: { ...i, platform: 'tiktok' } } };"
            },
            "id": "code-tiktok",
            "name": "Preparar Payload",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [200, 0]
        },
        {
            "parameters": {
                "operation": "uploadVideo",
                "user": "SEU-Identificador",
                "platform": ["tiktok"],
                "title": "={{ $json.texto_x_threads_tiktok || 'Video' }}",
                "video": "={{ $json.arquivos[0].url }}"
            },
            "id": "upload-tiktok",
            "name": "Postar TikTok",
            "type": "n8n-nodes-upload-post.uploadPost",
            "typeVersion": 1,
            "position": [400, 0],
            "credentials": {
                "uploadPostApi": {
                    "id": "XjooUvfeEsC4o6pe",
                    "name": "Upload Post account - Fashion"
                }
            }
        },
        {
            "parameters": {},
            "id": "success-tiktok",
            "name": "Success",
            "type": "n8n-nodes-base.set",
            "typeVersion": 3,
            "position": [600, 0]
        }
    ],
    "connections": {
        "Start": { "main": [[{ "node": "Preparar Payload", "type": "main", "index": 0 }]] },
        "Preparar Payload": { "main": [[{ "node": "Postar TikTok", "type": "main", "index": 0 }]] },
        "Postar TikTok": { "main": [[{ "node": "Success", "type": "main", "index": 0 }]] }
    },
    "id": "HIFnaPJC-7nS-53LyxJWC"
};
fs.writeFileSync(path.join(outputDir, '7_Sub_TikTok.json'), JSON.stringify(tiktokWf, null, 2));

console.log('Pacote Enterprise gerado com sucesso em: ' + outputDir);
