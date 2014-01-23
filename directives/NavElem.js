'use strict';

// A Navigation leaf
angular.module('keyboard.navigation')
  .directive('navElem', ['$location', '$timeout', '$injector', function ($location, $timeout, $injector) {

    return {
      // Attribute only
      restrict: 'A',

      // Required parent nav
      require: ['navElem', '^nav'],

      // Scope
      scope: true,

      // Controller
      controller: [function() {

        // The parent controller
        var parentNav;

        // The "target" element if any
        this.target = false;

        // Register a target
        this.registerTarget = function(targetElem) {
          this.target = targetElem;
        };

        // Key handlers
        var keyHandlers = {};

        this.handleKey = function(dir) {
          var fn = keyHandlers[dir];
          if(fn && typeof fn === 'function') {
            return keyHandlers[dir](dir, this);
          }
          return parentNav && parentNav.handleKey(dir);
        };

        this.addHandler = function(dir, fn) {
          keyHandlers[dir] = fn;
        };

        this.postLink = function(p) {
          parentNav = p;
        };

      }],

      // Link function
      link: function(scope, element, attrs, navs) {

        var thisNav = navs[0];
        var parentNav = navs[1];

        // Are we using the angular ui-router module?
        var $state = false;
        if($injector.has('$state') {
          $state = $injector.get('$state');
        }

        // Expose thisNav as $nav
        scope.$nav = thisNav;
        scope.$parentNav = parentNav;

        var caps = function(str) {
          if(typeof str !== 'string' || !str.length) {
            return str;
          }
          return str[0].toUpperCase() + str.slice(1);
        };

        angular.forEach(['up', 'down', 'left', 'right', 'enter'], function(key) {
          var handler = attrs['navKey'+caps(key)];
          if(handler) {
            thisNav.addHandler(key, scope.$eval(handler));
          }
        });

        var order = attrs.navOrder;
        var isEnabledCheck = null;

        // If no nav-target elements were defined, register itself as a target
        if(!thisNav.target) {
          thisNav.registerTarget(element);
        }

        if(attrs.navEnabled) {
          var enabledExpr = attrs.navEnabled;
          isEnabledCheck = function() {
            return scope.$eval(enabledExpr);
          };
          scope.$watch(isEnabledCheck, function(enabled) {
            if(!enabled) {
              parentNav.unfocus();
            }
          });
        }

        parentNav.registerChild(element, order, isEnabledCheck);

        scope.$on('keyEvent', function(e, dir) {
          if(parentNav.isChildFocused(element)) {
            if(thisNav.handleKey(dir)) {
              return;
            }

            if(dir==='enter') {
              // Perform action after a timeout
              // because the action may change the focus and without
              // a timeout, the click may be performed on the newly
              // focused element as well
              $timeout(function() {
                var target = thisNav.target;
                var href = target.attr('href');
                var sref = target.attr('ui-sref');
                if($state && sref) {
                  $state.go(sref);
                } else if (href) {
                  $location.url(href);
                } else {
                  target.triggerHandler('click');
                }
              }, 0);
              return;
            }
            // On any other direction key, unfocus
            if(['up','down','left','right'].indexOf(dir) >= 0) {
              parentNav.unfocus(dir);
            }
          }
        });

        // Is this element focused
        scope.isNavFocused = function(elem) {
          if(!elem) {
            elem = element;
          }
          return parentNav.isChildFocused(elem);
        };

        // Post link processing
        thisNav.postLink(parentNav);
      }
    };
  }]);

