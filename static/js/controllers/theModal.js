angular.module('data_manager')
.directive('theModal', function(){
    return {
        restrict: 'AE',
        replace: true,
        templateUrl: '/static/modal/image_view_modal_data_manager.html',
        scope: {
            thefiletype: '@', 
        },   
    }    
}) 
