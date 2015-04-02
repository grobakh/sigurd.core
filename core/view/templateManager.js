define('core/view/templateManager', {
    Template: 'core/view/template'
}, function (imported) {
    return {
        getFragmentAsync: function (component) {
            var fragmentAsync = future.create();
            var templateName = component.get('template');

            if (!templateName) {
                return new imported.Template();
            }

            require([templateName + '.xhtml'], function (templateJSON) {
                    component.place.copyFromJSON(templateJSON, component.place);
                    if (!component.get('css')) {
                        component.set('css', templateJSON.templateCss);
                    }
                    fragmentAsync.resolve();
                },
                function (error) {
                    fragmentAsync.reject(error);
                });

            return fragmentAsync;
        }
    };
});