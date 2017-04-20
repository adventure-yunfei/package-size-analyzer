import path from 'path';
import fs from 'fs-extra';
import execCLI from './lib/exec-cli';
import { resourcePath } from './lib/path';

describe('Test cli with entries:', function () {
    it('should pass on test-entry.js', function () {
        return execCLI(`${resourcePath('js/test-entry.js')}`)
            .should.eventually.equal(
`__ALL__: 619 B
  <self>: 375 B
  slash: 244 B
    <self>: 244 B
`
            );
    });

    it('should pass on "dots" package', function () {
        return execCLI('dots')
            .should.eventually.equal(
`__ALL__: 180 B
  <self>: 16 B
  dots: 164 B
    <self>: 164 B
`
            );
    });

    it('should support multiple and mixed entries', function () {
        return execCLI(`dots ${path.relative(process.cwd(), resourcePath('js/test-entry.js'))}`)
            .should.eventually.equal(
`__ALL__: 800 B
  <self>: 392 B
  slash: 244 B
    <self>: 244 B
  dots: 164 B
    <self>: 164 B
`
            );
    });
});
