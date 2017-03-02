(function(){
    var app = angular.module('app', []);

    app.controller('AppController', function($scope) {
    });

    app.directive('customTag', function () {
    return {
            //scope: {model:'='},
            scope: true,
            restrict: 'E',
            replace: true,
            template: '<input color="red" type="submit" value="Click me">',
            link: function (scope, element, attrs) {
                element.bind('click', function () {
                    scope.model = "New value";
                    scope.$apply();
                });
            }
        };
    });

    /*function AppController($scope) {
        $scope.selected = 'Old value';
    }*/
});

