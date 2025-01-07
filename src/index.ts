import { encode } from '@jridgewell/sourcemap-codec';
import { readFile } from 'fs/promises';
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
        let { id } = await this.resolve(source, importer, options);
        if (id.endsWith(suffix)) id = id.slice(0, -suffix.length);
        metadataMap.set(importer, id);
        return source;
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
    async renderChunk(code, chunk, options) {
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
      let map = null;

      if (options.sourcemap) {
        const mappings = [
          ...Array.from(metadata.split('\n'), () => []),
          [],
          ...Array.from(code.split('\n'), () => [[0, 0, 0, 0]]),
        ];
        map = {
          version: 3,
          file: chunk.fileName,
          sources: [chunk.fileName],
          sourcesContent: [code],
          names: [],
          mappings: encode(mappings),
        };
      }

      return {
        code: `${metadata}\n\n${code}`,
        map,
      };
    },
  };
};
