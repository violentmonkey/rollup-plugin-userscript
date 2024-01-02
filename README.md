# rollup-plugin-userscript

![NPM](https://img.shields.io/npm/v/rollup-plugin-userscript.svg)
![License](https://img.shields.io/npm/l/rollup-plugin-userscript.svg)
![Downloads](https://img.shields.io/npm/dt/rollup-plugin-userscript.svg)

Automatically parse metadata and set `@grant`s.

With this plugin, `@grant`s for [`GM_*` functions](https://violentmonkey.github.io/api/metadata-block/) will be added at compile time.

## Usage

Add the plugin to rollup.config.js:

```js
import userscript from 'rollup-plugin-userscript';

const plugins = [
  // ...
  userscript(meta => meta.replace('process.env.AUTHOR', pkg.author)),
];
```

Import the metadata file with a suffix `?userscript-metadata` in your script:

```js
import './meta.js?userscript-metadata';
```
