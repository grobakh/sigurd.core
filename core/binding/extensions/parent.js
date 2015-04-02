define('core/binding/extensions/parent', ['core/object', 'core/model', 'core/binding/bindingManager'],
    function (Object, Model, bindingManager) {
        return Object.extend({
            constructor: function (params) {
                var self = this;
                self.params = params;
            },

            execute: function (source, target, targetPath) {
                if (this.executed) {
                    throw new Error('Extension can be executed one once');
                }

                this.executed = true;
                this.mode = this.params.mode || 'oneWay';
                this.path = this.params.path;
                this.target = target;
                this.targetPath = targetPath;

                var parentPlace = source.place.parent;

                var isPlaceGood = function (id, place) {
                    return id ? place.props.region && id === parentPlace.props.id : place.props.region;
                };

                while (parentPlace && !isPlaceGood(this.params.id, parentPlace)) {
                    parentPlace = parentPlace.parent;
                }

                if (!parentPlace || !parentPlace.component) {
                    throw new Error("Invalid parent");
                }

                this.parent = parentPlace.component;


                if (this.parent.dead) {
                    _.log('Dead parent');
                } else {
                    this.parent.extensions.push(this);
                    this.updateOnContextChange(this.parent);
                }
            },

            updateOnContextChange: function (caller) {
                if (caller !== this.parent) {
                    return;
                }

                var context = this.parent.get('context');

                if (!this.path) {
                    this.target.set(this.targetPath, context);
                } else {
                    if (this.parentBinding) {
                        this.parentBinding.destroy();
                        this.parentBinding = null;
                    }

                    this.parentBinding =
                        bindingManager.bind(this.mode, context, this.path, this.target, this.targetPath);
                }
            },

            destroy: function (context) {
                if (this.parentBinding) {
                    this.parentBinding.destroy();
                    this.parentBinding = null;
                }

                if ((context !== this.parent) && !this.parent.dead) {
                    this.parent.extensions.exclude(this);
                }
                this.dead = true;
            }
        });
    });