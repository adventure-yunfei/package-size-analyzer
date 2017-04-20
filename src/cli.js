#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import process from 'process';
import yargs from 'yargs';
import {buildSizeTree, printSizeTree} from './SizeTree';

const SCRIPT_PATH = path.resolve(__dirname, __filename);
const TMP_DIR = path.resolve(process.cwd(), '__tmp');
const TMP_ENTRY_PATH = path.resolve(TMP_DIR, 'entry.js');
let customExtractPackageNamesFn = null;

const provideTmpDir = (fnExec) => {
    fs.emptyDirSync(TMP_DIR);
    const onFinally = () => {
        if (!argv['keep-tmp']) {
            fs.removeSync(TMP_DIR);
        }
    };
    try {
        fnExec().then(onFinally, onFinally);
    } catch (e) {
        onFinally();
    }
}

const onMainException = (err) => {
    console.error(err);
}

const buildCustomExtractPackageNamesFn = () => {
    const customPackageRules = []; // format: [ [<pkgName>, <testerFunc>], ... ]
    const onValidRule = (pkgName, tester) => {
        if (tester instanceof RegExp) {
            const testerRE = tester;
            tester = (moduleAbsPath) => testerRE.test(moduleAbsPath);
        }
        customPackageRules.push([ pkgName, tester ]);
    }
    const reToTester = (regexp) => (moduleAbsPath) => regexp.test(moduleAbsPath);
    if (argv['package-map']) {
        argv['package-map'].forEach(rule => {
            const [pkgName, filePathRE] = rule.split(':');
            if (pkgName && filePathRE) {
                onValidRule(pkgName, new RegExp(filePathRE));
            } else {
                throw new Error(`package-map rule invalid: ${rule}`);
            }
        });
    }
    if (argv['package-map-file']) {
        const filePkgMap = require(path.resolve(argv['package-map-file']));
        const onEachRule = (pkgName, tester) => {
            if (typeof tester === 'function' || tester instanceof RegExp) {
                onValidRule(pkgName, tester);
            } else {
                throw new Error(`package-map-file (${argv['package-map-file']} output contains invalid field: ${pkgName})`);
            }
        };
        if (filePkgMap instanceof Array) {
            filePkgMap.forEach(([pkgName, tester]) => onEachRule(pkgName, tester));
        } else {
            for (let key in filePkgMap) {
                onEachRule(key, filePkgMap[key]);
            }
        }
    }
    
    return customPackageRules.length ? (moduleAbsPath) => {
        let result = null;
        customPackageRules.some(([pkgName, testerFn]) => {
            if (testerFn(moduleAbsPath)) {
                result = [pkgName];
                return true;
            }
        });
        return result;
    } : null;
};
const printForJson = (webpackStatJson) => Promise.resolve(printSizeTree(buildSizeTree(webpackStatJson, customExtractPackageNamesFn)));
const printForJsonFile = (statJsonFile) => printForJson(fs.readJsonSync(statJsonFile));
const buildWebpackStatJsonByConfig = (webpackConfig) => new Promise((resolve, reject) => {
    const webpack = require('webpack');
    webpack(webpackConfig, (err, stats) => {
        const statJson = stats.toJson({
            modules: true
        });
        err = err || statJson.errors[0];
        if (!err && argv['output-json']) {
            fs.outputJsonSync(argv['output-json'], statJson);
        }
        err ? reject(err) : resolve(statJson);
    });
});
const buildWebpackStatJsonByEntry = (entryFile) => {
    const cfg = {
        entry: path.resolve(entryFile),
        output: {
            path: TMP_DIR
        },
        module: {
            loaders: [{
                test: /\.json$/i,
                loaders: [ require.resolve('json-loader') ]
            }]
        }
    };
    if (argv['node']) {
        cfg['target'] = 'node';
    }
    if (argv['minify']) {
        cfg['module']['loaders'].push({
            test: /\.js$/,
            loaders: [ require.resolve('uglify-loader') ]
        });
        cfg['uglify-loader'] = {
            compress: true,
            mangle: true
        };
    }
    return buildWebpackStatJsonByConfig(cfg);
};
const resolveDependency = dependency => {
    if (/^(\.|\/|\w:)/.test(dependency)) {
        // local file pattern
        return path.resolve(dependency);
    } else {
        try {
            // first try loading local file dependency
            const localFile = path.resolve(dependency);
            fs.accessSync(localFile);
            return localFile;
        } catch (e) {
            // if no corresponding local file, just keep it as it is
            return dependency;
        }
    }
};
const createEntryForDependencies = (dependencies) => Promise.resolve(fs.writeFileSync(
    TMP_ENTRY_PATH,
    dependencies.map(dependency =>`require(${JSON.stringify(resolveDependency(dependency))});`).join('\n')
)).then(() => TMP_ENTRY_PATH);

const argv = yargs
    .usage('[cli] entry_1 entry_2 ... [options]')
    .example('[cli] react lodash/forEach ./src/foo.js', 'Entry could be package, local files, anything used by "require(...)".')
    .option('minify', {
        alias: 'm',
        type: 'boolean',
        describe: 'Whether to analyze minified size'
    })
    .option('node', {
        type: 'boolean',
        describe: 'Whether to compile bundle running on node instead of browser (like "yargs"/"fs-extra" packages)'
    })
    .option('stat-json', {
        alias: 'j',
        type: 'string',
        describe: 'Specify webpack stat json file to analyze'
    })
    .option('webpack-config', {
        alias: 'c',
        type: 'string',
        describe: 'Specify webpack config file to analyze'
    })

    // Advanced package-map options
    .option('package-map', {
        type: 'array',
        describe: [
            'Specify custom rules mapping files to package.',
            'Rules format:  <package_name>:<filepath_regexp> <package_name>:<filepath_regexp> ...',
        ].join('\n')
    })
    .option('package-map-file', {
        type: 'string',
        describe: 'Specify a custom rules js file, which exports a map as: {<pkgName>: <pathRE>}, or an array as [ [<pkgName>, <pathRE>] ]'
    })

    // Following options actually exist, but just invisible in user guide
    // .option('output-json', {
    //     type: 'string',
    //     describe: 'Specify the path to write built webpack json into'
    // })
    // .option('keep-tmp', {
    //     type: 'boolean',
    //     describe: 'Whether to keep tmp output'
    // })
    .check(argv => {
        const dependencies = argv._;
        if (dependencies.length && argv['stat-json']) {
            return 'Cannot specify both packages/entries and webpack json file';
        } else {
            return true;
        }
    })
    .argv;

customExtractPackageNamesFn = buildCustomExtractPackageNamesFn();

const dependencies = argv._;
if (argv['stat-json']) {
    printForJsonFile(argv['stat-json'])
        .catch(onMainException);
} else if (argv['webpack-config']) {
    const cfg = require(path.resolve(argv['webpack-config']));
    buildWebpackStatJsonByConfig(cfg)
        .then(printForJson)
        .catch(onMainException);
} else if (dependencies.length) {
    provideTmpDir(() => {
        return createEntryForDependencies(dependencies)
            .then(buildWebpackStatJsonByEntry)
            .then(printForJson)
            .catch(onMainException);
    });
} else {
    yargs.showHelp();
}
