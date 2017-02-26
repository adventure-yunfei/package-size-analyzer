#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import process from 'process';
import yargs from 'yargs';
import {buildSizeTree, printSizeTree} from './SizeTree';

const SCRIPT_PATH = path.resolve(__dirname, __filename);
const TMP_DIR = path.resolve(process.cwd(), '__tmp');
const TMP_ENTRY_PATH = path.resolve(TMP_DIR, 'entry.js');
const TMP_OUTPUT_PATH = path.resolve(TMP_DIR, 'output.js');

function printIt(webpackStatsJsonStr) {
    printSizeTree(buildSizeTree(JSON.parse(webpackStatsJsonStr)));
}

const provideTmpDir = (fnExec) => {
    fs.emptyDirSync(TMP_DIR);
    const onFinally = (err) => {
        if (!argv['keep-tmp']) {
            fs.removeSync(TMP_DIR);
        }
        if (err) {
            console.log(err);
        }
    };
    try {
        fnExec().then(() => onFinally(), onFinally);
    } catch (e) {
        onFinally(e);
    }
}

const printForJson = (webpackStatJson) => Promise.resolve(printSizeTree(buildSizeTree(webpackStatJson)));
const printForJsonFile = (statJsonFile) => printForJson(fs.readJsonSync(statJsonFile).toString());
const buildWebpackStatJson = (entryFile) => new Promise((resolve, reject) => {
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
    var webpack = require('webpack');
    webpack(cfg, (err, stats) => {
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
const resolveDependency = dependency => {
    if (/^(\.|\/|\w:)/.test(dependency)) {
        return path.resolve(dependency);
    } else {
        try {
            // first try loading npm package dependency
            return require.resolve(dependency);
        } catch (e) {
            const localFile = path.resolve(dependency);
            try {
                // if fails, first fallback to load local file dependency
                fs.accessSync(localFile);
                return localFile;
            } catch (e) {
                // if local file still doesn't exist, just keep it as it is
                return dependency;
            }
        }
    }
};
const createEntryForDependencies = (dependencies) => Promise.resolve(fs.writeFileSync(
    TMP_ENTRY_PATH,
    dependencies.map(dependency =>`require(${JSON.stringify(resolveDependency(dependency))});`).join('\n')
)).then(() => TMP_ENTRY_PATH);

const argv = yargs
    .usage('$0 entry_1 entry_2 ... [options]')
    .example('$0 react lodash/forEach ./src/foo.js', 'Entry could be package, local files, anything used by "require(...)"')
    .option('stat-json', {
        alias: 'j',
        type: 'string',
        describe: 'Specify webpack stat json file'
    })
    .option('entry', {
        alias: 'e',
        type: 'string',
        describe: 'Specify entry file which imports other packages'
    })
    .option('package', {
        alias: 'p',
        type: 'string',
        describe: 'Specify package name that need to be analyzed'
    })
    .option('minify', {
        alias: 'm',
        type: 'boolean',
        describe: 'Whether to analyze minified size'
    })
    .option('node', {
        type: 'boolean',
        describe: 'Whether to compile bundle running on node instead of browser (like "yargs"/"fs-extra" packages)'
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

const dependencies = argv._;
if (dependencies.length) {
    provideTmpDir(() => {
        return createEntryForDependencies(dependencies)
            .then(buildWebpackStatJson)
            .then(printForJson);
    });
} else if (argv['stat-json']) {
    printForJsonFile(argv['stat-json']);
} else {
    yargs.showHelp();
}
