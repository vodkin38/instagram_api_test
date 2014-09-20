require.config({
    paths: {
		jquery:'jquery',
		jsmousewheel:'additional/jquery.mousewheel',
		jsscroller:'additional/jquery.jscrollpane.min',
		jstimeago:'additional/jquery.timeago',
        sample: 'sample',
        underscore: 'underscore',
        backbone: 'backbone',
        'backbone.localStorage': 'backbone.localStorage',
    },
    shim: {
		jquery: {
            exports: 'jquery'
        },
		jsmousewheel: {
            exports: 'jsmousewheel'
        },
		jsscroller: {
			deps: ['jquery','jsmousewheel'],
            exports: 'jsscroller'
        },
		jstimeago: {
            deps: ['jquery'],
            exports: 'jstimeago'
        },
        sample: {
            deps: ['jquery', 'underscore', 'backbone'],
            exports: 'sample'
        },
        underscore: {
            exports: '_'
        },
		backbone: {
            deps: ['jquery', 'underscore'],
            exports: 'Backbone'
        },
    },
	
    baseUrl: 'js'
});
require(['sample'],
    function (script) {
        script.init();
    });