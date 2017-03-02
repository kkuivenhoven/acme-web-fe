(function(){
    var app = angular.module('myapp', []);

    app.controller('MainCtrl', function($scope) {
                $scope.data="Hola, como estas hoy?";
                $scope.se="Como fue tu dia?";
            });
    app.directive('laTester', function() {
        return {
            restrict: 'E',
            templateUrl: '/static/model_output.html',
            replace: true,
            transclude: true,
            controller: function( $scope, $element, $attrs, $transclude ) {
                $scope.thing = 'dog';
                $scope.init = () => {
                    $scope.thing = 'qua pasa linda cosa';
                };
            }
        }
    });
}).call(this)
