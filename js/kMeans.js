/*var euclidean = util_distances.euclidean; */


var vel={
    slow: 1,
    medium:5,
    fast:10
}


function KMeans(points,centroids,rate="slow",distance="euclidean",eps=0.01) {
   this.centroids = centroids;
   this.dimension=this.centroids[0].length;
   this.k=centroids.length;
   this.end=false;
   this.rate=vel[rate];
   this.points=points;
   this.distance=util_distances[distance];
   this.assignment = new Array(this.points.length);
   this.eps=eps;
}


KMeans.prototype.classify = function(point) {
   var min = Infinity,
   index = 0;
   for (var i = 0; i < this.centroids.length; i++) {
      var dist = this.distance(point, this.centroids[i]);
      if (dist < min) {
         min = dist;
         index = i;
      }
   }
   // return the index of the centroids of the point
   return index;
}

KMeans.prototype.setRate=function(rate){
    this.rate=rate;  // slow fast medium

}


KMeans.prototype.evaluateDifference= function(centroid,newCentroid) {
    var sum=0;
    for(var i=0;i<centroid.length;i++){
        sum += util_distances['euclidean_square'](centroid[i],newCentroid[i])
    }
    return sum;
}


KMeans.prototype.performSteps = function() {

   
   var clusters = new Array(this.k);

   var rate=this.rate;
   var iterations = 0;

   for(var i=0;i<this.rate && (!this.end);i++){
        // update point-to-centroid assignments

        this.points.forEach((element,index) => {
            this.assignment[index] = this.classify(element, this.distance);
        });
        
        // create array
        var assigned=new Array(this.k);
        for (var j=0;j<assigned.length;j++){
            assigned[j]=new Array();
        }

        // create a list of all assigned point
        this.assignment.forEach((element,index)=>{
            assigned[element].push(this.points[index]);
        });

        // create new centroid
        var newCentroid=new Array(this.k)
        for(var g=0;g<newCentroid.length;g++){
            newCentroid[g]=new Array(this.dimension)
        }

        for (var j=0;j<this.k;j++){
            if(!assigned[j].length){
                continue;
            }
            else{
                for (var g = 0; g < this.dimension; g++) {
                    var sum = 0;
                    for (var k = 0; k < assigned[j].length; k++) {
                       sum += assigned[j][k][g];
                    }
                    newCentroid[j][g] = sum / assigned[j].length;
                 }   
                }
        }


        var difference=this.evaluateDifference(this.centroids,newCentroid);
        // stop here K.Means
        if(difference<=this.eps){
            this.end=true;
        }
        this.centroids=newCentroid;
        }

    return {'assignments':this.assignment,"centroids":this.centroids}
}
