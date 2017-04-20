import fs from 'fs-extra';
import execCLI from './lib/exec-cli';
import { resourcePath, rootPath } from './lib/path';

describe('Test option --package-map(-file):', function () {

    it('should work with entry', function () {
        return execCLI(`${resourcePath('js/test-entry.js')} --package-map react:\\Wvendor\\Wreact\\.js$ client:client server:server`)
            .should.eventually.equal(
`__ALL__: 619 B
  <self>: 200 B
  slash: 244 B
    <self>: 244 B
  react: 74 B
    <self>: 74 B
  server: 58 B
    <self>: 58 B
  client: 43 B
    <self>: 43 B
`
            );
    });


    const testStatJsonExpected =
`__ALL__: 518 B
  <self>: 99 B
  slash: 244 B
    <self>: 244 B
  react: 74 B
    <self>: 74 B
  server: 58 B
    <self>: 58 B
  client: 43 B
    <self>: 43 B
`;
    it('should work with --webpack-config', function () {
        return execCLI(`-c ${resourcePath('webpack.config.js')} --package-map react:\\Wvendor\\Wreact\\.js$ client:client server:server`)
            .should.eventually.equal(testStatJsonExpected);
    });
    it('should work with --stat-json', function () {
        return execCLI(`-j ${resourcePath('test-stat.json')} --package-map react:\\Wvendor\\Wreact\\.js$ client:client server:server`)
            .should.eventually.equal(testStatJsonExpected);
    });

    it('should work as rule map file', function () {
        return execCLI(`-j ${resourcePath('test-stat.json')} --package-map-file ${resourcePath('package-rule-map.js')}`)
            .should.eventually.equal(testStatJsonExpected);
    });

    it('should work as rule array file', function () {
        return execCLI(`-j ${resourcePath('test-stat.json')} --package-map-file ${resourcePath('package-rule-array.js')}`)
            .should.eventually.equal(testStatJsonExpected);
    });

    it('should work as mixed rule from inline and file', function () {
        return execCLI(`-j ${resourcePath('test-stat.json')} --package-map-file ${resourcePath('package-rule-array.js')} --package-map server:server`)
            .should.eventually.equal(testStatJsonExpected);
    });

    after(function () {
        fs.removeSync(rootPath('.test-tmp'));
    });
});
