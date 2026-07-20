import fs from 'fs';
import path from 'path';

const cisoDir = path.join(process.cwd(), 'src', 'ciso');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(cisoDir);

const replacements = [
  { from: /@\/components/g, to: '@/ciso/components' },
  { from: /@\/contexts/g, to: '@/ciso/contexts' },
  { from: /@\/data/g, to: '@/ciso/data' },
  { from: /@\/pages/g, to: '@/ciso/pages' },
  { from: /@\/types/g, to: '@/ciso/types' },
  { from: /@\/utils/g, to: '@/ciso/utils' },
  { from: /@\/assets/g, to: '@/ciso/assets' },
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  for (const { from, to } of replacements) {
    if (content.match(from)) {
      content = content.replace(from, to);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
