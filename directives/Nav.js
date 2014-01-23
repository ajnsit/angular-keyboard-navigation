'use strict';

// A Navigation container
// Supports horizontal or vertical navigation
angular.module('keyboard.navigation')
  .directive('nav', ['$timeout', function ($timeout) {

    return {
      // Attribute only
      restrict: 'A',

      // This nav
      require: 'nav',

      // scope
      scope: true,

      // Controller
      controller: ['$scope', '$attrs', function($scope, $attrs) {

        // The element
        var element;

        // The parent controller (null if top level)
        var parentNav;

        // The child navigation elements
        var children = [];

        // Function that checks if the current nav is enabled
        var isEnabledCheck;

        // The current focus
        // Exposed to the scope
        $scope.navFocus = 0;

        // The default focus
        var defaultFocus = parseInt($attrs.navDefaultFocus, 10);
        if(!isFinite(defaultFocus)) {
          defaultFocus = 0;
        } else {
          $scope.navFocus = defaultFocus;
        }

        // The row length in a grid layout
        var givenRowLen = parseInt($attrs.nav, 10) || 0;

        // Get the children nav elems of this element
        this.getChildren = function() {
          return children;
        };

        // Did we finish adding more children?
        var frozenChildren = true;

        // Controller provides a function to register a child
        this.registerChild = function(element, order, isEnabledCheck) {
          if(frozenChildren) {
            frozenChildren = false;
            $timeout(function() {
              frozenChildren = true;
            }, 0);
            // TODO: If we are not manually setting the order, then figure out
            // the correct order by putting things in the order they were removed
          }

          // We push the child with the order (if any) into an array
          // The array is later sorted to maintain the ordering
          children.push({
            element: element,
            order: parseInt(order, 10),
            isEnabledCheck: isEnabledCheck
          });

          sortChildren();
          $scope.navFocus = defaultFocus;
          // wrapFocus();

          // Remove the element from childrens array on $destroy
          element.on('$destroy', function() {
            var idx;
            for(idx=0; idx<children.length; idx++) {
              if(children[idx].element === element) {
                children.splice(idx, 1);
                wrapFocus();
                return;
              }
            }
          });
        };

        // Unfocus yourself
        this.unfocusMe = function(dir) {
          if(parentNav && parentNav.isChildFocused(element)) {
            parentNav.unfocus(dir);
          }
        };

        // Returns true if focus changed
        var wrapFocus = function() {
          var focus, oldFocus, wrapped;
          oldFocus = focus = $scope.navFocus;
          wrapped = false;
          while(!children[focus] || (children[focus].isEnabledCheck && !children[focus].isEnabledCheck())) {
            focus--;
            if(focus<0) {
              if(wrapped) {
                // Give up
                focus = 0;
                break;
              }
              wrapped = true;
              focus = children.length-1;
            }
          }
          if(oldFocus !== focus) {
            $scope.navFocus = focus;
            return true;
          }
          return false;
        };
        this.wrapFocus = wrapFocus;

        // Returns true if focus changed
        this.recalcFocus = function() {
          // If parent focus changed, we are no longer focused
          if(parentNav && parentNav.recalcFocus()) {
            return true;
          }
          return wrapFocus();
        };

        var sortChildren = function() {
          // Sort the children by order
          // taking care of unspecified order
          var ordered = children.filter(function(a) {
            return isFinite(a.order);
          });
          var unordered = children.filter(function(a) {
            return !isFinite(a.order);
          });
          ordered.sort(function(a,b) {
            return a.order - b.order;
          });
          children = ordered.concat(unordered);
        };

        this.getFocus = function() {
          if(this.isChildFocused($scope.navFocus)) {
            return $scope.navFocus;
          }
          return -1;
        };

        // Is the element REALLY focused
        this.isChildFocused = function(elem) {
          if(isEnabledCheck) {
            if(!isEnabledCheck()) {
              return false;
            }
          }
          if(parentNav && !parentNav.isChildFocused(element)) {
            return false;
          }
          return this.isChildPotentiallyFocused(elem);
        };

        this.currentlyFocusedChild = function() {
          var child = this.children()[$scope.navFocus];
          if(this.isChildFocused(child)) {
            return child;
          }
          return false;
        };

        // Is the element focused
        this.isChildPotentiallyFocused = function(element) {
          var cur = children[$scope.navFocus];
          if(typeof element === 'number') {
            element = children[element].element;
          }
          // Make sure the element is still attached to the dom
          var parent = element.parent();
          while(parent && parent[0] && parent[0].tagName!=='DOCUMENT') {
            parent = parent.parent();
          }

          return (parent && cur &&
                  (element === cur.element) &&
                  (!cur.isEnabledCheck || cur.isEnabledCheck()));
        };

        // Has the unfocus event finished propagating
        var eventFinishedPropagating = true;

        // Unfocus current element
        this.unfocus = function(dir) {

          // If we still haven't finished the previous cycle, do nothing
          if(!eventFinishedPropagating) {
            return;
          }

          // If rowlen was not set or set to an invalid value,
          //  we assume the entire set of elements to be
          //  in one row (horizontal navigation only)
          // NOTE: We don't overwrite givenRowLen to be able to adapt
          // dynamically to a changing number of elements
          var rowLen = givenRowLen;
          if(!rowLen || rowLen <= 0 || rowLen > children.length) {
            rowLen = children.length;
          }

          // Mark the event propagation cycle as done when it's done
          eventFinishedPropagating = false;
          $timeout(function() {
            eventFinishedPropagating = true;
          }, 0);

          // Store old focus
          var newFocus = $scope.navFocus;

          var isDisabled = true;

          // Handle direction
          switch(dir) {

          case 'up':
            while(newFocus >= rowLen) {
              newFocus -= rowLen;
              if(!children[newFocus].isEnabledCheck || children[newFocus].isEnabledCheck()) {
                isDisabled = false;
                break;
              }
            }
            if(isDisabled) {
              newFocus = $scope.navFocus;
              this.unfocusMe(dir);
              // TODO: What happens when we can't find a focusable object in that
              // direction, and have no parent to unfocus? The focus may disappear!
            }
            break;

          case 'down':
            while(newFocus < children.length - rowLen) {
              newFocus += rowLen;
              if(!children[newFocus].isEnabledCheck || children[newFocus].isEnabledCheck()) {
                isDisabled = false;
                break;
              }
            }
            if(isDisabled) {
              newFocus = $scope.navFocus;
              this.unfocusMe(dir);
              // TODO: What happens when we can't find a focusable object in that
              // direction, and have no parent to unfocus? The focus may disappear!
            }
            break;

          case 'left':
            while(newFocus % rowLen !== 0) {
              newFocus--;
              if(!children[newFocus].isEnabledCheck || children[newFocus].isEnabledCheck()) {
                isDisabled = false;
                break;
              }
            }
            if(isDisabled) {
              newFocus = $scope.navFocus;
              this.unfocusMe(dir);
              // TODO: What happens when we can't find a focusable object in that
              // direction, and have no parent to unfocus? The focus may disappear!
            }
            break;

          case 'right':
            while((newFocus + 1) % rowLen !== 0) {
              newFocus++;
              if(!children[newFocus].isEnabledCheck || children[newFocus].isEnabledCheck()) {
                isDisabled = false;
                break;
              }
            }
            if(isDisabled) {
              newFocus = $scope.navFocus;
              this.unfocusMe(dir);
              // TODO: What happens when we can't find a focusable object in that
              // direction, and have no parent to unfocus? The focus may disappear!
            }
            break;

          default:
            // Find a focusable location
            // TODO: Put in a better algo
            // Currently we select the first focusable child
            for(newFocus=0;newFocus<children.length;newFocus++) {
              if(!children[newFocus].isEnabledCheck || children[newFocus].isEnabledCheck()) {
                isDisabled = false;
                break;
              }
            }
            if(isDisabled) {
              newFocus = $scope.navFocus;
              this.unfocusMe();
              // TODO: What happens when we can't find a focusable object at all
              // and have no parent to unfocus? The focus may disappear!
            }
            break;

          }

          $timeout(function() {
            $scope.navFocus = newFocus;
          }, 0);

        };

        this.resetFocus = function(focus) {
          if(!focus) {
            focus = 0;
          }
          $scope.navFocus = focus;
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

        // Post link processing
        this.postLink = function(e,p,c) {
          // Store the reference to the element
          element = e;
          // Store the reference to parentNav controller
          parentNav = p;
          // Store the reference to isEnabledCheck
          isEnabledCheck = c;
        };

      }],

      // Link function
      link: function(scope, element, attrs, thisNav) {

        // Get parent controller
        // http://docs.angularjs.org/api/angular.element
        //
        // controller(name) - retrieves the controller of the current element or its parent.
        // By default retrieves controller associated with the ngController directive.
        // If name is provided as camelCase directive name, then the controller for this
        // directive will be retrieved (e.g. 'ngModel').
        var parentNav = element.parent().controller('nav');

        // Get the order if any
        var order = attrs.navOrder;

        var isEnabledCheck = null;

        if(attrs.navEnabled) {
          var enabledExpr = attrs.navEnabled;
          isEnabledCheck = function() {
            if(thisNav.getChildren().length <= 0) {
              return false;
            }
            return scope.$eval(enabledExpr);
          };
          $timeout(function() {
            scope.$watch(isEnabledCheck, function(enabled) {
              // TODO: Should we really check for enabled?
              if(!enabled) {
                thisNav.recalcFocus();
              }
            });
          }, 0);
        }

        // Register with parent
        if(parentNav) {
          parentNav.registerChild(element, order, isEnabledCheck);
        }

        // Things to do when the focus changes
        if(attrs.navWatchFocus || attrs.autoScroll !== undefined) {
          scope.$watch(thisNav.getFocus.bind(thisNav), function(newFocus, oldFocus) {
            // Handle registrations for focus changes
            if(attrs.navWatchFocus) {
              scope.$eval(attrs.navWatchFocus)(newFocus, oldFocus, thisNav);
            }
            // Handle automatic scrolling into view
            if(newFocus >= 0 && attrs.autoScroll !== undefined) {
              var children = thisNav.getChildren();
              var el = children[newFocus].element[0];
              var scroll = attrs.autoScroll;
              // HACK: Scroll async, because the div scrolls in response
              // to the arrow keys too. So let the automatic scroll finish
              // before adjusting the scroll manually
              // TODO: $window OR window?
              if(el) {
                $timeout(function() {
                  switch (scroll) {
                    case 'top':
                      el.scrollIntoView(true);
                      break;
                    case 'bottom':
                      el.scrollIntoView(false);
                      break;
                    case 'page':
                      var cr = el.getClientRects()[0];
                      /* Kind of flaky. Esp. in Firefox */
                      if(cr.bottom < window.innerHeight) {
                        el.scrollIntoView(false);
                      } else {
                        el.scrollIntoView(true);
                      }
                      break;
                    case 'auto':
                      /* fallthrough */
                    default:
                      // Scroll only if the element is not visible
                      // We assume a block level elements (with one client rect)
                      var cr = el.getClientRects()[0];
                      var elVisible = document.elementFromPoint(cr.right-2, cr.bottom-2); //el.offsetLeft+el.offsetWidth, el.offsetTop+el.offsetHeight);
                      if(elVisible!==el) {
                        if(el.top < oldFocus) {
                          // Align top when scrolling up
                          el.scrollIntoView(true);
                        } else {
                          // Align bottom when scrolling down
                          el.scrollIntoView(false);
                        }
                      }
                      break;
                  }
                }, 0);
              }
            }
          });
        }

        // Capitalise the first letter of a string
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

        // Is this element focused
        scope.isNavContainerFocused = function(elem) {
          if(isEnabledCheck) {
            if(!isEnabledCheck()) {
              return false;
            }
          }
          if(!parentNav) {
            return true;
          }
          if(!elem) {
            elem = element;
          }
          return parentNav.isChildFocused(elem);
        };

        // Post link processing
        thisNav.postLink(element, parentNav, isEnabledCheck);
      }
    };
  }]);

