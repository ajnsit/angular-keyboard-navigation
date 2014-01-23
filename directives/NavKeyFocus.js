'use strict';

angular.module('keyboard.navigation')
  .directive('navKeyFocus', [function() {

    return {
      restrict: 'A',

      // Required parent controller
      require: '^navKeys',

      link: function postLink(scope, element, attrs, parent) {

        var ns = attrs.keyEventFocus;
        var isEnabledCheck = null;

        if(attrs.focusEnabled) {
          var enabledExpr = attrs.focusEnabled;
          isEnabledCheck = function() {
            return scope.$eval(enabledExpr);
          };
        }

        parent.registerFocus(element, ns, isEnabledCheck);

        scope.$on(ns+'.keyEvent', function(_, val) {
          scope.$broadcast('keyEvent', val);
        });

      }
    };
  }]);

