define('core/watchDog/watchDog', {
    Object: 'core/object',
    Collection: 'core/collection',
    networkService: instance('core/services/networkService'),
    appConfig: instance('appConfig')
}, function (imported) {

    var defaultInterval = 80000;
    var defaultIntervalFast = 10000;
    var oldInterval;
    var currentInterval;
    var isActivated = false;
    var targetUrl = undefined;

    var successHandlers = new imported.Collection();
    var failHandlers = new imported.Collection();
    var timeoutHandle;
    var waitingResponse;


    return imported.Object.extend({
        calledFromNetWork: 0,
        calledServer: 0,

        constructor: function () {
            window.watchDog = this;
        },

        getCurrentInterval: function () {
            return currentInterval;
        },

        activate: function (url, interval) {
            if (!isActivated) {
                if (url) {
                    isActivated = true;
                    targetUrl = url;
                    this.startWatching(interval);
                }
                else {
                    throw new Error("Server url should be specified");
                }

            } else {
                throw new Error("WatchDog is already activated.");
            }
        },

        startWatching: function (interval) {
            var self = this;
            waitingResponse = false;
            clearTimeout(timeoutHandle);
            currentInterval = interval;
            if (currentInterval !== 0 && !currentInterval) {
                currentInterval = defaultInterval;
            }
            var checkServer = function () {
                if(!targetUrl) {
                    console.log("Server url should be specified");
                    return;
                }

                waitingResponse = true;
                self.calledServer++;
                future.when(imported.networkService.postAsync(targetUrl)).then(function () {
                    if (!waitingResponse) {
                        return;
                    }
                    timeoutHandle = _.delay(checkServer, currentInterval); //should be called before handlers to prevent double timeouts (handler can call startWatching)
                    currentInterval = oldInterval || currentInterval;
                    self.executeSuccessHandlers();

                }, function (error) {
                    if (!waitingResponse) {
                        return;
                    }
                    oldInterval = currentInterval;
                    currentInterval = defaultIntervalFast;
                    timeoutHandle = _.delay(checkServer, currentInterval);
                    self.executeFailHandlers(error);
                    return false;
                });
            };

            timeoutHandle = _.delay(checkServer, currentInterval);
        },

        checkServer: function (callback) {
            var self = this;
            self.startWatching(0);
            self.addFailHandler(function () {
                if (callback) {
                    callback.call(null, false);
                }
            });

            self.addSuccessHandler(function () {
                self.startWatching();
                if (callback) {
                    callback.call(null, true);
                }
            });
        },

        stopWatching: function () {
            _.log('watchDog was stopped.');
            clearInterval(timeoutHandle);
        },

        executeFailHandlers: function (error) {
            var handlersToRemove = [];

            failHandlers.each(function (handler) {
                handler.callback.call(null, error);
                if (!handler.isPermanent) {
                    handlersToRemove.push(handler);
                }
            });

            failHandlers.remove(handlersToRemove);
        },

        executeSuccessHandlers: function () {
            var handlersToRemove = [];

            successHandlers.each(function (handler) {
                handler.callback.call();
                if (!handler.isPermanent) {
                    handlersToRemove.push(handler);
                }
            });

            successHandlers.remove(handlersToRemove);
        },

        addFailHandler: function (callback, isPermanent) {
            failHandlers.push({callback: callback, isPermanent: isPermanent});
        },

        addSuccessHandler: function (callback, isPermanent) {
            successHandlers.push({callback: callback, isPermanent: isPermanent});
        },

        removeFailHandler: function (callback) {
            var handler = failHandlers.first(function(item){
                return item.callback == callback;
            });
            failHandlers.remove(handler);
        },

        removeSuccessHandler: function (callback) {
            var handler = successHandlers.first(function(item){
                return item.callback == callback;
            });
            successHandlers.remove(handler);
        },

        processResponse: function (httpRequest, path) {
            this.calledFromNetWork++;
            if (path !== targetUrl && (httpRequest.status !== 404 || httpRequest.status !== 0)) {
                this.startWatching();
            }
        },

        reliableExecute: function (request) {
            var self = this;
            var resultAsync = future.create();

            var process = function (wasReconnected) {
                future.when(request.call()).then(function (result) {
                    resultAsync.resolve(result);
                }, function (error) {
                    var status = error.httpRequest.status;
                    if ((status === 404 || status === 0) && !wasReconnected) {
                        self.checkServer(function (isAlive) {
                            if (isAlive) {
                                process(true);
                            }
                        });
                    }
                    else {
                        resultAsync.resolve(error);
                    }
                    return false;
                });
            };
            process();
            return resultAsync;
        }
    });
});