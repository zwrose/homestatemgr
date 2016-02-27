var _ = require('lodash');

var array1 = ['office', 'living room'];
var array2 = ['living room', 'basement'];

console.log(_.isEmpty(_.xor(array1, array2)));