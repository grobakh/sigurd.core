define('core/binding/extensions/context', ['core/object', 'core/model', 'core/binding/bindingManager'],
    function (Object, Model, bindingManager) {
        return Object.extend({
            constructor: function (params) {
                var self = this;
                self.params = params;
            },

            execute: function (source, target, targetPath) {
                this.mode = this.params.mode || 'oneWay';
                this.path = this.params.path;
                this.source = source;
                this.target = target;
                this.targetPath = targetPath;

                var context = this.source.get('context');

                if (context && context.dead) {
                    _.log('@context bound to dead context', 'error');
                }

                if (!this.path) {
                    this.target.set(this.targetPath, context);
                } else {
                    if (this.contextBinding) {
                        this.contextBinding.destroy();
                        this.contextBinding = null;
                    }

                    this.contextBinding = bindingManager.bind(this.mode, context, this.path, this.target, this.targetPath);
                }
            },

            destroy: function () {
                if (this.contextBinding) {
                    this.contextBinding.destroy();
                    this.contextBinding = null;
                    this.dead = true;
                }
            }
        });
    });