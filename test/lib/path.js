import path from 'path';

const RESOURCES_DIR = path.resolve(__dirname, '../resources');
const ROOT_DIR = path.resolve(__dirname, '../..');

export function resourcePath(subpath) {
    return path.resolve(RESOURCES_DIR, subpath);
}

export function rootPath(subpath) {
    return path.resolve(ROOT_DIR, subpath);
}
