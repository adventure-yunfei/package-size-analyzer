import fs from 'fs-extra';
import execCLI from './lib/exec-cli';
import { resourcePath } from './lib/path';

describe('Test option --stat-json (-j):', function () {
    const testOnStatFile = (statFile, expectedFile, optKey = '--stat-json') => {
        return execCLI(`${optKey} ${resourcePath(statFile)}`)
            .should.eventually.equal(fs.readFileSync(resourcePath(expectedFile), 'utf8'));
    };

    it('should pass on pluto-react-stat.json', function () {
        return testOnStatFile('pluto-react-stat.json', 'pluto-react-stat.json.expected');
    });

    it('should pass on test-stat.json', function () {
        return testOnStatFile('test-stat.json', 'test-stat.json.expected');
    });

    it('should accept -j alias', function () {
        return testOnStatFile('test-stat.json', 'test-stat.json.expected', '-j');
    });
});
