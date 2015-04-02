define('core/services/navigationService', {
    Object: 'core/object',
    resourceService: instance('core/services/resourceService'),
    routerService: instance('core/router/router')
}, function (imported) {
    var _isRollback = false;
    return imported.Object.extend({
        initialize: function () {
            this.gaq = window._gaq || [];
            this.gaq.push(['_setAccount', 'UA-34078839-1']);
            this.gaq.push(['_setDomainName', 'goodwix.com']);
            this.gaq.push(['_trackPageview']);
        },

        go: function (route, titleBody, titleSuffix) {
            route = route.replace(/\/$/, '');
            imported.routerService.navigate(route, {replace: true});

            imported.resourceService.set('titleBody', titleBody);
            imported.resourceService.set('titleSuffix', titleSuffix);

            this.writeGA(titleBody);
        },

        goBack: function (silent) {
            window.history.back();
            _isRollback = silent;
        },

        checkRollBack: function () {
            var result = _isRollback;
            _isRollback = false;
            return result;
        },

        setTitle: function (titleBody, titleSuffix) {
            imported.resourceService.set('titleBody', titleBody);
            imported.resourceService.set('titleSuffix', titleSuffix);
        },

        writeGA: function (pageName) {
            //this.gaq.push(['_trackPageview', pageName]);
        },

        routeTo: function (route, replace) {
            if (route.startsWith('~')) {
                window.location.replace(route.substr(1));
            }
            else {
                imported.routerService.navigate(route, { trigger: true, replace: replace });
            }
        },

        openInNewTab: function(url) {
            var win = window.open(url, '_blank');
        },

        routeToHome: function (replace) {
            this.routeTo('home', replace);
        },

        routeToMainPage: function () {
            window.location.href = "main";
        }
    });
});