define 'core/router/router', {
  Object: 'core/object',
  appConfig: instance('appConfig')
}, (imported) ->
  routeStripper = /^[#\/]/;
  imported.Object.extend
    constructor: () ->
      window.addEventListener('hashchange', _.bind(@hashChanged, @));

    register: (routes, context) ->
      @routes = routes
      @context = context
      @hashChanged()

    route: (fragment) ->
      for pattern of @routes
        if @routes.hasOwnProperty(pattern)
          routeObject = @getRouteObject(fragment, pattern)
          if routeObject
            overrideParams = @routes[pattern]
            routeObject = _.extend(routeObject, overrideParams)
            @extendWithClaimsAndDefaults(routeObject)
            @context.openInterface routeObject
            return true
      throw new Error("Cannot parse route fragment:" + fragment)

    hashChanged: () ->
      hash = window.location.hash;
      hash = hash.replace(routeStripper,'');
      return if @currentHash == hash
      @currentHash = hash
      hash = decodeURIComponent(hash);
      @route hash

    navigate: (fragment, options) ->
      options = options || {}
      @currentHash = fragment

      if(options.replace)
        window.location.replace(window.location.toString().replace(/(javascript:|#).*$/, '') + '#' + fragment)
      else
        window.location.hash = fragment

      if(options.trigger)
        @route fragment
      return

    getRouteObject: (route, pattern) ->
      parameters = pattern.split("/")
      values = route.split("/")
      return if parameters.length > values.length
      result = {}
      key = parameters.shift()

      while key or key == ''
        if key[0] is ":"
          result[key.slice(1)] = values.shift()
        else if key isnt values.shift()
          return
        key = parameters.shift()

      result["*"] = values.join("/")
      result.getRest = () -> @['*']

      return result

    extendWithClaimsAndDefaults: (routeObject) ->
      claimConstructor = 'canView'
      defaultStructure = imported.appConfig.defaultRouteStructure

      pascal = (name) ->
        if name then (name.slice(0, 1).toUpperCase() + name.slice(1)) else ""

      routeObject.path = [];

      for routeValueName in defaultStructure
        routeValue = routeObject[routeValueName]
        break if not routeValue
        claimConstructor += pascal(routeValue)
        routeObject.path.push(routeValue)

      routeObject.claim = claimConstructor if not routeObject.claim and not routeObject.hasOwnProperty('redirect') and not routeObject.isAction







