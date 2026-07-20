const fs = require('fs');
let content = fs.readFileSync('src/pages/dashboard/ExecutiveCommandCenter.tsx', 'utf8');

// Replace imports
content = content.replace(
  /import \{\n\s*risks, businessObjectives, kpis, executiveDecisions,\n\} from '@\/data\/mockData';/,
  "import { useGovernance } from '@/contexts/GovernanceContext';"
);

// We need to inject useGovernance hook in ExecutiveCommandCenter.
content = content.replace(
  /export default function ExecutiveCommandCenter\(\) \{/,
  "export default function ExecutiveCommandCenter() {\n  const { data: { risks, businessObjectives, kpis, executiveDecisions } } = useGovernance();"
);

// For the `currentRisks`, etc., we remove `mockDataActive` check for master data.
// Replace: `const currentRisks = mockDataActive ? risks : [];` with `const currentRisks = risks;`
content = content.replace(/const currentRisks = mockDataActive \? risks : \[\];/g, "const currentRisks = risks;");
content = content.replace(/const currentBusinessObjectives = mockDataActive \?\s*businessObjectives : \[\];/g, "const currentBusinessObjectives = businessObjectives;");
content = content.replace(/const currentKpis = mockDataActive \? kpis : \[\];/g, "const currentKpis = kpis;");
content = content.replace(/const currentExecutiveDecisions = mockDataActive \?\s*executiveDecisions : \[\];/g, "const currentExecutiveDecisions = executiveDecisions;");

// Update complianceAvg calculation which uses currentKpis
content = content.replace(
  /const complianceAvg = mockDataActive \?\s*Math\.round\(currentKpis\.filter\(k => k\.category === 'Compliance'\)\.reduce\(\(a, k\) => a \+ k\.currentValue, 0\) \/ Math\.max\(1, currentKpis\.filter\(k => k\.category === 'Compliance'\)\.length\)\) : 0;/g,
  "const complianceAvg = Math.round(currentKpis.filter(k => k.category === 'Compliance').reduce((a, k) => a + k.currentValue, 0) / Math.max(1, currentKpis.filter(k => k.category === 'Compliance').length));"
);

fs.writeFileSync('src/pages/dashboard/ExecutiveCommandCenter.tsx', content);
