const fs = require('fs');
let content = fs.readFileSync('src/utils/chainResolver.ts', 'utf8');

// Remove static imports from mockData
content = content.replace(
  /import \{\n[\s\S]*?\} from '@\/data\/mockData';\n/,
  ''
);

// We need to add the GovernanceData type. Let's just use `any` for now for the `governanceData` parameter, or import GovernanceData.
content = content.replace(
  /export function resolveChain\(type: ChainNodeType, id: string\): ResolvedChain \{/,
  "export function resolveChain(type: ChainNodeType, id: string, data: any): ResolvedChain {\n  const { businessObjectives = [], risks = [], controls = [], implementations = [], kpis = [], executiveDecisions = [], complianceRequirements = [], incidents = [], evidences = [] } = data;"
);

// We need to pass data to all resolveFrom* functions.
content = content.replace(/return resolveFromObjective\(id\);/g, "return resolveFromObjective(id, data);");
content = content.replace(/return resolveFromRisk\(id\);/g, "return resolveFromRisk(id, data);");
content = content.replace(/return resolveFromControl\(id\);/g, "return resolveFromControl(id, data);");
content = content.replace(/return resolveFromImplementation\(id\);/g, "return resolveFromImplementation(id, data);");
content = content.replace(/return resolveFromEvidence\(id\);/g, "return resolveFromEvidence(id, data);");
content = content.replace(/return resolveFromCompliance\(id\);/g, "return resolveFromCompliance(id, data);");
content = content.replace(/return resolveFromKPI\(id\);/g, "return resolveFromKPI(id, data);");
content = content.replace(/return resolveFromDecision\(id\);/g, "return resolveFromDecision(id, data);");
content = content.replace(/return resolveFromIncident\(id\);/g, "return resolveFromIncident(id, data);");

// Now update all `function resolveFrom*(id: string): ResolvedChain {` to accept `data: any`
// and extract the arrays.
content = content.replace(
  /function resolveFrom([A-Za-z]+)\(([^)]+)\): ResolvedChain \{/g,
  "function resolveFrom$1($2, data: any): ResolvedChain {\n  const { businessObjectives = [], risks = [], controls = [], implementations = [], kpis = [], executiveDecisions = [], complianceRequirements = [], incidents = [], evidences = [] } = data;"
);

fs.writeFileSync('src/utils/chainResolver.ts', content);
