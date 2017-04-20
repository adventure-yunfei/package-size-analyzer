var path = require('path');
var TEST_TMP_DIR = path.resolve(__dirname, '../../.test-tmp');

module.exports = {
    entry: {
        main: path.resolve(__dirname, 'js/test-entry.js')
    },
    output: {
        path: TEST_TMP_DIR,
        filename: '[name].js'
    }
};
