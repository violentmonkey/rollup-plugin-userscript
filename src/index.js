import { promises as fs } from 'fs';
import { attachScopes } from '@rollup/pluginutils';
import { walk } from 'estree-walker';
import isReference from 'is-reference';

const gmAPIs = [
  'GM_info',
  'GM_getValue',
  'GM_setValue',
  'GM_deleteValue',
  'GM_listValues',
  'GM_addValueChangeListener',
  'GM_removeValueChangeListener',
  'GM_getResourceText',
  'GM_getResourceURL',
  'GM_addStyle',
  'GM_openInTab',
  'GM_registerMenuCommand',
  'GM_unregisterMenuCommand',
  'GM_notification',
  'GM_setClipboard',
  'GM_xmlhttpRequest',
  'GM_download',
];
const META_START = '// ==UserScript==';
const META_END = '// ==/UserScript==';

export default (metafile, transform) => {
  const grantMap = new Map();
  return {
    name: 'banner',
    buildStart() {
      this.addWatchFile(metafile);
    },
    transform(code, id) {
      const ast = this.parse(code);
      let scope = attachScopes(ast, 'scope');
      const grantSetPerFile = new Set();
      walk(ast, {
        enter(node, parent) {
          if (node.scope) scope = node.scope;
          if (node.type === 'Identifier' && isReference(node, parent) && !scope.contains(node.name)) {
            if (gmAPIs.includes(node.name)) {
              grantSetPerFile.add(node.name);
            }
          }
        },
        leave(node) {
          if (node.scope) scope = scope.parent;
        },
      });
      grantMap.set(id, grantSetPerFile);
    },
    async banner() {
      let meta = await fs.readFile(metafile, 'utf8');
      const lines = meta.split('\n').map(line => line.trim());
      const start = lines.indexOf(META_START);
      const end = lines.indexOf(META_END);
      if (start < 0 || end < 0) {
        console.warn('Invalid metadata block. For more details see https://violentmonkey.github.io/api/metadata-block/');
        return;
      }
      const grantSet = new Set();
      const items = lines.slice(start + 1, end)
        .map(line => {
          if (!line.startsWith('// ')) return;
          line = line.slice(3).trim();
          const i = line.indexOf(' ');
          if (i < 0) return;
          const key = line.slice(0, i);
          const value = line.slice(i + 1).trim();
          if (key === '@grant') {
            grantSet.add(value);
            return;
          }
          return [key, value];
        })
        .filter(Boolean);
      for (const id of this.getModuleIds()) {
        const grantSetPerFile = grantMap.get(id);
        if (grantSetPerFile) {
          for (const item of grantSetPerFile) {
            grantSet.add(item);
          }
        }
      }
      const grantList = Array.from(grantSet);
      grantList.sort();
      for (const item of grantList) {
        items.push(['@grant', item]);
      }
      const maxKeyWidth = Math.max(...items.map(([key]) => key.length));
      meta = [
        META_START,
        ...items.map(([key, value]) => `// ${key.padEnd(maxKeyWidth)} ${value}`),
        META_END,
        '',
      ].join('\n');
      if (transform) meta = transform(meta);
      return meta;
    },
  };
};
