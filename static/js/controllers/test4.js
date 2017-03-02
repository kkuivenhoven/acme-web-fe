(function(){
    var app = angular.module('theapp', []);

    app.controller('TheCtrl', function($scope) {
    });
    app.directive('ayyYo', function() {
        return {
            scope: true, // use a child scope that inherits from parent
            restrict: 'AE',
            replace: 'true',
            template: '<h3>Hello World!!</h3>

        }; 
    }); 
}).call(this);
