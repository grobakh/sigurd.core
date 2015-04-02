define('core/view/template', {
        Object: 'core/object',
        appConfig: instance('appConfig'),
        templateDomExtension : 'core/view/templateDomExtension'
    },
    function (imported) {
        var Template = imported.Object.extend(imported.templateDomExtension);
        return Template.extend({
            constructor: function (nodeName, children) {
                this.nodeName = nodeName;
                this.value = undefined;
                this.attributes = {};
                this.props = {};
                this.canChange = {};
                this.unary = false;
                this.isValueUnsafe = false;

                this.region = null;
                this.pins = {};
                this.eventHash = {};
                this.component = null;
                this.childList = [];

                this.setChildren(children);
            },

            createFragment: function (children) {
                return new this.constructor('', children);
            },

            setChildren: function (children) {
                this.destroyChildren();
                this.appendChildren(children);
            },

            appendChildren: function (children) {
                if (!children) {
                    return;
                }

                for (var index = 0, length = children.length; index < length; index++) {
                    this.appendChild(children[index]);
                }
            },

            moveChildrenToContentFragment: function () {
                var self = this;
                var propName = 'content-fragment';

                if (!self.props[propName] && self.childList.length > 0) {
                    self.props[propName] = self.createFragment(self.childList);
                    self.childList = [];
                }
            },

            appendChild: function (child) {
                if (!child) {
                    return;
                }

                child.parent = this;
                this.childList.push(child);
            },

            getElement: function () {
                this.element = this.element || (this.attributes ? document.getElementById(this.attributes.id) : null);
                return this.element;
            },

            setFragment: function (fragment) {
                if (!fragment) {
                    return;
                }

                if (fragment.nodeName) {
                    throw new Error("Fragment nodeName is not empty! This is not fragment!");
                }

                this.setChildren(fragment.childList);
                fragment.childList = [];
                fragment.destroy();
            },

            copyFrom: function (source, region) {
                var self = this;
                self.destroyChildren();

                for (var index = 0, length = source.childList.length; index < length; index++) {
                    self.appendChild(source.childList[index].clone(region));
                }
            },

            copyFromJSON: function (json, templatedParent) {
                var self = this;

                var createFromJSON = function (json, root) {

                    var template = root || new self.constructor(json.nodeName);
                    template.destroyChildren();
                    var children;
                    if (json.children) {
                        children = [];
                        for (var index = 0, length = json.children.length; index < length; index++) {
                            var child = json.children[index];
                            child = createFromJSON(child);
                            child.region = (child.props.region && templatedParent) ? templatedParent : child.region;
                            if (child.props.id && templatedParent) {
                                templatedParent.pins[child.props.id] = child;
                            }
                            children.push(child);
                        }
                    }

                    template.appendChildren(children);

                    template.attributes.id = template.attributes.id || _.uniqueId('v');
                    template.unary = json.unary;
                    template.value = json.value;

                    for (var attribute in json.attrs) {
                        if (json.attrs.hasOwnProperty(attribute)) {
                            template.attributes[attribute] = json.attrs[attribute];
                        }
                    }

                    for (var change in json.canChange) {
                        if (json.canChange.hasOwnProperty(change)) {
                            template.canChange[change] = json.canChange[change];
                        }
                    }

                    for (var prop in json.props) {
                        if (json.props.hasOwnProperty(prop)) {
                            var value = json.props[prop];

                            if (value && value.isFragment) {
                                template.props[prop] = createFromJSON(value);
                            } else {
                                template.props[prop] = value;
                            }
                        }
                    }

                    return template;
                };

                createFromJSON(json, self);
            },


            appendFragment: function (fragment) {
                if (!fragment) {
                    return;
                }

                if (fragment.nodeName) {
                    throw new Error("Fragment nodeName is not emtpy! This is not fragment!");
                }

                this.appendChildren(fragment.childList);
                fragment.childList = [];
                fragment.destroy();
            },

            isInDOM: function () {
                return this.getElement();
            },

            anyParentIsRendering: function () {
                var self = this;
                var parent = self.parent;

                while (parent) {
                    if (parent.component) {
                        if (parent.component.isRendering) {
                            return true;
                        }
                    }
                    parent = parent.parent;
                }
                return false;
            },

            render: function () {
                if (this.dead) {
                    _.log('Rendering dead template!');
                    return false;
                }

                if (this.getElement()) {
                    var result = "";

                    for (var index = 0, length = this.childList.length; index < length; index++) {
                        result += this.childList[index].toHTML();
                    }

                    try {
                        this.element.innerHTML = result;
                    } catch (e) {
                        _.log('Failed to set innerHTML for ' + this.props.region);
                        _.log(e);

                        return false;
                    }

                    return true;
                }

                return false;
            },

            getExpressions: function () {
                return _(_(this.props).keys()).difference(['id', 'region', 'context']);
            },

            trace: function (current, predicate, ignoreStopper) {
                var self = this;

                var isCurrentGood = function (current) {
                    if (!current) {
                        return true;
                    }

                    if (predicate(current)) {
                        return true;
                    }

                    if (!ignoreStopper && (current === self)) {
                        return true;
                    }

                    return false;
                };

                while (!isCurrentGood(current)) {
                    current = current.parent;
                }

                return current;
            },

            getPlace: function () {
                return this.trace(this, function (candidate) {
                    return candidate.component;
                }, true);
            },

            find: function (criteria) {
                for (var index = 0, length = this.childList.length; index < length; index++) {
                    var child = this.childList[index];

                    if (child.dead) {
                        _.log('Finding dead child -> skip');
                        continue;
                    }

                    if (criteria(child)) {
                        return child;
                    }

                    var candidate = child.find(criteria);

                    if (candidate) {
                        return candidate;
                    }
                }

                return null;
            },

            getFragmentNames: function () {
                var self = this;
                var result = [];

                for (var prop in self.props) {
                    if (self.props.hasOwnProperty(prop)) {
                        if (prop.endsWith('-fragment')) {
                            result.push(prop.slice(0, -'-fragment'.length));
                        }
                    }
                }

                return result;
            },

            toHTML: function (isDebug) {
                var index, length;

                if (this.value) {
                    return this.isValueUnsafe ? this.value : _.encodeHTML(this.value);
                }
                else {
                    var result;
                    if (this.nodeName) {
                        result = "<" + this.nodeName;
                        if (isDebug || imported.appConfig.isAutomation) {
                            for (var key in this.props) {
                                if (_.isString(this.props[key])) {
                                    result += ' data-' + key + '=\"' + this.props[key] + '\"';
                                }
                            }
                        }

                        for (var attrKey in this.attributes) {
                            if (isDebug && attrKey === 'id') {
                                continue;
                            }
                            if (!_.isUndefined(this.attributes[attrKey])) {
                                result += ' ' + attrKey + '=\"' + _.encodeHTML(this.attributes[attrKey]) + '\"';
                            }
                        }

                        if (this.unary) {
                            result += "/>";
                        }
                        else {
                            result += ">";

                            for (index = 0, length = this.childList.length; index < length; index++) {
                                result += this.childList[index].toHTML(isDebug);
                            }

                            result += "</" + this.nodeName + ">";
                        }
                    } else {
                        result = "";

                        for (index = 0, length = this.childList.length; index < length; index++) {
                            result += this.childList[index].toHTML(isDebug);
                        }
                    }
                    return result;
                }
            },

            clone: function (region) {
                var self = this;
                var current = new self.constructor(self.nodeName);

                current.props = {};

                for (var key in self.props) {
                    var value = self.props[key];

                    if (value && value.clone) {
                        current.props[key] = value.clone(region);
                    } else {
                        current.props[key] = value;
                    }

                    // In false case do not create key!
                    if (self.canChange[key]) {
                        current.canChange[key] = true;
                    }
                }

                // templated parent place: region logic
                current.region = (current.props.region && region) ? region : self.region;

                if (current.props.id && region) {
                    region.pins[current.props.id] = current;
                }

                // attributes
                for (var attrKey in self.attributes) {
                    current.attributes[attrKey] = self.attributes[attrKey];
                }

                current.attributes.id = _.uniqueId('v');

                if (self.unary) {
                    current.unary = true;
                    current.value = self.value;
                }
                else {
                    for (var index = 0, length = self.childList.length; index < length; index++) {
                        var child = self.childList[index];

                        if (child.nodeName) {
                            current.appendChild(child.clone(region));
                        }
                        else {
                            var textNode = self.createFragment();
                            textNode.value = child.value;
                            textNode.unary = true;
                            current.appendChild(textNode);
                        }
                    }
                }
                return current;
            },

            iterate: function (lambda) {
                var self = this;

                if (self.dead) {
                    _.log('Iterating dead template -> ignore');
                    return;
                }

                for (var index = 0, length = self.childList.length; index < length; index++) {
                    var child = self.childList[index];

                    if (child.dead) {
                        _.log('Iterating dead child -> skip');
                        continue;
                    }

                    if (child.props.region) {
                        lambda(child);
                    }
                    else {
                        child.iterate(lambda);
                    }
                }
            },

            eachChild: function (lambda) {
                var self = this;

                for (var index = 0, length = self.childList.length; index < length; index++) {
                    var child = self.childList[index];

                    if (child.dead) {
                        _.log('EachChild found dead child -> skip');
                        continue;
                    }

                    lambda(child);
                }
            },

            findInChildren: function (predicate) {
                return _.find(this.childList, predicate);
            },

            attach: function (event, eventHandler, context) {
                if (!this.getElement()) {
                    _.log(this);
                    if (this.dead) {
                        throw new Error("Attempt to attach event to the dead element");
                    } else {
                        throw new Error("Attempt to attach event before rendering element " + this.props.region);
                    }
                }

                var callback = eventHandler;

                if (context) {
                    callback = function () {
                        eventHandler.apply(context, arguments);
                    };
                }

                //physical attach
                if (this.element.addEventListener) {
                    this.element.addEventListener(event, callback, false);
                }
                else if (this.element.attachEvent) {
                    this.element.attachEvent(event, callback); //IE8, не передаёт элемент в качестве аргумента
                }
                else {
                    throw new Error("Can't find a node to attach event");
                }

                //store event history
                this.eventHash[event] = this.eventHash[event] || [];
                this.eventHash[event].push(callback);
            },

            detachEvents: function () {
                var self = this;

                for (var event in self.eventHash) {
                    if (self.eventHash.hasOwnProperty(event)) {
                        self.detach(event);
                    }
                }

                self.eventHash = {};
            },

            detach: function (event) {
                if (!this.getElement() || !this.eventHash[event]) {
                    return;
                }

                var detachHandlers = this.eventHash[event];

                //physical detach
                for (var i = detachHandlers.length; i--;) {
                    if (this.element.removeEventListener) {
                        this.element.removeEventListener(event, detachHandlers[i], false);
                    }
                    else if (this.element.detachEvent) {
                        this.element.detachEvent(event, detachHandlers[i]);
                    }
                    else {
                        throw new Error("Can't find a node to detach event");
                    }
                }

                this.eventHash[event] = null;
            },

            trigger: function (eventName) {
                if (!this.getElement()) {
                    throw new Error("Attempt to trigger event before rendering element");
                }

                var event = document.createEvent("UIEvent");
                event.initEvent(eventName, true, true);

                if (this.element.dispatchEvent) {
                    this.element.dispatchEvent(event);
                }
                else if (this.element.fireEvent) {
                    this.element.fireEvent(eventName, event);
                }
                else {
                    throw new Error("Can't find a node to trigger event");
                }
            },

            destroyChildren: function () {
                var self = this;

                for (var index = 0, length = self.childList.length; index < length; index++) {
                    self.childList[index].destroy();
                }

                this.childList = [];
                this.pins = {};
            },

            getFirstChild: function () {
                return this.childList.length > 0 ? this.childList[0] : undefined;
            },

            destroy: function () {
                var self = this;

                if (self.component) {
                    self.component.destroy();
                }

                self.destroyChildren();
                self.detachEvents();

                self.parent = null;
                self.props = null;
                self.attributes = null;
                self.childList = null;
                self.element = null;

                self.region = null;
                self.pins = null;
                self.eventHash = null;
                self.component = null;

                self.dead = true;
            }
        }, {
            fromHTML: function (html) {
                var self = this;
                var current = new self.prototype.constructor();
                var stack = [];
                var handler = {
                    start: function (tag, attrs, unary) {
                        var started = new self.prototype.constructor(tag);

                        _.each(attrs, function (attr) {
                            if (attr.name.substr(0, 5) === "data-") {
                                var key = attr.name.substr(5);

                                // In false case do not create key!
                                if (attr.value && (attr.value[0] === "@" || attr.value[0] === "{")) {
                                    started.canChange[key] = true;
                                }

                                started.props[key] = attr.value;
                            } else {
                                started.attributes[attr.name] = _.decodeHTML(attr.value);
                            }
                        });

                        started.attributes.id = _.uniqueId('v');

                        if (started.props.property) {
                            if (started.props.crop) {
                                started.nodeName = "";
                                current.props[started.props.property] = started;
                            } else {
                                current.props[started.props.property] = new self.prototype.constructor("", [started]);
                            }
                        }
                        else {
                            current.appendChild(started);
                        }

                        if (unary) {
                            started.unary = true;
                        } else {
                            stack.push(current);
                            current = started;
                        }
                    },
                    end: function () {
                        current = stack.pop();
                    },
                    chars: function (text) {
                        if (/\S/.test(text)) {
                            var textNode = new self.prototype.constructor();
                            textNode.value = _.decodeHTML(text.trim());
                            textNode.unary = true;
                            current.appendChild(textNode);
                        }
                    },
                    comment: function () {
                    }
                };

                HTMLParser(html, handler);
                return current;
            }
        });

    }
)
;