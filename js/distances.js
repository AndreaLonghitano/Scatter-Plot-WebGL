'use strict';
var util_distances = {
    euclidean: function(v1, v2) {
        var total = 0;
        for (var i = 0; i < v1.length; i++) {
           total += Math.pow(v2[i] - v1[i], 2);      
        }
        return Math.sqrt(total);
     },
     manhattan: function(v1, v2) {
       var total = 0;
       for (var i = 0; i < v1.length ; i++) {
          total += Math.abs(v2[i] - v1[i]);      
       }
       return total;
     },
     max: function(v1, v2) {
       var max = 0;
       for (var i = 0; i < v1.length; i++) {
          max = Math.max(max , Math.abs(v2[i] - v1[i]));      
       }
       return max;
     },
     min: function(v1, v2) {
        var min = 0;
        for (var i = 0; i < v1.length; i++) {
           min = Math.min(min , Math.abs(v2[i] - v1[i]));      
        }
        return min;
      },
      euclidean_square:function(v1, v2) {
        var total = 0;
        for (var i = 0; i < v1.length; i++) {
           total += Math.pow(v2[i] - v1[i], 2);      
        }
        return total;
     },
  };