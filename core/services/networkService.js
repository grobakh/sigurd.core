define('core/services/networkService', {
    Object: 'core/object',
    appConfig: instance('appConfig')
}, function (imported) {
    var watchDog;
    return imported.Object.extend({
        constructor: function () {
            var self = this;

            //cookie implementation
            window.document.setCookie = function (name, value, expiresMs, path, domain, secure) {
                var twoYears = 1000 * 60 * 60 * 24 * 365 * 2;

                if (!name || !value) {
                    return false;
                }
                var str = name + '=' + encodeURIComponent(value);
                expiresMs = expiresMs || twoYears;

                if (expiresMs) {
                    var date = new Date();
                    date.setTime(date.getTime() + expiresMs);
                    str += "; expires=" + date.toGMTString();
                }
                if (path) {
                    str += '; path=' + path;
                }
                if (domain) {
                    str += '; domain=' + domain;
                }
                if (secure) {
                    str += '; secure';
                }

                document.cookie = str;
                return true;
            };

            window.document.getCookie = function (name) {
                var pattern = "(?:; )?" + name + "=([^;]*);?";
                var regexp = new RegExp(pattern);

                if (regexp.test(document.cookie)) {
                    return decodeURIComponent(RegExp.$1);
                }

                return false;
            };

            window.document.unsetCookie = function (name, path, domain) {
                if (document.getCookie(name)) {
                    document.cookie = name + "=" + ( ( path ) ? ";path=" + path : "") +
                        ( ( domain ) ? ";domain=" + domain : "" ) + ";expires=Thu, 01-Jan-1970 00:00:01 GMT";
                }
            };

            //ajax implementation
            self.ajax = {};

            window.ping = function (path, params) {
                if (typeof(params) === 'object') {
                    params = self.objectParamsToString(params);
                }
                return self.ajax.get(path, params, false);
            };

            window.post = function (path, params) {
                if (typeof(params) === 'object') {
                    params = self.objectParamsToString(params);
                }
                return self.ajax.post(path, params, false);
            };

            self.ajax.getHttpRequest = function () {
                if (window.XMLHttpRequest) {
                    return new XMLHttpRequest();
                }
                else if (window.ActiveXObject) {
                    return new window.ActiveXObject("Microsoft.XMLHTTP");
                }
                throw new Error("There is no XMLHttp object in your browser.");
            };

            self.ajax.getPlainText = function (fullPath) {
                var resultAsync = future.create();
                var httpRequest = self.ajax.getHttpRequest();

                httpRequest.open("GET", fullPath, true);
                httpRequest.setRequestHeader("Accept", "text/plain, */*; q=0.01");
                httpRequest.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                httpRequest.send(null);

                httpRequest.onreadystatechange = function () {
                    self.ajax.onReadyStateChange(fullPath, httpRequest, resultAsync, false, false, true);
                };

                return resultAsync;
            };

            self.ajax.pingFile = function (path, params, process) {
                return self.ajax.head(path, params, process);
            };

            self.ajax.head = function (path, paramsString, process) {
                var resultAsync = future.create();
                var httpRequest = self.ajax.getHttpRequest();
                var fullPath = self.generatePath(path);

                httpRequest.open("HEAD", fullPath + (paramsString ? ('?' + paramsString) : ''), true);
                httpRequest.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                httpRequest.send(null);

                httpRequest.onreadystatechange = function () {
                    self.ajax.onReadyStateChange(path, httpRequest, resultAsync, process, true);
                };

                return resultAsync;
            };

            self.ajax.get = function (path, paramsString, process) {
                var resultAsync = future.create();
                var httpRequest = self.ajax.getHttpRequest();
                var fullPath = self.generatePath(path);

                httpRequest.open("GET", fullPath + (paramsString ? ('?' + paramsString) : ''), true);
                httpRequest.send(null);

                httpRequest.onreadystatechange = function () {
                    self.ajax.onReadyStateChange(path, httpRequest, resultAsync, process);
                };

                return resultAsync;
            };

            self.ajax.postFile = function (path, params, process) {
                return self.ajax.post(path, params, process);
            };

            self.ajax.postJson = function (path, json, process) {
                var resultAsync = future.create();
                var httpRequest = self.ajax.getHttpRequest();
                var fullPath = self.generatePath(path);

                httpRequest.open("POST", fullPath, true);
                httpRequest.setRequestHeader("Content-Type","application/json;charset=UTF-8");
                httpRequest.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                httpRequest.send(json);

                httpRequest.onreadystatechange = function () {
                    self.ajax.onReadyStateChange(path, httpRequest, resultAsync, process);
                };

                return resultAsync;
            };

            self.ajax.post = function (path, paramsString, process) {
                var resultAsync = future.create();
                var httpRequest = self.ajax.getHttpRequest();
                var fullPath = self.generatePath(path);

                httpRequest.open("POST", fullPath, true);
                httpRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
                httpRequest.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                httpRequest.send(paramsString);

                httpRequest.onreadystatechange = function () {
                    self.ajax.onReadyStateChange(path, httpRequest, resultAsync, process);
                };

                return resultAsync;
            };

            //Стандартизированный обработчик ответов GET-, POST- и HEAD-запросов:
            //path - адрес выполняемой на сервере команды (используется только для логирования)
            //httpRequest - полный http-ответ с сервера
            //resultAsync - future-обещание
            //process - функция, обеспечивающая обработку ответа
            //noResponse - флаг, отвечающий за ожидание осмысленного ответа (если true - происходит мгновенный resolve)
            //noParse - флаг, отвечающий за JSON-парсинг ответа (если true - ответ воспринимается как простая строка)
            self.ajax.onReadyStateChange = function (path, httpRequest, resultAsync, process, noResponse, noParse) {
                if (httpRequest.readyState === 4) {

                    var standardServerError = {
                        errorCode: "errors.unknownServerError",
                        message: "Server error",
                        url: path,
                        httpRequest: null
                    };

                    if (watchDog && watchDog.processResponse) {
                        watchDog.processResponse(httpRequest, path);
                    }

                    standardServerError.httpRequest = httpRequest;
                    if (httpRequest.status === 200) {

                        if (noResponse) {
                            if (httpRequest.statusText.toLowerCase() === "ok") {
                                resultAsync.resolve();
                            }
                            else {
                                resultAsync.reject(standardServerError);
                            }
                        }
                        else if (_.isString(httpRequest.responseText)) {
                            var response = noParse ? httpRequest.responseText : _.parseJSON(httpRequest.responseText);

                            if (noParse) {
                                resultAsync.resolve(process ? process(response) : response);
                            }
                            else if (!response) {
                                standardServerError.message = "Server response is empty.";
                                resultAsync.reject(standardServerError);
                            }
                            else if (response.error === "ok") {
                                resultAsync.resolve(process ? process(response) : response);
                            }
                            else { //случай перехвата и отдачи сервером осмысленной ошибки с кодом
                                resultAsync.reject({error: response.error, url: path, response: response});
                            }
                        }
                        else {
                            standardServerError.message = "Server response text is undefined.";
                            resultAsync.reject(standardServerError);
                        }
                    }
                    else if (httpRequest.status === 0) {
                        resultAsync.reject({
                            errorCode: "errors.canceledRequest",
                            message: "Request was canceled. Connection lost",
                            url: path,
                            httpRequest: null
                        });
                    }
                    else {
                        standardServerError.message += " (" + httpRequest.status + ")";
                        resultAsync.reject(standardServerError);
                    }
                }
            };
        },

        attachWatchDog: function (dog) {
            watchDog = dog;
        },

        newWindow: function (path) {
            return window.open(imported.appConfig.host + '/' + path + '?lang=' +
                imported.appConfig.lang, '_blank');
        },

        generatePath: function (path) {
            return loader.combinePath(imported.appConfig.host, path);
        },

        objectParamsToString: function (params, isNotAuthorized) {
            var paramsString = "";
            params = params || {};
            params.lang = imported.appConfig.lang;
            if (!isNotAuthorized) {
                params.contextId = imported.appConfig.contextId;
            }

            var rest = 0;
            _.each(params, function (value, key) {
                if (!_.isUndefined(value)) {
                    paramsString += (rest++ ? "&" : "") + key + '=' + encodeURIComponent(value);
                }
            });

            return paramsString;
        },

        postObjectAsync: function (methodName, object, process) {
            return this.ajax.postJson(methodName, _.toJSON(object), process);
        },

        reliablePostAsync: function (methodName, params, process) {
            var self = this;
            if (watchDog && watchDog.reliableExecute) {
                return watchDog.reliableExecute(function () {
                    return self.postAsync(methodName, params, process);
                })
            }
            else {
                _.log('WatchDog should be attached to use reliablePostAsync');
                return self.postAsync(methodName, params, process);
            }
        },

        postAsync: function (methodName, params, process) {
            var paramsString = this.objectParamsToString(params);
            return this.ajax.post(methodName, paramsString, process);
        },

        postNotAuthorizedAsync: function (methodName, params, process) {
            var paramsString = this.objectParamsToString(params, true);
            return this.ajax.post(methodName, paramsString, process);
        },

        downloadUrlAsync: function (fileName, id) {
            var self = this;
            var path = "file/" + fileName;
            var params = "id=" + id + "&type=application/octet-stream";
            var fullUrl = self.generatePath(path) + "?" + params;

            future.when(self.ajax.pingFile(path, params, null)).then(function () {
                window.open(fullUrl, "_self");
            });
        }

    });
});
