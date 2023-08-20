import { builtinModules } from 'module';
import plaid from '@gera2ld/plaid';
import pkg from './package.json' assert { type: 'json' };

const {
  defaultOptions,
  getRollupExternal,
  getRollupPlugins,
} = plaid;

const DIST = defaultOptions.distDir;
const BANNER = `/*! ${pkg.name} v${pkg.version} | ${pkg.license} License */`;

const external = getRollupExternal([
  ...builtinModules,
  ...Object.keys(pkg.dependencies),
]);
const rollupConfig = [
  {
    input: 'src/index.js',
    plugins: getRollupPlugins({
      esm: true,
      extensions: defaultOptions.extensions,
    }),
    external,
    output: {
      format: 'esm',
      file: `${DIST}/index.js`,
    },
  },
];

rollupConfig.forEach((item) => {
  item.output = {
    indent: false,
    // If set to false, circular dependencies and live bindings for external imports won't work
    externalLiveBindings: false,
    ...item.output,
    ...BANNER && {
      banner: BANNER,
    },
  };
});

export default rollupConfig;
