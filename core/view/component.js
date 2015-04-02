define('core/view/component', {
    Model: 'core/model',
    templateManager: 'core/view/templateManager',
    Extension: 'core/binding/extension',
    Template: 'core/view/template',
    appConfig: instance('appConfig')
}, function (imported) {
    return imported.Model.extend(
        {
            setup: {
            },

            initialize: function () {

            },

            detachElements: function () {
            },

            attachElements: function () {
            },

            update: function () {
            },

            componentInitialize: function (place, isRoot, externalContext) {
                var self = this;
                self.silent = true;

                self.renderAsync = function () {
                    if (self.isRendering) {
                        _.log('debouncing because rendering');
                        return self.debouncedRender();
                    } else if (self.wasRendered && self.place.anyParentIsRendering()) {
                        _.log('debouncing because parent DOM rendering');
                        return self.debouncedRender();
                    } else {
                        return self.internalRenderAsync();
                    }
                };

                self.debouncedRender = self.debounce(self.renderAsync); // WARNING! Debounce render, not internalRender!

                self.place = place;
                place.component = self;

                self.put('visible', true);
                self.putObject(self.setup);
                self.extensions = [];
                self._watchCallbacks = {};

                var buildExtension = function (key, defaultValue) {
                    var expression = place.props[key] || defaultValue;
                    var extension = imported.Extension.process(key, expression, self, self);

                    if (extension) {
                        extension.key = key;
                        self.extensions.push(extension);
                    }
                };

                if (externalContext) {
                    self.put('context', externalContext);
                } else {
                    buildExtension('context', { extensionName: "parent" });
                }

                _.each(place.getExpressions(), function (key) {
                    buildExtension(key);
                });

                self.loop('context', function () {
                    if (self.dead) {
                        return;
                    }

                    self.suspendWatch();
                    var extKeysToRebuild = [];

                    if (self.dead) {
                        return;
                    }


                    var extensionsQueue = _.clone(this.extensions);
                    _.each(extensionsQueue, function (extension) {

                        if (extension.updateOnContextChange) {
                            extension.updateOnContextChange(self);
                        } else {
                            if (extension.destroy) {
                                extension.destroy(self);
                                extKeysToRebuild.push(extension.key);
                            }
                        }
                    });

                    if (self.dead) {
                        return;
                    }

                    this.extensions = _.reject(this.extensions, function (extension) {
                        return extension.dead;
                    });

                    if (self.dead) {
                        return;
                    }

                    _.each(extKeysToRebuild, function (key) {
                        buildExtension(key);
                    });

                    if (self.dead) {
                        return;
                    }

                    self.riseWatch();
                });

                if (isRoot) {
                    imported.appConfig.currentLayoutName = self.getLayoutName();

                    window.onresize = function () {
                        imported.appConfig.currentLayoutName = self.getLayoutName();
                        self.measure();
                    };
                }

                self.put('layout', imported.appConfig.currentLayoutName);
                self.watch('visible', self.updateVisibility);

                if (self.get('class')) {
                    self.place.addClass(self.get('class'));
                }

                self.watch('class', function () {
                    var oldValue = self.previous('class');
                    var newValue = self.get('class');

                    if (oldValue) {
                        self.place.removeClass(oldValue);
                    }

                    if (newValue) {
                        self.place.addClass(newValue);
                    }
                });

                self.watch('drag-over-class', function () {
                    var oldValue = self.previous('drag-over-class');
                    var newValue = self.get('drag-over-class');

                    if (oldValue) {
                        self.place.removeClass(oldValue);
                    }

                    if (newValue) {
                        self.place.addClass(newValue);
                    }
                });

                self.watch('allow-render', function (model, newValue) {
                    if (!newValue) {
                        return;
                    }

                    if (self.wasRendered) {
                        return;
                    }

                    self.renderAsync();
                });

                if (self.get('dynamic')) {
                    self.watch('layout', self.applyLayoutClass);
                    self.applyLayoutClass();

                    self.watch('top', self.measure);
                    self.watch('bottom', self.measure);
                    self.watch('left', self.measure);
                    self.watch('right', self.measure);
                    self.watch('width', self.measure);
                    self.watch('height', self.measure);
                }

                self.silent = false;
            },

            componentAttachElements: function () {
                var self = this;

                if (self.attached) {
                    _.log('already attached');
                }

                self.attached = true;

                self.attachElements();

                self.iterate(function (child) {
                    child.componentAttachElements();
                });
            },

            applyLayoutClass: function () {
                var self = this;

                _.each(imported.appConfig.layouts, function (layout) {
                    self.place.removeClass('layout_' + layout.name);
                });

                self.place.addClass('layout_' + imported.appConfig.currentLayoutName);
            },

            getLayoutName: function () {
                var layouts = imported.appConfig.layouts;

                if (!layouts) {
                    return '';
                }

                var width = window.document.body.offsetWidth;

                var matchedLayout = _.find(layouts, function (layout) {
                    return width > layout.minWidth;
                });

                if (!matchedLayout) {
                    matchedLayout = layouts[layouts.length - 1];
                }

                return matchedLayout.name;
            },

            updateVisibility: function () {
                var hideClass = this.get('hide-class') || 'system_none';
                var nowVisible = this.get('visible');

                if (nowVisible) {
                    this.place.removeClass(hideClass);
                } else {
                    this.place.addClass(hideClass);
                }
            },

            measure: function () {
                var self = this;
                self.set('layout', imported.appConfig.currentLayoutName);

                //TODO REMOVE measure always on DOM
                if (!self.place.getElement()) {
                    return;
                }

                function remeasureChildren() {
                    self.iterate(function (child) {
                        child.measure();
                    });
                }

                var height = _.toString(this.get('height'));
                var width = _.toString(this.get('width'));
                var right = _.toString(this.get('right'));
                var left = _.toString(this.get('left'));
                var top = _.toString(this.get('top'));
                var bottom = _.toString(this.get('bottom'));

                if (height === "" && width === "" && right === "" && left === "" && top === "" && bottom === "") {
                    remeasureChildren();
                    return;
                }

                var style = this.place.getElement().style;
                style.position = 'absolute';
                if (!self.get('overflow')) {
                    style.overflow = 'hidden';
                }

                if (height !== "") {
                    style.height = height + 'px';
                    if (top !== "") {
                        style.top = top + 'px';
                        if (bottom !== "") {
                            throw new Error('Layout inconsistent - 3 measures given instead ot two');
                        }
                    } else {
                        if (bottom !== "") {
                            style.bottom = bottom + 'px';
                        } else {
                            throw new Error('Layout inconsistent - 1 measure is given instead ot two');
                        }
                    }
                } else {
                    if (bottom === "" || top === "") {
                        return;
                    }

                    style.top = top + 'px';
                    style.bottom = bottom + 'px';
                    style.height = "auto";
                }

                if (width !== "") {
                    style.width = width + 'px';
                    if (left !== "") {
                        style.left = left + 'px';
                        if (right !== "") {
                            throw new Error('Layout inconsistent - 3 measures given instead ot two');
                        }
                    } else {
                        if (right !== "") {
                            style.right = right + 'px';
                        } else {
                            throw new Error('Layout inconsistent - 1 measure is given instead ot two');
                        }
                    }
                } else {
                    if (right === "" || left === "") {
                        return;
                    }
                    style.width = "auto";
                    style.left = left + 'px';
                    style.right = right + 'px';
                }

                remeasureChildren();
            },

            findChild: function (childId) {
                return this.place.find(function (child) {
                    return child.props.id === childId;
                }).component;
            },

            invokeOnChild: function (methodName, options) {
                this.iterate(function (child) {
                    if (child[methodName]) {
                        child[methodName].apply(child, options);
                    }
                });
            },

            iterate: function (callback) {
                var self = this;
                self.place.iterate(function (template) {
                    //TODO HACK vdupelev
                    if (template.component) {
                        callback.call(self, template.component);
                    } else {
                        _.log("Iterator returns region without component: " + self.place.props.region);
                        _.log("Region info: " + template.props.region);
                    }
                });
            },

            debounce: function (callback, timeout) {
                var self = this;

                return _.debounce(function () {
                    if (!self.dead) {
                        callback.apply(self, arguments);
                    }
                }, timeout || 25);
            },

            watch: function (key, callback) {
                var self = this;

                if (self.place.canChange[key]) {
                    self.loop(key, callback);
                    self._watchCallbacks[key] = callback;
                }
            },

            suspendWatch: function () {
                var self = this;
                for (var key in self._watchCallbacks) {
                    if (self.dead) {
                        return;
                    }

                    self.unloop(key);
                }
            },

            riseWatch: function () {
                var self = this;
                for (var key in self._watchCallbacks) {
                    if (self.dead) {
                        return;
                    }

                    self.loop(key, self._watchCallbacks[key]);
                    self.trigger(key, self, self.get(key), false, true);
                }
            },

            pasteContent: function () {
                var self = this;

                var names = self.place.getFragmentNames();

                for (var index = names.length; index--;) {
                    var fragmentName = names[index];

                    var fragment = self.get(fragmentName + '-fragment');
                    var presenter = self.place.pins[fragmentName];

                    if (fragmentName === 'content' && !presenter) {
                        presenter = self.place;
                    }

                    if (fragment && presenter) {
                        presenter.copyFrom(fragment);
                    }
                }
            },

            buildComponentsAsync: function () {
                var self = this;
                var componentsAsync = [];

                self.place.iterate(function (template) {
                    var componentAsync = self.constructor.createComponentAsync(template);
                    componentsAsync.push(componentAsync);
                });

                return componentsAsync;
            },

            internalRenderAsync: function () {
                var self = this;

                //HACK Combo VD
                if ((self.place.nodeName === 'select' || self.place.nodeName === 'tbody') && self.place.isInDOM()) {
                    var target = self.place.parent.getPlace().component;
                    _.log('delegating render to parent. Node name = ' + self.place.nodeName);
                    target.renderAsync();
                    return;
                }

                if (self.place.canChange['allow-render'] && !self.get('allow-render')) {
                    return;
                }

                if (self.dead) {
                    _.log("rendering dead");
                    return;
                }

                if (self.isRendering) {
                    _.log("rendering while rendering: " + self.place.props.region);
                }

                var resultAsync = future.create();

                if (self.wasRendered) {
                    self.detachElements();
                }

                self.isRendering = true;
                self.attached = false;

                //self.place.detachEvents(); // TODO fix this. detach only place events. not self pin events!
                self.place.destroyChildren();

                future.when(imported.templateManager.getFragmentAsync(self)).then(function () {
                    if (self.dead) {
                        self.isRendering = false;
                        resultAsync.resolve();
                        return;
                    }

                    if (!self.wasRendered) {
                        self.initialize();
                    }

                    var cssId = self.get('css');
                    if (cssId) {
                        self.place.addClass(cssId);
                    }

                    self.pasteContent();

                    future.whenAll(self.buildComponentsAsync()).then(function () {

                        if (self.dead) {
                            self.isRendering = false;
                            resultAsync.resolve();
                            return;
                        }

                        self.update();
                        self.updateVisibility();

                        if (self.place.isInDOM()) {
                            self.place.element = null;

                            if (self.place.render()) {
                                self.componentAttachElements();
                                self.measure();
                            }
                        }

                        self.isRendering = false;
                        self.wasRendered = true;
                        resultAsync.resolve();
                    }, function (error) {
                        resultAsync.reject(error);
                    });

                }, function (error) {
                    resultAsync.reject(error);
                });

                return resultAsync;
            },

            destroy: function () {
                var self = this;

                if (self.isRendering) {
                    _.log("Destroying rendering component: " + self.place.props.region);
                }

                _.each(this.extensions, function (extension) {
                    if (extension.destroy) {
                        extension.destroy(self);
                    }
                });
                this.extensions = null;

                self.attached = false;
                this.detachElements();

                this.place = null;
                this._watchCallbacks = null;

                imported.Model.prototype.destroy.call(this);
            }
        },
        {
            createFromHtmlAsync: function (html, elementId, externalContext) {
                // Only for tests
                var fragment = imported.Template.fromHTML(html).getFirstChild().clone();
                document.getElementById(elementId).innerHTML = fragment.toHTML();
                return this.createComponentAsync(fragment, true, externalContext);
            },

            createComponentAsync: function (place, isRoot, externalContext) {
                var componentAsync = future.create();

                if (!place.attributes.id) {
                    throw new Error("no component for no id!");
                }

                var region = place.props.region;
                if (region.indexOf('/') === -1) {
                    region = 'controls/' + region + '/' + region;
                }

                if (!region) {
                    throw new Error("undefined region!");
                }

                if (place.dead) {
                    _.log('Create component request for dead place -> ignore');
                    return;
                }

                place.moveChildrenToContentFragment();

                require([region], function (Component) {
                    if (place.dead) {
                        _.log('Create component request resolve for dead place -> cancel');
                        componentAsync.resolve();
                        return;
                    }

                    if (!Component) {
                        throw new Error("No component for: " + region);
                    }

                    var component = new Component({
                        region: region,
                        id: place.props.id
                    });

                    component.componentInitialize(place, isRoot, externalContext);

                    future.when(component.renderAsync()).then(function () {
                        if (component.dead) {
                            _.log('Rendered component is dead - skip');
                            componentAsync.resolve();
                            return;
                        }

                        componentAsync.resolve(component);
                    }, function (error) {
                        componentAsync.reject(error);
                    });

                }, function (error) {
                    componentAsync.reject(error);
                });

                return componentAsync;
            }
        });
});