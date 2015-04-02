define('core/binding/extensions/if', ['core/model', 'core/binding/bindingManager'],
    function (Model, bindingManager) {
        return Model.extend({
            constructor: function (params) {
                this.params = params;

                Model.call(this);
            },

            execute: function (component, target, targetPath) {
                var self = this;

                self.params['true'] = self.params['true'] || "";
                self.params['false'] = self.params['false'] || "";

                self.put('true', '');
                self.put('false', '');

                self.trueExtension = self.executeExtension(self.params['true'], component, self, 'true');
                self.falseExtension = self.executeExtension(self.params['false'], component, self, 'false');

                self.parameterExtension =
                    self.executeExtension(self.params.parameter, component, self, 'parameter');

                self.onModelChange();
                self.valueBinding = bindingManager.bind('oneWay', self, "value", target, targetPath);

                if (self.parameterExtension) {
                    self.loop('parameter', self.onModelChange);
                }

                if (self.trueExtension) {
                    self.loop('true', self.onModelChange);
                }

                if (self.falseExtension) {
                    self.loop('false', self.onModelChange);
                }
            },

            onModelChange: function () {
                var self = this;
                var origin = self.get('parameter');

                if (origin) {
                    self.set('value', self.get('true'));
                }
                else {
                    self.set('value', self.get('false'));
                }
            },

            destroy: function () {
                var self = this;

                if (self.trueExtension) {
                    self.trueExtension.destroy();
                    self.trueExtension = null;
                }

                if (self.falseExtension) {
                    self.falseExtension.destroy();
                    self.falseExtension = null;
                }

                if (self.parameterExtension) {
                    self.parameterExtension.destroy();
                    self.parameterExtension = null;
                }

                self.valueBinding.destroy();
                self.valueBinding = null;

                Model.prototype.destroy.call(this);
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