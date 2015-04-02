define('core/binding/extensions/item', ['core/object', 'core/model', 'core/binding/bindingManager'],
    function (Object, Model, bindingManager) {
        return Object.extend({
            constructor: function (params) {
                var self = this;
                self.params = params;
            },

            execute: function (source, target, targetPath) {
                var self = this;
                var mode = self.params.mode || 'oneWay';
                var itemValue = source.place.itemValue;
                var path = self.params.path;

                if (!path || itemValue === undefined || itemValue === null) {
                    target.set(targetPath, itemValue);
                } else {
                    self.itemBinding = bindingManager.bind(mode, itemValue, path, target, targetPath);
                }
            },

            updateOnContextChange: function () {
            },

            destroy : function () {
                var self = this;

                if (self.itemBinding) {
                    self.itemBinding.destroy();
                    self.itemBinding = null;
                    self.dead = true;
                }
            }
        });
    });