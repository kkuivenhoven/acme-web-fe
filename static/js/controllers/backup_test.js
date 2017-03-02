(function(){
    var app = angular.module('myapp', []);

    app.controller('MainCtrl', function($scope) {
                $scope.data="Hola, como estas hoy?";
                $scope.se="Como fue tu dia?";
            });
    });
app.directive('modal', function() {
    return {
        restrict: 'E',
        templateUrl: '/static/modal.html',
        replace: true,
        transclude: true,
    }
});


    app.directive('helloWorld', function() {
      return {
        restrict: 'AE',
        replace: true,
        template: '<p align="{{stuff}}" style="background-color:{{color}}">Hello World</p>',
        link: function(scope, elem, attrs) {
          elem.bind('click', function() {
            elem.css('background-color', 'white');
            scope.$apply(function() {
              scope.color = "";
            });
          });
          elem.bind('mouseover', function() {
            elem.css('cursor', 'pointer');
          });
        }
      };
    });
    app.directive('okayWorld', function(){
      return {
        replace: true,
        scope: {word:'='},
        restrict: 'AE',
        template: '<h6>{{word}}</h6>'
      }
    });
    app.directive( 'myElement', function() {
        return {
            restrict:   'EA',
            transclude: true,
            template:   '<div>{{label}}<div ng-transclude></div></div>'
        }
    });

    function createDirective(name){
      return function(){
        return {
          restrict: 'E',
          compile: function(tElem, tAttrs){
            console.log(name + ': compile => ' + tElem.html());
            return {
              pre: function(scope, iElem, iAttrs){
                console.log(name + ': pre link => ' + iElem.html());
              },
              post: function(scope, iElem, iAttrs){
                console.log(name + ': post link => ' + iElem.html());
              }
            }
          }
        }
      }
    }
    app.directive('levelOne', createDirective('levelOne'));
    app.directive('levelTwo', createDirective('levelTwo'));
    app.directive('levelThree', createDirective('levelThree'));

    app.controller("mainController", function($scope){
     
        $scope.label = "Please click";
        $scope.doSomething = function(){
          $scope.message = "Clicked!";
        };
     
    });
    app.directive("otcDynamic", function($compile) {
         
        var template = "<button ng-click='doSomething()'>{{label}}</button>";
         
        return{
            link: function(scope, element){
                element.on("click", function() {
                    scope.$apply(function() {
                        var content = $compile(template)(scope);
                        element.append(content);
                   })
                });
            }
        }
    });








}).call(this);











/*(function(){
app.controller('OkayCtrl', function($scope) {
  $scope.foo = {
    'bar' : 123,
    'name' : 'foo'
  };
  
  $scope.bar = {
    'foo': 456,
    'name': 'something else'
  };
});

app.directive('whatIsInThese', ['$compile', function($compile) {
    return function(scope, elem, attrs) {
    //getting a list of space-separated property names 
    //from the attribute.
        var these = attrs.whatIsInThese.split(' '),
        
        //start creating an html string.
            html = '<pre>';
            
        //append a bunch of bound values from the list.
        angular.forEach(these, function(item) {
            html += '{{' + item + '| json}}\n\n';
        });
        
        //create an angular element. (this is our "view")
        var el = angular.element(html),
        
        //compile the view into a function.
            compiled = $compile(el);
            
        //append our view to the element of the directive.
        elem.append(el);
        
        //bind our view to the scope!
        //(try commenting out this line to see what happens!)
        compiled(scope);
    };
}]);


app.directive('modal', function() {
    return {
        restrict: 'E',
        templateUrl: 'modal.html',
        replace: true,
        transclude: true,
    }
})



}).call(this);*/

