#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import child_process from 'child_process';
import yargs from 'yargs';
import webpack from 'webpack';
import {buildSizeTree, printSizeTree} from './SizeTree';

const DIR = __dirname;
const SCRIPT_PATH = path.resolve(DIR, __filename);
const TMP_DIR = path.resolve(DIR, 'tmp');
const TMP_ENTRY_PATH = path.resolve(TMP_DIR, 'entry.js');
const TMP_OUTPUT_PATH = path.resolve(TMP_DIR, 'output.js');
const TMP_JSON_PATH = path.resolve(TMP_DIR, 'stat.json');

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
    const onFinally = () => fs.removeSync(TMP_DIR);
    try {
        fnExec().then(onFinally, onFinally);
    } catch (e) {
        onFinally();
    }
}

const printForJson = (webpackStatJson) => Promise.resolve(printSizeTree(buildSizeTree(webpackStatJson)));
const printForJsonStr = (webpackStatJsonStr) => Promise.resolve(printSizeTree(buildSizeTree(JSON.parse(webpackStatJsonStr))));
const printForJsonFile = (statJsonFile) => printForJsonStr(fs.readFileSync(statJsonFile).toString());
const buildWebpackStatJson = (entryFile) => new Promise((resolve, reject) => {
    webpack({
        entry: path.resolve(entryFile)
    }, (err, stats) => {
        const statJson = stats.toJson({
            modules: true
        });
        err = err || statJson.errors[0];
        err ? reject(err) : resolve(statJson);
    });
});
const createEntryForPackage = (packageName) => Promise.resolve(fs.writeFileSync(TMP_ENTRY_PATH, `require('${packageName}');`)).then(() => TMP_ENTRY_PATH);

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
        return createEntryForPackage(argv['package'])
            .then(buildWebpackStatJson)
            .then(printForJson);
    });
} else {
    yargs.showHelp();
}
