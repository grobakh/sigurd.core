define('core/model', ['core/object'], function (Object) {
    return Object.extend({
        constructor: function (attr) {
            this.cid = _.uniqueId('c');

            // private
            this.attributes = {};
            this.previousAttributes = {};

            // public
            attr = attr || {};

            this.silent = false;
            this.putObject(attr);
        },

        // Initialize is an empty function by default. Override it with your own
        // initialization logic.
        initialize: function () {
        },

        keys: function () {
            return _.keys(this.attributes);
        },

        values: function () {
            return _.values(this.attributes);
        },

        get: function (attr) {
            return this.attributes[attr];
        },

        getChain: function (chain) {
            //TODO refacor without arrays, subStr with pos.
            if (chain && chain.indexOf(".") !== -1) {
                var points = chain.split('.');
                var point;
                var target = this;
                while (point = points.shift()) {
                    if (!target) {
                        return;
                    }
                    target = target.get(point);
                }
                return target;
            } else {
                return this.get(chain);
            }
        },

        remove: function (attr) {
            this.attributes[attr] = undefined;
        },

        def: function (key, command, commandPreview) {
            var self = this;

            return self.put(key, {
                exec: function () {
                    var canExecute = commandPreview ? commandPreview.apply(self, arguments) : true;
                    return (canExecute && command) ? command.apply(self, arguments) : undefined;
                }
            });
        },

        put: function (key, value) {
            this.previousAttributes[key] = this.attributes[key];
            this.attributes[key] = value;
        },

        set: function (key, value, silent, noLoop) {
            if (this.attributes[key] !== value) {
                this.previousAttributes[key] = this.attributes[key];
                this.attributes[key] = value;
                if (!(silent || this.silent)) {
                    this.trigger(key, this, value, noLoop);
                }
            }
        },

        putObject: function (attrs) {
            for (var attr in attrs) {
                if (attrs.hasOwnProperty(attr)) {
                    this.put(attr, attrs[attr]);
                }
            }
        },

        previous: function (attr) {
            return this.previousAttributes[attr];
        },

        toJSON: function () {
            return _.clone(this.attributes);
        },

        destroy: function () {
            this.removeAllHandlers();
            this.attributes = null;
            this.previousAttributes = null;
            this.dead = true;
        },

        clone: function () {
            return new this.constructor(this.attributes);
        }
    }, {
        comp: function (key, matchCase, inverse, compareInteger) {
            var extractValue = matchCase ? function (a) {
                return a.get(key);
            } : function (a) {
                return a.get(key).toLocaleLowerCase();
            };

            var order = inverse ? -1 : 1;

            return function (a, b) {
                var aValue = extractValue(a);
                var bValue = extractValue(b);
                if (compareInteger) {
                    aValue = parseInt(aValue, 10);
                    bValue = parseInt(bValue, 10);
                }
                return order * (aValue === bValue ? 0 : (aValue > bValue ? 1 : -1));
            };
        },

        from: function (source, fx) {
            return this.generator(fx)(source);
        },

        generator: function (fx) {
            var self = this;
            return function (source) {
                var model = new self.prototype.constructor(fx ? _.process(source, fx) : source);
                model.initialize();
                return model;
            };
        }
    });
});