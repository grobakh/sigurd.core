define('core/binding/extensions/lambda', ['core/model', 'core/binding/bindingManager'],
    function (Model, bindingManager) {
        return Model.extend({
            constructor: function (params) {
                this.params = params;
                this.props = new Model();
                this.extensions = {};
                this.sandBox = {};

                Model.call(this);
            },

            execute: function (component, target, targetPath) {
                var self = this;

                var onModelChange = function () {
                    var value;

                    try {
                        value = self.lambda.apply(self.sandBox, self.props.values());
                    }
                    catch (ex) {
                        _.log(ex);
                    }

                    self.set('value', value);
                };

                _.each(self.params, function (value, key) {
                    if (key === 'result') {
                        return;
                    }

                    self.props.put(key);
                    var extension = self.executeExtension(value, component, self.props, key);

                    if (extension) {
                        self.extensions[key] = extension;
                        self.props.loop(key, onModelChange);
                    }
                });

                self.createLambda(self.params.result);
                onModelChange();

                self.valueBinding = bindingManager.bind('oneWay', self, "value", target, targetPath);
            },

            createLambda: function (body) {
                var self = this;
                var script = "return (" + body + ");";
                var keys = self.props.keys();

                try {
                    self.lambda = new Function(keys, script);
                } catch (ex) {
                    _.log(ex);
                    self.lambda = function () {
                    };
                }
            },

            destroy: function () {
                var self = this;

                _.each(self.extensions, function (extension) {
                    extension.destroy();
                });
                self.extensions = null;

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