#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import child_process from 'child_process';
import yargs from 'yargs';
import webpack from 'webpack';
import {buildSizeTree, printSizeTree} from './SizeTree';
const jsonLoader = require.resolve('json-loader');

const SCRIPT_PATH = path.resolve(__dirname, __filename);
const TMP_DIR = path.resolve(process.cwd(), '__tmp');
const TMP_ENTRY_PATH = path.resolve(TMP_DIR, 'entry.js');
const TMP_OUTPUT_PATH = path.resolve(TMP_DIR, 'output.js');

function execCmd(cmd, args) {
    return new Promise((resolve, reject) => {
        var cp = child_process.spawn(cmd, args, {
            stdio: 'inherit'
        });
        cp.on('close', (code) => code === 0 ? resolve() : reject());
    });
}

function printIt(webpackStatsJsonStr) {
    printSizeTree(buildSizeTree(JSON.parse(webpackStatsJsonStr)));
}

const provideTmpDir = (fnExec) => {
    fs.emptyDirSync(TMP_DIR);
    const onFinally = (err) => {
        fs.removeSync(TMP_DIR);
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
                loaders: [jsonLoader]
            }]
        }
    };
    if (argv['node']) {
        cfg.target = 'node';
    }
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
const createEntryForPackages = (packageNames) => Promise.resolve(fs.writeFileSync(
    TMP_ENTRY_PATH,
    packageNames.map(pkgName =>`require('${pkgName}');`).join('\n')
)).then(() => TMP_ENTRY_PATH);

const argv = yargs
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
    .option('node', {
        type: 'boolean',
        describe: 'Whether to compile bundle running on node instead of browser (like "yargs"/"fs-extra" packages)'
    })
    // .option('output-json', {
    //     type: 'string',
    //     describe: 'Specify the path to write built webpack json into'
    // })
    .argv;

if (argv['stat-json']) {
    printForJsonFile(argv['stat-json']);
} else if (argv['entry']) {
    provideTmpDir(() => {
        return buildWebpackStatJson(argv['entry'])
            .then(printForJson);
    });
} else if (argv['package']) {
    provideTmpDir(() => {
        return createEntryForPackages(argv['package'].split(','))
            .then(buildWebpackStatJson)
            .then(printForJson);
    });
} else {
    yargs.showHelp();
}
