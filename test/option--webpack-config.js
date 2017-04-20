import fs from 'fs-extra';
import execCLI from './lib/exec-cli';
import { resourcePath, rootPath } from './lib/path';

describe('Test option --webpack-config (-c)', function () {
    const outputExpected = fs.readFileSync(resourcePath('test-stat.json.expected'), 'utf8');

    it('should pass on test webpack.config.js', function () {
        return execCLI(`--webpack-config ${resourcePath('webpack.config.js')}`)
            .should.eventually.equal(outputExpected);
    });

    it('should accept -c alias', function () {
        return execCLI(`-c ${resourcePath('webpack.config.js')}`)
            .should.eventually.equal(outputExpected);
    });

    after(function () {
        fs.removeSync(rootPath('.test-tmp'));
    });
});
