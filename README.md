# package-size-analyzer
Size analyzer for npm package, webpack bundle ...

A handy tool inspired by [webpack-bundle-size-analyzer](https://github.com/robertknight/webpack-bundle-size-analyzer).

While webpack itself provide [analyse tool](http://webpack.github.com/analyse), it's really hard to use.

This package-size-analyzer tool produce something like following:

```
__ALL__: 744.25 KB
  <self>: 14.9 KB
  fbjs: 32.32 KB
    <self>: 32.32 KB
  object-assign: 896 B
    <self>: 896 B
  react: 581.8 KB
    <self>: 581.8 KB
  assert: 11.43 KB
    <self>: 11.43 KB
  almin: 56.31 KB
    <self>: 54.36 KB
    object-assign: 1.95 KB
      <self>: 1.95 KB
  lru-cache: 10.85 KB
    <self>: 10.85 KB
  process: 2.01 KB
    <self>: 2.01 KB
  util: 15.4 KB
    <self>: 15.4 KB
  events: 8 KB
    <self>: 8 KB
  inherits: 672 B
    <self>: 672 B
  pseudomap: 2.65 KB
    <self>: 2.65 KB
  react-dom: 63 B
    <self>: 63 B
  yallist: 6.99 KB
    <self>: 6.99 KB
```


# Install & Usage

- Install globally by `npm install package-size-analyzer -g`
- Run `package-size-analyzer` to see usage:
  - Usage: `package-size-analyzer entry_1 entry_2 ... [options]`
  - `entry_1 entry_2 ...` could be package name (e.g. "react", "lodash/forEach"), local file (e.g. "./src/foo.js"), anything that used by `require(...)`

### Options

- `--minify (-m)` Analyze for minified size
- `--node` Analyze for **node side** files (like "yargs", "fs-extra" which may require node.js specific modules like "path", "child_process", "fs")
- `--stat-json (-j)` Specify pre-built webpack stat json file instead of entry files to analyze (stat json may be produced by `webpack --json`, see [webpack](http://webpack.github.io/docs/cli.html#json) doc)

### Example Usages:

- `package-size-analyzer lodash`: check lodash size
- `package-size-analyzer lodash vue`: check both lodash and vue size
- `package-size-analyzer lodash/assign lodash/forEach`: check parts of lodash(@4) size
- `package-size-analyzer fs-extra --node`: check **node-side** fs-extra package size
