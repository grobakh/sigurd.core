define('core/binding/extensions/token', {
    Model: 'core/model',
    bindingManager: 'core/binding/bindingManager',
    lexemesService: instance('core/services/lexemesService')
}, function (imported) {
    return imported.Model.extend({
            constructor : function (params) {
                this.params = params;

                imported.Model.call(this);
            },

            execute : function (component, target, targetPath) {
                var self = this;
                var i;
                self.argExtensions = self.argExtensions || [];
                self.mode = self.params.mode || 'token';

                self.onModelChange = function () {
                    var value;
                    var args = [];
                    i = 1;
                    while (self.params['arg' + i]) {
                       args[i]=self.get('arg'+i);
                       i++;
                    }
                    try {
                        value = self.mode === 'lexeme' ? imported.lexemesService.getLexeme(self.get('lexeme')) :
                            imported.lexemesService.getToken(self.get('lexeme'), self.get('token'), args);
                    }
                    catch (ex) {
                        _.log(ex);
                    }

                    self.set('value', value);
                };

                if (self.mode === 'lexeme') {
                    self.put('lexeme', self.params.lexeme);
                }
                else {
                    if (self.params.path) {
                        var values = self.params.path.split('.');
                        self.put('lexeme', values[0]);
                        self.put('token', values[1]);
                    }
                    else {
                        self.put('lexeme', self.params.lexeme);
                        self.put('token');

                        self.tokenExtension = self.executeExtension(self.params.token, component, self, 'token');
                    }
                    i = 1;
                    while (self.params['arg' + i]) {
                        self.argExtensions[i] = self.executeExtension(self.params['arg' + i], component, self, 'arg' + i);
                        i++;
                    }
                }

                self.onModelChange();

                self.valueBinding = imported.bindingManager.bind('oneWay', self, "value", target, targetPath);

                i = 1;
                while (self.argExtensions[i]) {
                    self.loop('arg' + i, self.onModelChange);
                    i++;
                }

                self.loop('token', self.onModelChange);
                imported.lexemesService.addHandler('lang', self.onModelChange);
            },

            destroy : function () {
                var self = this;
                var i = 1;

                imported.lexemesService.removeHandler('lang', self.onModelChange);

                self.valueBinding.destroy();
                self.valueBinding = null;

                if (self.tokenExtension) {
                    self.tokenExtension.destroy();
                }

                while (self.argExtensions[i]) {
                    self.argExtensions[i].destroy();
                    self.argExtensions[i] = null;
                    i++;
                }

                imported.Model.prototype.destroy.call(this);
                self.dead = true;
            },

            executeExtension : function (extension, source, target, targetPath) {
                if (extension && extension.execute) {
                    extension.execute(source, target, targetPath);
                    return extension;
                }
                target.put(targetPath, extension);
                return undefined;
            }
        });
    });