'use strict';

// A Navigation target
angular.module('keyboard.navigation')
  .directive('navTarget', [function () {

    return {
      // Attribute only
      restrict: 'A',

      // Required parent nav
      require: '^navElem',

      // Scope
      scope: false,

      // Link function
      link: function(scope, element, attrs, parentNav) {
        parentNav.registerTarget(element);
      }
    };
  }]);

