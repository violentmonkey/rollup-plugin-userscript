import { promises as fs } from 'fs';
import { collectGmApi, getMetadata } from './util';

export default (metafile, transform) => {
  const grantMap = new Map();
  return {
    name: 'userscript-metadata',
    buildStart() {
      this.addWatchFile(metafile);
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
    async renderChunk(code) {
      const meta = await fs.readFile(metafile, 'utf8');
      const grantSet = new Set();
      for (const id of this.getModuleIds()) {
        const grantSetPerFile = grantMap.get(id);
        if (grantSetPerFile) {
          for (const item of grantSetPerFile) {
            grantSet.add(item);
          }
        }
      }
      let metadata = getMetadata(meta, grantSet);
      if (transform) metadata = transform(metadata);
      return `${metadata}\n\n${code}`;
    },
  };
};
