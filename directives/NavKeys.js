'use strict';

angular.module('keyboard.navigation')
  .directive('navKeys', [function () {

    // Standard values for KEYCODES

    // Navigation
    var K_ENTER  = 13;
    var K_LEFT   = 37;
    var K_UP     = 38;
    var K_RIGHT  = 39;
    var K_DOWN   = 40;

    return {
      restrict: 'A',

      // This Controller
      require: 'navKeys',

      // Controller
      controller: [function() {

        // The stack of children
        var children = [];

        // Register a focus override
        this.registerFocus = function(element, name, isEnabledCheck) {
          children.push({
            name: name,
            element: element,
            isEnabledCheck: isEnabledCheck
          });

          // Remove the element from childrens array on $destroy
          element.on('$destroy', function() {
            var idx;
            for(idx=0; idx<children.length; idx++) {
              if(children[idx].element === element) {
                children.splice(idx, 1);
                return;
              }
            }
          });
        };

        this.getNamespace = function() {
          var focus;
          if(children.length) {
            focus = children[children.length-1];
            if(!focus.isEnabledCheck || focus.isEnabledCheck()) {
              return children[children.length-1].name + '.';
            }
          }
          return '';
        };

      }],

      link: function postLink(scope, element, _, ctrl) {

        // Top level key handlers
        // The key events are normalised and propagated
        element.bind('keydown', function(e) {

          // Namespace
          var ns = ctrl.getNamespace();

          scope.$apply(function() {
            switch(e.keyCode) {

            case K_ENTER:
              scope.$broadcast(ns+'keyEvent', 'enter');
              break;

            case K_RIGHT:
              scope.$broadcast(ns+'keyEvent', 'right');
              break;

            case K_DOWN:
              scope.$broadcast(ns+'keyEvent', 'down');
              break;

            case K_LEFT:
              scope.$broadcast(ns+'keyEvent', 'left');
              break;

            case K_UP :
              scope.$broadcast(ns+'keyEvent', 'up');
              break;
            }
          });
        });
      }
    };
  }]);

