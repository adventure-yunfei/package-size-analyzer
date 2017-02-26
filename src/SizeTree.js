import filesize from 'filesize';

class SizeTree {
    constructor(key) {
        this.key = key;
        this.size = 0;
        this.subSizeTreeMap = {};
    }

    getOrCreateSubSizeTree(key) {
        const subSizeTreeMap = this.subSizeTreeMap;
        if (!subSizeTreeMap[key]) {
            subSizeTreeMap[key] = new SizeTree(key);
        }
        return subSizeTreeMap[key];
    }

    addSize(size) {
        this.size += size;
    }

    getSelfSize() {
        let {size: leftSize, subSizeTreeMap} = this;

        for (let key in subSizeTreeMap) {
            leftSize -= subSizeTreeMap[key].size;
        }

        return leftSize;
    }
}

const RE_PACKAGE_NAME_FROM_IDENTIFIER = /\Wnode_modules\W([^\/\\]+)(?=(\/|\\))/g;
function extractPackageNames(moduleIdentifier) {
    const lastMarkIdx = moduleIdentifier.lastIndexOf('!');
    const modulePath = moduleIdentifier.slice(lastMarkIdx === -1 ? 0 : (lastMarkIdx + 1));
    let match = null;
    const packageNames = [];
    while (match = RE_PACKAGE_NAME_FROM_IDENTIFIER.exec(modulePath)) {
        const name = match[1];
        packageNames.push(match[1]);
    }
    return packageNames;
}

export function buildSizeTree(webpackBundleStatJSON) {
    const rootSizeTree = new SizeTree('__ALL__'),
        addPackageSize = (packageNames, size) => {
            let currentSizeTree = rootSizeTree;
            currentSizeTree.addSize(size);
            packageNames.forEach(packageName => {
                currentSizeTree = currentSizeTree.getOrCreateSubSizeTree(packageName);
                currentSizeTree.addSize(size);
            });
        };

    webpackBundleStatJSON.modules.forEach(module => {
        addPackageSize(extractPackageNames(module.identifier), module.size);
    });

    return rootSizeTree;
}

const log = (msg, tab = 0) => console.log(' '.repeat(tab) + msg);
const values = obj => {
    const result = [];
    for (var key in obj) {
        result.push(obj[key]);
    }
    return result;
}
export function printSizeTree(sizeTree, tab = 0) {
    const {key, size, subSizeTreeMap} = sizeTree;
    log(`${key}: ${filesize(size)}`, tab);
    log(`<self>: ${filesize(sizeTree.getSelfSize())}`, tab + 2);
    values(subSizeTreeMap)
        .sort((a, b) => b.size - a.size)
        .forEach(subSizeTree => printSizeTree(subSizeTree, tab + 2));
}
