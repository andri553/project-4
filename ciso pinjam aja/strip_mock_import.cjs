const fs = require('fs');
let content = fs.readFileSync('src/pages/dashboard/ExecutiveCommandCenter.tsx', 'utf8');

// Strip out the mockData import which causes the Vite error
content = content.replace(
  /import \{\n[\s\S]*?\} from '@\/data\/mockData';\n/,
  ''
);

fs.writeFileSync('src/pages/dashboard/ExecutiveCommandCenter.tsx', content);
