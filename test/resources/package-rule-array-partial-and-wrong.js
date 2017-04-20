module.exports = [
    [ 'client', /client/ ],
    [ 'client', /client/ ], // wrong rule. Testing match order (so this rule won't count)
    [ 'react', /\Wvendor\Wreact\.js$/ ]
];
