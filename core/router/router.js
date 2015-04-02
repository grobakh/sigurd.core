// Generated by CoffeeScript 1.6.3
(function() {
  define('core/router/router', {
    Object: 'core/object',
    appConfig: instance('appConfig')
  }, function(imported) {
    var routeStripper;
    routeStripper = /^[#\/]/;
    return imported.Object.extend({
      constructor: function() {
        return window.addEventListener('hashchange', _.bind(this.hashChanged, this));
      },
      register: function(routes, context) {
        this.routes = routes;
        this.context = context;
        return this.hashChanged();
      },
      route: function(fragment) {
        var overrideParams, pattern, routeObject;
        for (pattern in this.routes) {
          if (this.routes.hasOwnProperty(pattern)) {
            routeObject = this.getRouteObject(fragment, pattern);
            if (routeObject) {
              overrideParams = this.routes[pattern];
              routeObject = _.extend(routeObject, overrideParams);
              this.extendWithClaimsAndDefaults(routeObject);
              this.context.openInterface(routeObject);
              return true;
            }
          }
        }
        throw new Error("Cannot parse route fragment:" + fragment);
      },
      hashChanged: function() {
        var hash;
        hash = window.location.hash;
        hash = hash.replace(routeStripper, '');
        if (this.currentHash === hash) {
          return;
        }
        this.currentHash = hash;
        hash = decodeURIComponent(hash);
        return this.route(hash);
      },
      navigate: function(fragment, options) {
        options = options || {};
        this.currentHash = fragment;
        if (options.replace) {
          window.location.replace(window.location.toString().replace(/(javascript:|#).*$/, '') + '#' + fragment);
        } else {
          window.location.hash = fragment;
        }
        if (options.trigger) {
          this.route(fragment);
        }
      },
      getRouteObject: function(route, pattern) {
        var key, parameters, result, values;
        parameters = pattern.split("/");
        values = route.split("/");
        if (parameters.length > values.length) {
          return;
        }
        result = {};
        key = parameters.shift();
        while (key || key === '') {
          if (key[0] === ":") {
            result[key.slice(1)] = values.shift();
          } else if (key !== values.shift()) {
            return;
          }
          key = parameters.shift();
        }
        result["*"] = values.join("/");
        result.getRest = function() {
          return this['*'];
        };
        return result;
      },
      extendWithClaimsAndDefaults: function(routeObject) {
        var claimConstructor, defaultStructure, pascal, routeValue, routeValueName, _i, _len;
        claimConstructor = 'canView';
        defaultStructure = imported.appConfig.defaultRouteStructure;
        pascal = function(name) {
          if (name) {
            return name.slice(0, 1).toUpperCase() + name.slice(1);
          } else {
            return "";
          }
        };
        routeObject.path = [];
        for (_i = 0, _len = defaultStructure.length; _i < _len; _i++) {
          routeValueName = defaultStructure[_i];
          routeValue = routeObject[routeValueName];
          if (!routeValue) {
            break;
          }
          claimConstructor += pascal(routeValue);
          routeObject.path.push(routeValue);
        }
        if (!routeObject.claim && !routeObject.hasOwnProperty('redirect') && !routeObject.isAction) {
          return routeObject.claim = claimConstructor;
        }
      }
    });
  });

}).call(this);
