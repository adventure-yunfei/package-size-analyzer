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

const RE_PACKAGE_NAME_FROM_IDENTIFIER = /\Wnode_modules\/([^\/]+)(?=\/)/g;
const IGNORED_PACKAGES = [ 'uglify-loader', 'json-loader' ].reduce((map, name) => {
    map[name] = true;
    return map;
}, {});
function extractPackageNames(moduleIdentifier) {
    let match = null;
    const packageNames = [];
    while (match = RE_PACKAGE_NAME_FROM_IDENTIFIER.exec(moduleIdentifier)) {
        const name = match[1];
        if (!IGNORED_PACKAGES[name]) {
            packageNames.push(match[1]);
        }
    }
    return packageNames;
}

export function buildSizeTree(webpackBundleStatJSON) {
    const rootSizeTree = new SizeTree('__ROOT__'),
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
export function printSizeTree(sizeTree, tab = 0) {
    const {key, size, subSizeTreeMap} = sizeTree;
    log(`${key}: ${filesize(size)}`, tab);
    log(`<self>: ${filesize(sizeTree.getSelfSize())}`, tab + 2);
    for (var subKey in subSizeTreeMap) {
        printSizeTree(subSizeTreeMap[subKey], tab + 2);
    }
}
