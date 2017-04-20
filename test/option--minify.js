import execCLI from './lib/exec-cli';
import { resourcePath } from './lib/path';

describe('Test option --minify (-m):', function () {
    const testStatJsonMinifiedExpected =
`__ALL__: 491 B
  <self>: 363 B
  slash: 128 B
    <self>: 128 B
`;

    it('should pass on test-entry.js', function () {
        return execCLI(`${resourcePath('js/test-entry.js')} --minify`)
            .should.eventually.equal(testStatJsonMinifiedExpected);
    });

    it('should accept -m alias', function () {
        return execCLI(`${resourcePath('js/test-entry.js')} -m`)
            .should.eventually.equal(testStatJsonMinifiedExpected);
    });
});
