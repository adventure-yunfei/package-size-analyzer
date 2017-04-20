module.exports = [
    [ 'client', /client/ ],
    [ 'server', function (filepath) {
        return filepath.indexOf('server') !== -1;
    } ],
    [ 'react', /\Wvendor\Wreact\.js$/ ]
];
