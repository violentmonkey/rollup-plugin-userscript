import { AttachedScope, attachScopes } from '@rollup/pluginutils';
import { Node, walk } from 'estree-walker';
import isReference from 'is-reference';
import type { AstNode } from 'rollup';
import type { MemberExpression } from 'estree';

const META_START = '// ==UserScript==';
const META_END = '// ==/UserScript==';
const GRANTS_REGEXP = /^(unsafeWindow$|GM[._]\w+)/;

export function collectGrants(ast: AstNode) {
  let scope = attachScopes(ast, 'scope');
  const grantSetPerFile = new Set();
  walk(ast as Node, {
    enter(node: Node & { scope: AttachedScope }, parent) {
      if (node.scope) scope = node.scope;

      if (
        node.type === 'MemberExpression' &&
        isReference(node, parent)
      ) {
        function getMemberExpressionFullNameRecursive(astNode: MemberExpression): string | null {
          if (astNode.property.type !== 'Identifier') {
            return null;
          }

          switch (astNode.object.type) {
            case 'MemberExpression': {
              const nameSoFar = getMemberExpressionFullNameRecursive(astNode.object);
              if (nameSoFar == null) {
                return null;
              }

              return `${nameSoFar}.${astNode.property.name}`
            }
            case 'Identifier': {
              return `${astNode.object.name}.${astNode.property.name}`;
            }
            default: {
              return null;
            }
          }
        }

        const fullName = getMemberExpressionFullNameRecursive(node);
        const match = GRANTS_REGEXP.exec(fullName);
        if (match) {
          grantSetPerFile.add(match[0]);

          this.skip();
        }
      }

      if (
        node.type === 'Identifier' &&
        isReference(node, parent) &&
        !scope.contains(node.name)
      ) {
        const match = GRANTS_REGEXP.exec(node.name);
        if (match) {
          grantSetPerFile.add(match[0]);
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
