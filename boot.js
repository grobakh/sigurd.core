(function () {
    var environment = this;
    environment.self = undefined;

    if (!window._) {
        throw new Error("Underscore.js required!");
    }

    String.prototype.trim = String.prototype.trim || function () {
        return this.replace(/^\s*/, "").replace(/\s*$/, "");
    };

    String.prototype.has = function (value) {
        return this.indexOf(value) !== -1;
    };

    String.prototype.startsWith = function (value) {
        return this.indexOf(value) === 0;
    };

    String.prototype.lowerStartsWith = function (value) {
        return value || value === '' ? this.toLowerCase().indexOf(value.toLowerCase()) === 0 : false;
    };

    String.prototype.lowerEqual = function (value) {
        return value || value === '' ? this.toLowerCase() === value.toLowerCase() : false;
    };

    String.prototype.endsWith = function (value) {
        if (this.length < value.length) return false;
        return this.indexOf(value, this.length - value.length) === (this.length - value.length);
    };

    String.prototype.destroy = function () {
    };

    Array.prototype.exclude = function (element) {
        var position = this.indexOf(element);
        if (position >= 0) {
            this.splice(position, 1);
        }
    };


    var logRecords = [];

    var rValidChars = /^[\],:{}\s]*$/;
    var rValidEscape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
    var rValidTokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
    var rValidBraces = /(?:^|:|,)(?:\s*\[)+/g;
    var amp = /&amp;/g;
    var lt = /&lt;/g;
    var gt = /&gt;/g;
    var quot = /&quot;/g;
    var apost = /&#x39;/g;
    var slash = /&#x2F;/g;
    var space = /&nbsp;/g;
    var _amp = /&/g;
    var _lt = /</g;
    var _gt = />/g;
    var _quot = /"/g;
    var _apost = /'/g;
    var _slash = /\//g;
    var _space = RegExp(String.fromCharCode(0x00a0), 'g');

    _.mixin({
        toJSON: function (source, objects, stringLength) {
            var result = "";

            if (_.isNull(source) || _.isUndefined(source) || _.isFunction(source) ||
                (window && source instanceof window.Element)) {
                return "null";
            }

            if (_.isBoolean(source)) {
                return source ? "true" : "false";
            }

            if (_.isNumber(source)) {
                return source.toString();
            }

            if (_.isString(source)) {
                if (stringLength) {
                    source = source.substr(0, stringLength);
                }
                return '"' + _.escapeJSON(source) + '"';
            }

            objects = objects || [];

            if (_.contains(objects, source)) {
                result = '{"@ref":' + (source.cid ? '"' + _.escapeJSON(source.cid) + '"' : '""') + '}';
                return result;
            }
            else {
                objects.push(source);
            }

            if (_.isArray(source)) {
                result = "[";

                for (var index = 0, length = source.length; index < length; index++) {
                    try {
                        result += (index ? "," : "") + _.toJSON(source[index], objects, stringLength);
                    } catch (e) {
                        result += (index ? "," : "") + "null";
                    }
                }

                result += "]";

                return result;
            }

            if (_.isObject(source)) {

                result = "{";
                var propIndex = 0;

                for (var key in source) {
                    if (source.hasOwnProperty(key) && key.charAt(0) !== '_') {
                        result += (propIndex++ ? "," : "");

                        try {
                            result += '"' + _.escapeJSON(key) + '":' + _.toJSON(source[key], objects, stringLength);
                        } catch (e) {
                            result += '"' + _.escapeJSON(key) + '":' + "null";
                        }
                    }
                }

                result += "}";
                return result;
            }
        },

        parseJSON: function (data) {
            if (typeof data !== "string" || !data) {
                return null;
            }

            data = data.trim();

            if (window.JSON && window.JSON.parse) {
                try {
                    data = window.JSON.parse(data);
                    return data;
                } catch (e) {
                    _.log("Invalid JSON: " + data);
                    return null;
                }
            }

            if (!rValidChars.test(data.replace(rValidEscape, "@")
                .replace(rValidTokens, "]").replace(rValidBraces, ""))) {

                _.log("Invalid JSON: " + data);
                return null;
            }

            return ( new Function("return (" + data + ");") )();
        },

        getURIparams: function (obj) {
            var result = '';
            var first = true;
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    result += first ? '' : '&';
                    first = false;
                    result += encodeURIComponent(prop) + '=' + encodeURIComponent(obj[prop]);
                }
            }
            return result;
        },

        parseError: function (entry) {
            var message;
            if (!entry) {
                message = "undefined";
            } else if (_.isString(entry)) {
                message = entry;
            } else if (entry.errorCode && environment.lexemesService) {
                message = environment.lexemesService.getErrorToken(entry.errorCode, entry.errorTokenArgs);
            } else if (_.isString(entry.message)) {
                message = entry.message;
            } else if (_.isString(entry.error)) {
                message = entry.error;
            } else if (entry.status) {
                message = entry.statusText + " (" + entry.status + ")";
            } else {
                message = _.toJSON(entry);
            }

            return message;
        },

        onErrorCode: function (errorCode, errorTokenArgs) {
            if (future.onErrorHandler) {
                if (errorTokenArgs && errorTokenArgs.length) {
                    errorTokenArgs.unshift(null);
                }
                future.onErrorHandler({ errorCode: errorCode, errorTokenArgs: errorTokenArgs });
            }
        },

        dateToString: function (date) {
            var d = date.getDate();
            var m = date.getMonth() + 1;
            var y = date.getFullYear();
            return '' + y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d) + ' ' +
                date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
        },
        log: function (entry, errorLevel) {
            var message = entry instanceof Error ? entry.stack : entry;

            logRecords.push({
                errorLevel: errorLevel || 'log',
                message: _.toJSON(message),
                time: _.dateToString(new Date())
            });

            if (environment.console && environment.console.log) {
                environment.console.log(message);
            }
        },
        printLog: function () {
            var logLength = logRecords.length;
            var result = "";
            for (var i = 0; i < logLength; i++) {
                var record = logRecords[i];
                result += "[" + record.time + "] " + record.errorLevel + ": " + record.message + "\n";
            }
            return result;
        },
        logBrowserInfo: function () {
            if (!environment.navigator) {
                return;
            }
            var appName = environment.navigator.appName;
            var userAgent = environment.navigator.userAgent;
            var match = userAgent.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i), tem;

            if (match && (tem = userAgent.match(/version\/([\.\d]+)/i)) !== null) {
                match[2] = tem[1];
            }

            var result = "Browser info: ";
            result += match ? (match[1] + " " + match[2]) : (appName + " " + navigator.appVersion + "-?");

            _.log(result, 'info');
        },
        ignore: function () {
        },
        process: function (source, generator) {
            var result = {};

            for (var key in source) {
                if (source.hasOwnProperty(key)) {
                    result[key] = generator(source[key], key);
                }
            }

            return result;
        },
        toString: function (value) {
            return (value === undefined || value === null) ? "" : String(value);
        },
        decodeHTML: function (s) {
            return ('' + s).replace(amp, '&').replace(lt, '<').replace(gt, '>').replace(quot, '"')
                .replace(apost, '\'').replace(slash, '/').replace(space, String.fromCharCode(0x00a0));
        },

        encodeHTML: function (s) {
            return ('' + s).replace(_amp, '&amp;').replace(_lt, '&lt;').replace(_gt, '&gt;')
                .replace(_quot, '&quot;').replace(_apost, '&#39;').replace(_slash, '&#47;').replace(_space, '&nbsp;');
        },
        escapeJSON: function (s) {
            return  ('' + s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
                .replace(/\n/gm, '\\n').replace(/\t/gm, '\\t').replace(/\r/gm, '\\r');
        }
    });

    environment.await = function (asyncFunction) {
        return function () {
            var resultAsync = future.create();

            future.whenAll(arguments).then(function () {
                var result = asyncFunction.apply(resultAsync, arguments);

                if (result !== undefined && !resultAsync.isResolved && !resultAsync.isRejected) {
                    resultAsync.resolve(result);
                }
            });

            return resultAsync;
        };
    };

    function Deferred() {
    }

    Deferred.prototype.then = function (callback, failCallback) {
        future.when(this).then(callback, failCallback);
    };

    Deferred.prototype.resolve = function (data) {
        if (this.isResolved) {
            _.log("Resolved already resolved deferred");
            throw new Error("Resolved already resolved deferred");
        }

        if (this.isRejected) {
            _.log("Resolved already rejected deferred");
            throw new Error("Resolved already rejected deferred");
        }

        this.isResolved = true;
        this.data = data;

        if (this.onResolve) {
            this.onResolve(data);
        }

        return this;
    };

    Deferred.prototype.reject = function (data) {
        if (this.isResolved) {
            _.log("Rejected already resolved deferred");
            throw new Error("Rejected already resolved deferred");
        }

        if (this.isRejected) {
            _.log("Rejected already rejected deferred");
            throw new Error("Rejected already rejected deferred");
        }

        this.isRejected = true;
        this.data = data;

        if (this.onReject) {
            this.onReject(data);
        }

        return this;
    };

    Deferred.prototype.destroy = function () {
        this.data = null;
        this.onResolve = null;
        this.onReject = null;
    };

    function Cache() {
        this.response = {};
        this.promise = {};
    }

    Cache.prototype.clear = function () {
        this.response = {};
    };

    Cache.prototype.resolveAsync = function (key, asyncMethod, process) {
        var self = this;
        var resultAsync = future.create();

        if (self.response[key]) {
            resultAsync.resolve(self.response[key]);
        } else if (self.promise[key]) {
            self.promise[key].push(resultAsync);
        } else {
            self.promise[key] = [resultAsync];

            future.when(asyncMethod(key)).then(function (response) {
                self.response[key] = process ? process(response) : response;

                _.each(self.promise[key], function (promise) {
                    promise.resolve(self.response[key]);
                });

                self.promise[key] = null;
            }, function (error) {
                _.each(self.promise[key], function (promise) {
                    promise.reject(error);
                });

                self.promise[key] = null;

                return false;
            });
        }

        return resultAsync;
    };

    environment.future = {
        onFail: function (fail, data) {
            var showErrorDialog = true;

            _.log(data, "reject");

            if (fail) {
                try {
                    var result = fail(data);

                    if (result === false) {
                        showErrorDialog = false;
                    } else if (result) {
                        data = result;
                    }
                }
                catch (e) {
                    _.log(e, "fail");
                }
            }

            if (showErrorDialog && this.onErrorHandler) {
                this.onErrorHandler(data);
            }
        },

        onDone: function (done, fail, data) {
            if (!done) {
                return;
            }

            try {
                done(data);
            }
            catch (e) {
                this.onFail(fail, e);
            }
        },

        when: function (deferred) {
            var self = this;
            return {
                then: function (done, fail) {
                    if (!(deferred instanceof Deferred)) {
                        self.onDone(done, fail, deferred);
                    } else if (deferred.isResolved) {
                        self.onDone(done, fail, deferred.data);
                        deferred.destroy();
                    } else if (deferred.isRejected) {
                        self.onFail(fail, deferred.data);
                        deferred.destroy();
                    } else {
                        deferred.onResolve = function (data) {
                            self.onDone(done, fail, data);
                            deferred.destroy();
                        };
                        deferred.onReject = function (data) {
                            self.onFail(fail, data);
                            deferred.destroy();
                        };
                    }
                }
            };
        },

        whenAll: function (deferreds) {
            var self = this;
            return {
                then: function (done, fail) {
                    if (!deferreds || deferreds.length === 0) {
                        self.onDone(done, fail);
                        return;
                    }

                    var waiting = deferreds.length;
                    var values = new Array(waiting);

                    var onDone = function (cursor, data) {
                        waiting--;
                        values[cursor] = data;

                        if (waiting === 0 && done) {
                            try {
                                done.apply(this, values);
                            }
                            catch (e) {
                                self.onFail(fail, e);
                            }
                        }
                    };

                    var destroyAll = function () {
                        for (var index = 0; deferreds && index < deferreds.length; index++) {
                            var deferred = deferreds[index];
                            deferred.destroy();
                        }

                        deferreds = null;
                    };

                    for (var index = 0; deferreds && index < deferreds.length; index++) {
                        var deferred = deferreds[index];

                        if (!(deferred instanceof Deferred)) {
                            onDone(index, deferred);
                        } else if (deferred.isResolved) {
                            onDone(index, deferred.data);
                            deferred.destroy();
                        } else if (deferred.isRejected) {
                            self.onFail(fail, deferred.data);
                            destroyAll();
                            return;
                        } else {
                            deferred.onResolve = (function (index, deferred) {
                                return function (data) {
                                    onDone(index, data);
                                    deferred.destroy();
                                };
                            })(index, deferred);

                            deferred.onReject = (function (deferred) {
                                return function (data) {
                                    self.onFail(fail, data);
                                    destroyAll();
                                };
                            })(deferred);
                        }
                    }
                }
            };
        },

        create: function () {
            return new Deferred();
        },

        createCache: function () {
            return new Cache();
        },

        latest: function (key, context, deferred) {
            var resultAsync = this.create();
            key = "__resend_" + key + "__";
            context[key] = context[key] + 1 || 1;
            var order = context[key];

            var done = function (data) {
                if (order === context[key]) {
                    resultAsync.resolve(data);
                    context[key] = null;
                } else {
                    resultAsync.destroy();
                }
            };

            var fail = function (error) {
                if (order === context[key]) {
                    resultAsync.reject(error);
                    context[key] = null;
                } else {
                    resultAsync.destroy();
                }
                return false;
            };

            this.when(deferred).then(done, fail);

            return resultAsync;
        }
    };

    var future = environment.future;

    function AppConfig() {
        this.world = "";
        this.baseUrl = "";
        this.version = undefined;
        this.lang = undefined;
        this.contextId = undefined;
        this.claims = [];
    }

    environment.appConfig = new AppConfig();

    function Loader() {
        this.moduleDefines = {};
        this.moduleCache = future.createCache();
        this.instanceCache = future.createCache();
        this.appConfig = environment.appConfig;
    }

    Loader.prototype.combinePath = function () {
        var combine = function (path1, path2) {
            path1 = path1 || '';
            path2 = path2 || '';
            if (path1.startsWith && path1.startsWith('/')) {
                path1 = path1.substr(1);
            }
            if (path2.endsWith && path2.endsWith('/')) {
                path2 = path2.slice(0, -1);
            }
            if (path2.startsWith && path2.startsWith('/')) {
                path2 = path2.substr(1);
            }
            if (path1.endsWith && path1.endsWith('/')) {
                path1 = path1.slice(0, -1);
            }
            return path1 + '/' + path2;
        }

        var result = '';
        for (var i = 0; i < arguments.length; i++) {
            result = combine(result, arguments[i]);
        }
        return result;
    };

    Loader.prototype.buildDemand = function (demand) {
        var self = this;

        function getModuleValueAsync(demand) {
            var resultAsync = future.create();

            function resolveInModuleDefines(demand) {
                var moduleDefine = self.moduleDefines[demand];

                if (!moduleDefine) {
                    resultAsync.resolve();
                    return;
                }

                self.require(moduleDefine.demands,
                    function () {
                        var value = moduleDefine.valueGenerator.apply(environment, arguments);
                        resultAsync.resolve(value);
                    }, function (error) {
                        resultAsync.reject(error);
                    });
            }

            if (self.moduleDefines.hasOwnProperty(demand)) {
                resolveInModuleDefines(demand);
            } else {
                var script = document.createElement('script');
                script.type = "text/javascript";
                document.getElementsByTagName('head')[0].appendChild(script);

                script.onload = function () {
                    resolveInModuleDefines(demand);
                };

                script.onerror = function () {
                    resultAsync.reject(new Error("Failed during script loading, demand name = " + demand));
                };

                script.src = demand;
            }

            return resultAsync;
        }

        return self.moduleCache.resolveAsync(demand, getModuleValueAsync);
    };

    Loader.prototype.buildInstance = function (instanceDemand) {
        var self = this;

        function getInstanceValueAsync(instanceDemand) {
            var resultAsync = future.create();

            self.require([instanceDemand],
                function (ConstructorValue) {
                    if (ConstructorValue === undefined) {
                        resultAsync.reject("No constructor for " + instanceDemand);
                        return;
                    }

                    resultAsync.resolve(new ConstructorValue());
                },
                function (e) {
                    resultAsync.reject(e);
                }
            );

            return resultAsync;
        }

        return self.instanceCache.resolveAsync(instanceDemand, getInstanceValueAsync);
    };

    Loader.prototype.require = function (demands, callback, failCallback) {
        var self = this;

        var demandPromises = _(demands).map(
            function (demand) {
                if (demand.hasOwnProperty('instance')) {
                    return self.buildInstance(demand.path);
                } else {
                    return self.buildDemand(demand);
                }
            });

        future.whenAll(demandPromises).then(
            function () {
                if (_.isArray(demands)) {
                    callback.apply(environment, arguments);
                } else {
                    callback.call(environment, _.object(_.keys(demands), arguments));
                }
            },
            function () {
                return failCallback.apply(environment, arguments);
            });
    };

    Loader.prototype.define = function (moduleName, demands, valueGenerator) {
        this.moduleDefines[moduleName] = { demands: demands, valueGenerator: valueGenerator };
    };

    Loader.prototype.instance = function (moduleName, value) {
        if (value) {
            this.instanceCache.response[moduleName] = value;
        }

        return { path: moduleName, instance: true };
    };

    Loader.prototype.buildPath = function (path, extension) {
        if (extension && !path.endsWith(extension)) {
            path += '.' + extension;
        }

        this.pathCache = this.pathCache || {};
        if (this.pathCache[path]) {
            return this.pathCache[path];
        }

        var key = path;

        path = this.combinePath(this.appConfig.baseUrl, path);

        path += "?version=" + this.appConfig.version + "&lang=" + this.appConfig.lang;

        this.pathCache[key] = path;
        return path;
    };

    environment.loader = new Loader();

    environment.require = function (demands, callback, failCallback) {
        return environment.loader.require(demands, callback, failCallback);
    };

    environment.define = function (moduleName, demands, valueGenerator) {
        return environment.loader.define(moduleName, demands, valueGenerator);
    };

    environment.instance = function (moduleName, value) {
        return environment.loader.instance(moduleName, value);
    };
}).call(this);