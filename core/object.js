define('core/object', ['core/events'], function(Events) {
    var Object = function () {
    }; // empty constructor

    _.extend(Object.prototype, Events);

    // take very good method from framework;
    // this is not specific for Object, its just a system method;
    // to use constructor - declare constructor function.
    Object.extend = function (protoProps, classProps) {
        var child = Object.inherits(this, protoProps, classProps);
        child.extend = this.extend;
        return child;
    };

    // Shared empty constructor function to aid in prototype-chain creation.
    Object.ctor = function() {
    };

    // Helper function to correctly set up the prototype chain, for subclasses.
    // Similar to `goog.inherits`, but uses a hash of prototype properties and
    // class properties to be extended.
    Object.inherits = function(parent, protoProps, staticProps) {
        var child;

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent's constructor.
        if (protoProps && protoProps.hasOwnProperty('constructor')) {
            child = protoProps.constructor;
        }
        else {
            child = function() {
                parent.apply(this, arguments);
            };
        }

        // Inherit class (static) properties from parent.
        _.extend(child, parent);

        // Set the prototype chain to inherit from `parent`, without calling
        // `parent`'s constructor function.
        Object.ctor.prototype = parent.prototype;
        child.prototype = new Object.ctor();

        // Add prototype properties (instance properties) to the subclass,
        // if supplied.
        if (protoProps) {
            _.extend(child.prototype, protoProps);
        }

        // Add static properties to the constructor function, if supplied.
        if (staticProps) {
            _.extend(child, staticProps);
        }

        // Correctly set child's `prototype.constructor`.
        child.prototype.constructor = child;

        // Set a convenience property in case the parent's prototype is needed later.
        child.__super__ = parent.prototype;

        return child;
    };

    return Object;
});