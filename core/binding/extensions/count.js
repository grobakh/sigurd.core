define('core/binding/extensions/count', ['core/model', 'core/binding/bindingManager'],
    function (Model, bindingManager) {
        return Model.extend({
            constructor: function (params) {
                this.params = params;
                Model.call(this);
            },

            execute: function (component, target, targetPath) {
                var self = this;
                self.collectionExtension =
                    self.executeExtension(self.params.value, component, self, 'collection');

                self.collectionChangeHandler = function () {
                    self.onModelChange();
                };

                self.bindOnCollectionChange();
                self.onModelChange();

                if (self.collectionExtension) {
                    self.loop('collection', function () {
                        self.onModelChange();
                        self.bindOnCollectionChange();
                    });
                }

                self.valueBinding = bindingManager.bind('oneWay', self, "value", target, targetPath);
            },

            onModelChange: function () {
                var self = this;
                var collection = self.get('collection');
                if ((collection || collection === '') && collection.hasOwnProperty('length')) {
                    self.set('value', collection.length);
                }
            },

            bindOnCollectionChange: function () {
                var self = this;
                var previousCollection = self.previous('collection');

                if (previousCollection && previousCollection.removeHandler) {
                    previousCollection.removeHandler('change', self.collectionChangeHandler);
                }

                var collection = self.get('collection');

                if (collection && collection.addHandler) {
                    collection.addHandler('change', self.collectionChangeHandler);
                }
            },

            destroy: function () {
                var self = this;
                if (self.collectionChangeHandler) {
                    self.get('collection').removeHandler('change', self.collectionChangeHandler);
                }
                if (self.collectionExtension) {
                    self.collectionExtension.destroy();
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