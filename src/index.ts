import { readFile } from 'fs/promises';
import MagicString from 'magic-string';
import type { Plugin } from 'rollup';
import { collectGmApi, getMetadata } from './util';

const suffix = '?userscript-metadata';

export default (transform?: (metadata: string) => string): Plugin => {
  const metadataMap = new Map();
  const grantMap = new Map();
  return {
    name: 'userscript-metadata',
    async resolveId(source, importer, options) {
      if (source.endsWith(suffix)) {
        const { id } = await this.resolve(source, importer, options);
        metadataMap.set(importer, id.slice(0, -suffix.length));
      }
    },
    load(id) {
      if (id.endsWith(suffix)) {
        return '';
      }
    },
    transform(code, id) {
      const ast = this.parse(code);
      const grantSetPerFile = collectGmApi(ast);
      grantMap.set(id, grantSetPerFile);
    },
    /**
     * Use `renderChunk` instead of `banner` to preserve the metadata after minimization.
     * Note that this plugin must be put after `@rollup/plugin-terser`.
     */
    async renderChunk(code, chunk) {
      const metadataFile =
        chunk.isEntry &&
        [chunk.facadeModuleId, ...Object.keys(chunk.modules)]
          .map((id) => metadataMap.get(id))
          .find(Boolean);
      if (!metadataFile) return;
      let metadata = await readFile(metadataFile, 'utf8');
      const grantSet = new Set<string>();
      for (const id of this.getModuleIds()) {
        const grantSetPerFile = grantMap.get(id);
        if (grantSetPerFile) {
          for (const item of grantSetPerFile) {
            grantSet.add(item);
          }
        }
      }
      metadata = getMetadata(metadata, grantSet);
      if (transform) metadata = transform(metadata);
      const s = new MagicString(code);
      s.prepend(`${metadata}\n\n`);
      return {
        code: s.toString(),
        map: s.generateMap({ hires: 'boundary' }).toString(),
      };
    },
  };
};
