const fs = require('fs');
const workflow = JSON.parse(fs.readFileSync('C:\\Users\\Eneas\\Documents\\Fashion\\Workflow_Supabase_V2.1_Final.json', 'utf8'));
const baserowNodes = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.baserow');
console.log('Nós Baserow restantes:', baserowNodes.map(n => n.name));
