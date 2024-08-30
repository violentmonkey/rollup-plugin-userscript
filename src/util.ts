import { AttachedScope, attachScopes } from '@rollup/pluginutils';
import { Node, walk } from 'estree-walker';
import isReference from 'is-reference';
import type { AstNode } from 'rollup';

const gmAPIs = [
  'GM_info',
  'GM_getValue',
  'GM_getValues',
  'GM_setValue',
  'GM_setValues',
  'GM_deleteValue',
  'GM_deleteValues',
  'GM_listValues',
  'GM_addValueChangeListener',
  'GM_removeValueChangeListener',
  'GM_getResourceText',
  'GM_getResourceURL',
  'GM_addElement',
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

export function collectGmApi(ast: AstNode) {
  let scope = attachScopes(ast, 'scope');
  const grantSetPerFile = new Set();
  walk(ast as Node, {
    enter(node: Node & { scope: AttachedScope }, parent) {
      if (node.scope) scope = node.scope;
      if (
        node.type === 'Identifier' &&
        isReference(node, parent) &&
        !scope.contains(node.name)
      ) {
        if (gmAPIs.includes(node.name)) {
          grantSetPerFile.add(node.name);
        }
      }
    },
    leave(node: Node & { scope: AttachedScope }) {
      if (node.scope) scope = scope.parent;
    },
  });
  return grantSetPerFile;
}

export function getMetadata(
  metaFileContent: string,
  additionalGrantList: Set<string>,
) {
  const lines = metaFileContent.split('\n').map((line) => line.trim());
  const start = lines.indexOf(META_START);
  const end = lines.indexOf(META_END);
  if (start < 0 || end < 0) {
    throw new Error(
      'Invalid metadata block. For more details see https://violentmonkey.github.io/api/metadata-block/',
    );
  }
  const grantSet = new Set<string>();
  const entries = lines
    .slice(start + 1, end)
    .map((line) => {
      if (!line.startsWith('// ')) return;
      line = line.slice(3).trim();
      const matches = line.match(/^(\S+)(\s.*)?$/);
      if (!matches) return;
      const key = matches[1];
      const value = (matches[2] || '').trim();
      if (key === '@grant') {
        grantSet.add(value);
        return;
      }
      return [key, value];
    })
    .filter(Boolean);
  for (const item of additionalGrantList) {
    grantSet.add(item);
  }
  const grantList = Array.from(grantSet);
  grantList.sort();
  for (const item of grantList) {
    entries.push(['@grant', item]);
  }
  const maxKeyWidth = Math.max(...entries.map(([key]) => key.length));
  return [
    META_START,
    ...entries.map(([key, value]) => `// ${key.padEnd(maxKeyWidth)} ${value}`),
    META_END,
  ].join('\n');
}
