const fs = require('fs');

const inputFile = 'C:\\Users\\Eneas\\Documents\\Fashion\\Workflow_Supabase_V2.1_CORRIGIDO_V2.json';
const outputFile = 'C:\\Users\\Eneas\\Documents\\Fashion\\Workflow_Supabase_V2.2_FINAL_CHECK.json';

const workflow = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

console.log('--- Analisando Conexões do Switch1 (Imagem) ---');
const connections = workflow.connections || {};
const switch1 = connections['Switch1'];

if (switch1 && switch1.main) {
    // Switch1 Outputs:
    // 0: Instagram
    // 1: Facebook
    // 2: Youtube (Should be empty for Image? Or connected to something else?)
    // 3: X
    // ...

    // CORRECTION: Output 2 (Youtube) is currently connected to X/twitter-imagem. This is WRONG.
    // We will clear Output 2 (Youtube) for Images because Youtube doesn't support image posts easily 
    // (or at least we dont want to send images to the X node).

    if (switch1.main[2] && switch1.main[2].length > 0) {
        console.log(`[FIX] Output 2 (Youtube) was connected to: ${switch1.main[2][0].node}. Removing connection.`);
        switch1.main[2] = [];
    }

    // Verify Output 3 (X)
    if (switch1.main[3] && switch1.main[3].length > 0) {
        console.log(`[CHECK] Output 3 (X) is connected to: ${switch1.main[3][0].node}`);
    } else {
        console.log('[ERROR] Output 3 (X) is NOT CONNECTED!');
    }
}

// 2. BREAK DAISY CHAIN (Sequential execution problem)
// The user reported that selecting one platform triggers all subsequent ones.
// This is because the workflow is chained: Insta -> Wait -> FB -> Wait -> X ...
// We need to break these links to allow parallel/independent execution via Switch.

const nodesToDisconnect = [
    'Wait',   // Video Chain
    'Wait2',
    'Wait3',
    'Wait5',
    // 'Wait6', // Ends the chain usually
    'Wait1',  // Image Chain
    'Wait4',
    'Wait9',
    'Wait10',
    'Wait11'
];

nodesToDisconnect.forEach(nodeName => {
    if (connections[nodeName]) {
        console.log(`[FIX] Breaking chain at node: ${nodeName}. Removing connection to next platform.`);
        connections[nodeName].main = [[]]; // Allow execution to finish here
        // OR delete connections[nodeName]; to be safer, but empty array is usually fine for "End".
    }
});

workflow.name = "⭐️ [ALUNOS] Postagem automática V2.3 - PARALLEL FIX";
console.log('--- Correcão de Encadeamento Aplicada ---');

