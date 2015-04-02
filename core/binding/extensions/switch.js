define('core/binding/extensions/switch', ['core/model', 'core/binding/bindingManager'],
    function (Model, bindingManager) {
        return Model.extend({
            constructor: function (params) {
                this.params = params;
                this.props = new Model();
                this.extensions = {};

                Model.call(this);
            },

            execute: function (component, target, targetPath) {
                var self = this;

                var onModelChange = function () {
                    var parameter = self.get('parameter');
                    var value = self.props.get(parameter);
                    self.set('value', value);
                };

                _.each(self.params, function (value, key) {
                    if (key === 'parameter') {
                        return;
                    }

                    self.props.put(key);
                    var extension = self.executeExtension(value, component, self.props, key);

                    if (extension) {
                        self.extensions[key] = extension;
                        self.props.loop(key, onModelChange);
                    }
                });

                self.parameterExtension = self.params.parameter;
                self.executeExtension(self.parameterExtension, component, self, 'parameter');
                self.loop('parameter', onModelChange);

                onModelChange();
                self.valueBinding = bindingManager.bind('oneWay', self, "value", target, targetPath);
            },

            destroy: function () {
                var self = this;

                _.each(self.extensions, function (extension) {
                    extension.destroy();
                });
                self.extensions = null;

                if (self.parameterExtension) {
                    self.parameterExtension.destroy();
                    self.parameterExtension = null;
                }

                self.valueBinding.destroy();
                self.valueBinding = null;

                self.props.destroy();
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