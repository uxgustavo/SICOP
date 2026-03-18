const fs = require('fs');
const path = require('path');

function getImportCategory(importPath) {
  if (importPath.startsWith('@angular/')) return 1;
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) return 2; // External like rxjs, supabase
  // Internal
  if (importPath.includes('/core/') || importPath.includes('/shared/')) return 3;
  return 4; // Feature paths
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract all contiguous block of import statements from the top
  const importRegex = /^import\s+(?:{[^}]+}|[^{\n]+)\s+from\s+['"](.*?)['"];?\s*$/gm;
  const imports = [];
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
      imports.push({
          fullText: match[0],
          path: match[1],
          category: getImportCategory(match[1]),
          index: match.index,
          length: match[0].length
      });
  }
  
  if (imports.length === 0) return;

  // We only replace the contiguous block at the top 
  // to avoid matching dynamic imports or imports inside strings.
  // Actually, standard imports are all at the top. 
  // Let's remove them from original content and place the sorted block at the top.
  let contentWithoutImports = content;
  
  // Sort reverse to replace from bottom to top without messing up indices
  const importsForRemoval = [...imports].sort((a,b) => b.index - a.index);
  for(let imp of importsForRemoval) {
     contentWithoutImports = contentWithoutImports.substring(0, imp.index) + contentWithoutImports.substring(imp.index + imp.length);
  }
  
  // Sort imports for final text
  imports.sort((a, b) => {
      if (a.category !== b.category) {
          return a.category - b.category;
      }
      return a.path.localeCompare(b.path);
  });
  
  const sortedImportText = imports.map(i => i.fullText).join('\n');
  
  // Clean up extra empty lines at the start of contentWithoutImports
  contentWithoutImports = contentWithoutImports.replace(/^\s+/, '\n\n');
  
  const newContent = sortedImportText + contentWithoutImports;

  if (content !== newContent) {
      fs.writeFileSync(filePath, newContent);
      console.log(`Sorted: ${filePath}`);
  }
}

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
          walk(filePath);
      } else if (filePath.endsWith('.ts') && !filePath.endsWith('.spec.ts')) {
          try {
             processFile(filePath);
          } catch(e) {
             console.error(`Error processing ${filePath}`, e);
          }
      }
  });
}

const srcDir = path.join(__dirname, '../src');
walk(srcDir);
console.log('Done sorting imports!');
