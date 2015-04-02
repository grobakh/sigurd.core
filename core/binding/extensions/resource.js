define('core/binding/extensions/resource', {
        Object: 'core/object',
        bindingManager: 'core/binding/bindingManager',
        resourceService: instance('core/services/resourceService')
    },
    function (imported) {
        return imported.Object.extend({
            constructor: function (params) {
                this.params = params;
            },

            execute: function (source, target, targetPath) {
                var self = this;
                var mode = self.params.mode || 'oneWay';
                var path = self.params.path;

                this.resourceBinding = imported.bindingManager.bind(mode, imported.resourceService, path, target, targetPath);
            },

            updateOnContextChange: function () {
            },

            destroy: function () {
                this.resourceBinding.destroy();
                this.resourceBinding = null;
                this.dead = true;
            }
        });
    });