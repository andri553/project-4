const fs = require('fs');
let content = fs.readFileSync('src/pages/ModulePages.tsx', 'utf8');

// replace the import
content = content.replace(
  /import \{\n\s*risks, complianceRequirements, roadmapInitiatives, kpis,\n\} from '@\/data\/mockData';/g,
  "import { useGovernance } from '@/contexts/GovernanceContext';"
);

// inside RiskManagementPage
content = content.replace(
  /export function RiskManagementPage\(\) \{\n\s*const \{\s*openWorkflow\s*\} = useWorkflow\(\);/g,
  "export function RiskManagementPage() {\n  const { openWorkflow } = useWorkflow();\n  const { data: { risks } } = useGovernance();"
);

// inside ComplianceManagementPage
content = content.replace(
  /export function ComplianceManagementPage\(\) \{/g,
  "export function ComplianceManagementPage() {\n  const { data: { complianceRequirements } } = useGovernance();"
);

// inside SecurityRoadmapPage
content = content.replace(
  /export function SecurityRoadmapPage\(\) \{/g,
  "export function SecurityRoadmapPage() {\n  const { data: { roadmapInitiatives } } = useGovernance();"
);

// inside KPIEnginePage
content = content.replace(
  /export function KPIEnginePage\(\) \{/g,
  "export function KPIEnginePage() {\n  const { data: { kpis } } = useGovernance();"
);

fs.writeFileSync('src/pages/ModulePages.tsx', content);
