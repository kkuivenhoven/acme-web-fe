(function(){
    var app = angular.module('myapp', []);
    //var stuff = angular.module('stuffo', []);

    app.controller('MainCtrl', function($scope) {
    });
    app.directive('laModal', function() {
        return {
            restrict: 'E',
            templateUrl: '/static/modal.html',
            replace: true,
            transclude: true,
            controller: function( $scope, $element, $attrs, $transclude ) {
                $scope.thing = 'dog';
                $scope.init = () => {
                    $scope.thing = 'qua pasa linda cosa';
                };
            }
        }
    })
}).call(this)
