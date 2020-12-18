require.config({
    paths: {
        jquery: '../../../dist/js/lib/jquery-1.10.2.min',
        JEditor: '../../../dist/js/JEditor'
    }
});

require(['JEditor'], function(){
    $(function(){
        var editor = new JEditor('div1');
        editor.create();
    });
})