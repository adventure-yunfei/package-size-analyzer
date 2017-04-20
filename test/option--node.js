import execCLI from './lib/exec-cli';
import { resourcePath } from './lib/path';

describe('Test option --node:', function () {
    it('should fail for node-side package without it', function () {
        return execCLI(`fs-extra`)
            .should.be.rejected;
    });

    it('should pass for node-side package with it', function () {
        return execCLI(`fs-extra --node`)
            .should.be.fulfilled;
    });

    it('should pass for test-node-entry.js with it', function () {
        return execCLI(`${resourcePath('js/test-node-entry.js')} --node`)
            .should.eventually.equal(
`__ALL__: 212 B
  <self>: 212 B
`
            );
    });
});
