$(document).ready(function(){
 
 
     var numbers = new Bloodhound({
           datumTokenizer: function(d) { 
               return Bloodhound.tokenizers.whitespace(d.num); 
           },
           queryTokenizer: Bloodhound.tokenizers.whitespace,
           local: [
               { num: 'one' },
               { num: 'two' },
               { num: 'three' },
               { num: 'four' },
               { num: 'five' },
               { num: 'six' },
               { num: 'seven' },
               { num: 'eight' },
               { num: 'nine' },
               { num: 'ten' }
           ]
     });
 
     numbers.initialize();
 
     $('.typeahead').typeahead(null, {
         displayKey: 'num',
         source: numbers.ttAdapter()
     });
 });
