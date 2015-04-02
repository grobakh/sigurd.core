define('core/binding/extensions/templateParent', ['core/object', 'core/model', 'core/binding/bindingManager'],
    function (Object, Model, bindingManager) {
        return Object.extend({
            constructor: function (params) {
                var self = this;
                self.params = params;
            },

            execute: function (source, target, targetPath) {
                var self = this;
                var mode = self.params.mode || 'oneWay';
                var path = self.params.path;
                var parent = source.place.region.component;

                if (!parent) {
                    throw new Error("no template parent for:" + source.place.props.region);
                }

                self.parentBinding = bindingManager.bind(mode, parent, path, target, targetPath);
            },

            updateOnContextChange: function () {
            },

            destroy: function () {
                this.parentBinding.destroy();
                this.parentBinding = null;
                this.dead = true;
            }
        });
    });