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

It's capable to:

- Analyze for almost any npm packages
- Analyze for your own project built with webpack
- Customize package group rulee, so you can:
  - correct package for vendor files inside your own code base (e.g. group `"src/vendor/react.js"` to `"react"` package)
  - separate size groups for your own code (e.g. group `"src/client/*.js"` to `"client"`)


# Install & Usage

- Install globally by `npm install package-size-analyzer -g`
- Run `package-size-analyzer` to see usage:
  - Usage: `package-size-analyzer entry_1 entry_2 ... [options]`
  - `entry_1 entry_2 ...` could be package name (e.g. "react", "lodash/forEach"), local file (e.g. "./src/foo.js"), anything that used by `require(...)`

### Example Usages:

- `package-size-analyzer lodash`: check lodash size
- `package-size-analyzer lodash vue -m`: check both lodash and vue minimized size
- `package-size-analyzer lodash/assign lodash/forEach`: check parts of lodash(@4) size
- `package-size-analyzer fs-extra --node`: check **node-side** fs-extra package size
- `package-size-analyzer --webpack-config webpack.config.js`: analyze for your own webpack-building project
- `package-size-analyzer --stat-json webpack-stat.json`: analyze for your own prebuilt webpack stats json

### Options

- `--minify (-m)` Analyze for minified size
- `--node` Analyze for **node side** files (like "yargs", "fs-extra" which may require node.js specific modules like "path", "child_process", "fs")
- `--webpack-config (-c) <filepath>` Directly specify webpack config to build and analyze
- `--stat-json (-j) <filepath>` Directly specify pre-built webpack stat json file instead of entry files to analyze (stat json may be produced by `webpack --json`, see [webpack](http://webpack.github.io/docs/cli.html#json) doc)

##### Advanced options: `package-map`

`package-map` options let you to customize which package a specific file belongs to (**by testing file absolute path**).

- `--package-map-file <filepath>` Specify a custom package rules js file, which exports:
  - a map as: `{ <package_name>: <filepath_tester_or_re> }`
  - or an array as `[ [<package_name>, <filepath_tester_or_re>], ... ]`
- `--package-map <rule> <rule> ...` CLI inline rules. Each rule format: `<package_name>:<filepath_regexp>`. (It's parsed directly by `new RegExp(...)`. **Be careful** with backslash `\` escape in cli)

**NOTE:**
  - You should take care of path differences between windows and linux (`"C:\a\b\c"` and `"/c/a/b/c"`)
  - Only the first matched rule is picked. Matching order: first try cli inline rules, then try rules in file.

Why need to customize package name that a file belongs to? Well, if you just use the tool to analyze npm packages, you don't need this. But if you want to analyze for your own project (with option `--webpack-config` or `--stat-json`), it's useful when you put some vendor codes somewhere else outsite `node_modules` (in which case their package names cannot be extracted correctly). And it's giving possibility to split size for your own codes.

Example Usages: Suppose we have following file structure:

```
--root
  --vendor
    -- react.js
    -- react.min.js
    -- rxjs.js
  -- client
    -- main.js
  -- server
    -- main.js
```

Now we need to group `"vendor/react*.js"` to `"react"` package, group `"vendor/rxjs.js"` to `"rxjs"` package; and we want to analyze sizes for client and server seperately.

```javascript
// Example usage of "--package-map-file"
// $bash: package-size-analyzer -c webpack.config.js --package-map-file pkg-map.js

// pkg-map.js
// preferred exporting array (order preserved)
module.exports = [
    // Define rule with regular expression
    [ 'react', /vendor[/\\]react(\.min)?\.js/],
    
    // Define rule with func
    [ 'rxjs', function (moduleAbsPath) {
        return moduleAbsPath.endsWith('rxjs.js')
    } ],

    // Define rule to seperate client and server codes
    [ 'client', /client/ ],
    [ 'server', /server/ ]
];
// or just a map (order careless)
module.exports = {
    react: /vendor[/\\]react(\.min)?\.js/,
    rxjs: function (moduleAbsPath) {
        return moduleAbsPath.endsWith('rxjs.js')
    },
    client: /client/,
    server: /server/
};

// Equivalent example usage of "--package-map"
// $bash: ... --package-map react:vendor[/\\\\]react(\\.min)?\\.js rxjs:rxjs\\.js$ client:client server:server

// You can also combine them together
```

Produce result like:

```
__ALL__: 407.36 KB
  <self>: 0 KB
  react: 144.36 KB
    <self>: 144.36 KB
  rxjs: 137.5 KB
    <self>: 137.5 KB
  client: 102.2 KB
    <self>: 102.2 KB
  server: 23.3 KB
    <self>: 23.3 KB
```
