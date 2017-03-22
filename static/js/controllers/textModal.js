angular.module('data_manager')
.directive('textModal', function(){
        return {
            restrict: 'AE',
            replace: true,
            templateUrl: '/static/modal/text_edit_modal.html',
            scope: {
                thetexttype: '@', 
            },   
        }    
    });
