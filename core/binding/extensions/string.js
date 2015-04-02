define('core/binding/extensions/string', ['core/object', 'core/model', 'core/binding/bindingManager'],
    function (Object, Model, bindingManager) {
        return Object.extend({
            constructor: function (params) {
                this.params = params;
                this.model = new Model();
            },

            execute: function (source, target, targetPath) {
                var self = this;
                var mode = 'oneWay';
                self.textExtension = self.executeExtension(self.params.text, source, self.model, 'text');
                self.textBinding = bindingManager.bind(mode, self.model, 'text', target, targetPath);
            },

            destroy: function () {
                var self = this;

                if (self.textExtension) {
                    self.textExtension.destroy();
                    self.textExtension = null;
                }

                self.textBinding.destroy();
                self.textBinding = null;

                self.model.destroy();
                self.dead = true;
            },

            executeExtension: function (extension, source, target, targetPath) {
                if (extension && extension.execute) {
                    extension.execute(source, target, targetPath);
                    return extension;
                }

                target.put(targetPath, extension);
                return undefined;
            }
        });
    });