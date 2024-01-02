import { defineExternal, definePlugins } from '@gera2ld/plaid-rollup';
import { builtinModules } from 'module';
import { defineConfig } from 'rollup';
import pkg from './package.json' assert { type: 'json' };

const BANNER = `/*! ${pkg.name} v${pkg.version} | ${pkg.license} License */`;

const external = defineExternal([
  ...builtinModules,
  ...Object.keys(pkg.dependencies),
]);
export default defineConfig({
  input: 'src/index.ts',
  plugins: definePlugins({
    esm: true,
  }),
  external,
  output: {
    format: 'esm',
    file: 'dist/index.js',
    indent: false,
    // If set to false, circular dependencies and live bindings for external imports won't work
    externalLiveBindings: false,
    banner: BANNER,
  },
});
