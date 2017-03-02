(function(){
    var app = angular.module('lamyapp', []);

    app.controller('MainCtrl', function($scope) {
      /*$scope.name = 'World';
      $scope.init = () => {
         $scope.name = 'okay';
      }*/
    });
    app.directive('test', function() {
        return {
            compile: function(tElem,attrs) {
                //do optional DOM transformation here
                return function(scope,elem,attrs) {
                    //linking function here
                };
            }
        };
    }); 
}).call(this);
