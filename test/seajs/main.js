define(function(require, exports, module){
    var $ = require('jquery');
    require('JEditor')($);

    $(function(){
        var editor = new JEditor('div1');
        editor.create();
    });
});