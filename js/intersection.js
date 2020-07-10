function onMouseUp(ev){

    //This is a way of calculating the coordinates of the click in the canvas taking into account its possible displacement in the page
    var top = 0.0, left = 0.0;
    canvas = gl.canvas;
    while (canvas && canvas.tagName !== 'BODY') {
        top += canvas.offsetTop;
        left += canvas.offsetLeft;
        canvas = canvas.offsetParent;
    }
    var x = ev.clientX - left;
    var y = ev.clientY - top;
    
     //Here we calculate the normalised device coordinates from the pixel coordinates of the canvas
     var normX = (2*x)/ gl.canvas.width - 1;
     var normY = 1 - (2*y) / gl.canvas.height;
  
     if(Math.abs(normX)<=1 && Math.abs(normY)<=1){
  
        /* Perspective*view*world*/
        //We need to go through the transformation pipeline in the inverse order so we invert the matrices
        var projInv = utils.invertMatrix(perspectiveMatrix);
        var viewInv = utils.invertMatrix(viewMatrix);
    
        var pointEyeCoords = utils.multiplyMatrixVector(projInv, [normX, normY, -1, 1]); // 1 per la w , -1 perche devi cambiare la z
        var rayEyeCoords = [pointEyeCoords[0], pointEyeCoords[1], pointEyeCoords[2], 0];
    
            
            //We find the direction expressed in world coordinates by multipling with the inverse of the view matrix
        var rayDir = utils.multiplyMatrixVector(viewInv, rayEyeCoords);
        var normalisedRayDir = utils.normalizeVec3(rayDir);
        //The ray starts from the camera in world coordinates
        var rayStartPoint = [cx, cy, cz];
    
        var min_index=+Infinity;
        var distance_hit_min=+Infinity;
        for(i = 0; i < dataset.length; i++){
        if(dataset[i].x < (min_x+(x_range.valueLow*(max_x-min_x)/100)) || dataset[i].x> (x_range.valueHigh*(max_x-min_x)/100) || 
            dataset[i].y < (min_y+(y_range.valueLow*(max_y-min_y)/100)) || dataset[i].y > (y_range.valueHigh*(max_y-min_y)/100) ||
            dataset[i].z < (min_z+(z_range.valueLow*(max_z-min_z)/100)) || dataset[i].z > (z_range.valueHigh*(max_z-min_z)/100)){
            continue;
        }
    
        var objSelected=$('#class'+dataset[i].class).val();
        var ele=listOfPossibleModels[objSelected];
    
    
        if (ele=="Sphere"){
            distance_hit = raySphereIntersection(rayStartPoint, normalisedRayDir, dataset[i], RADIUS);
        }
        else{ // cubo 
            distance_hit=RayOBBIntersection(rayStartPoint,normalisedRayDir,[-1.0, -1.0, -1.0].map(function(x) { return x * RADIUS}) ,[1.0, 1.0, 1.0].map(function(x) { return x * RADIUS}),utils.MakeWorld(dataset[i].x*MULTIPLICATIVE_FACTOR,dataset[i].y*MULTIPLICATIVE_FACTOR,dataset[i].z*MULTIPLICATIVE_FACTOR,0,0,0,RADIUS));

        }
    
        if(distance_hit>0){
            min_index = distance_hit < distance_hit_min ? i : min_index; // prendi l'oggett
            distance_hit_min=  distance_hit < distance_hit_min   ? distance_hit  : distance_hit_min; 
        }
        }
    
        if(min_index==+Infinity && $('#text').css('z-index')==1)
            $('#text').css('z-index',-1);
            // delete the color of this object eventually
        else if (min_index!==+Infinity){
        console.log("The element "+i+"was selected and it's a "+ dataset[min_index].class);
        $('#text').css('z-index',1);
        $('#x_coordinate').text(dataset[min_index].x);
        $('#y_coordinate').text(dataset[min_index].y);
        $('#z_coordinate').text(dataset[min_index].z);
        $('#class_selected').text(dataset[min_index].class);
        
        }
  
  }
  }
   
  
  
  function raySphereIntersection(rayStartPoint, rayNormalisedDir, sphereCentre, sphereRadius){
    //Distance between sphere origin and origin of ray
    var t;
    var l = [sphereCentre.x*MULTIPLICATIVE_FACTOR - rayStartPoint[0], sphereCentre.y*MULTIPLICATIVE_FACTOR - rayStartPoint[1], sphereCentre.z*MULTIPLICATIVE_FACTOR - rayStartPoint[2]];
    var l_squared = l[0] * l[0] + l[1] * l[1] + l[2] * l[2];
    var r_squared=sphereRadius*sphereRadius;
    //If this is true, the ray origin is inside the sphere so it doesn't collides
    if(l_squared < r_squared){
        return -1;
    }
    //Projection of l onto the ray direction 
    var s = l[0] * rayNormalisedDir[0] + l[1] * rayNormalisedDir[1] + l[2] * rayNormalisedDir[2];
    //The spere is behind the ray origin so no intersection
    if(s < 0){
        return -1;
    }
    //Squared distance from sphere centre and projection s with Pythagorean theorem
    var m_squared = l_squared - (s*s);
    //If this is true the ray will miss the sphere
    if(m_squared > r_squared){
        return -1;
    }
    var q=Math.sqrt(r_squared - m_squared);
  
    t= l_squared>r_squared ? s-q : s+q;
  
    return t;  /* then I will take the minimum */
  }
  
  function RayOBBIntersection(rayStartPoint,ray_direction,aabb_min,aabb_max,ModelMatrix){
    var tMin=0.0;
    var tMax=10000.0;
  
    var traslation=[ModelMatrix[3],ModelMatrix[7],ModelMatrix[11]];
    var delta=[traslation[0]-rayStartPoint[0],traslation[1]-rayStartPoint[1],traslation[2]-rayStartPoint[2]];
  
  {
      // important to normalize
      var xaxis=utils.normalizeVec3([ModelMatrix[0], ModelMatrix[4], ModelMatrix[8]]);
      var e=  xaxis[0]*delta[0]+xaxis[1]*delta[1]+xaxis[2]*delta[2];
      var f = ray_direction[0]*xaxis[0]+ray_direction[1]*xaxis[1]+ray_direction[2]*xaxis[2];
  
          if ( Math.abs(f) > 0.001 ){ // Standard case
  
              var t1 = (e+aabb_min[0])/f; // Intersection with the "left" plane
              var t2 = (e+aabb_max[0])/f; // Intersection with the "right" plane
              // t1 and t2 now contain distances betwen ray origin and ray-plane intersections
  
              // We want t1 to represent the nearest intersection, 
              // so if it's not the case, invert t1 and t2
              if (t1>t2){
          var w=t1;
          var t1=t2;
          var t2=w; // swap t1 and t2
              }
  
              // tMax is the nearest "far" intersection (amongst the X,Y and Z planes pairs)
              if ( t2 < tMax )
                  tMax = t2;
              // tMin is the farthest "near" intersection (amongst the X,Y and Z planes pairs)
              if ( t1 > tMin )
                  tMin = t1;
  
              // And here's the trick :
              // If "far" is closer than "near", then there is NO intersection.
              // See the images in the tutorials for the visual explanation.
              if (tMax < tMin )
                  return -1;
  
          }else{ // Rare case : the ray is almost parallel to the planes, so they don't have any "intersection"
              if(-e+aabb_min[0] > 0.0 || -e+aabb_max[0] < 0.0)
                  return -1;
      }
    }
      {
      var yaxis=utils.normalizeVec3([ModelMatrix[1], ModelMatrix[5], ModelMatrix[9]]); //nuovo asse y
      var e=  yaxis[0]*delta[0]+yaxis[1]*delta[1]+yaxis[2]*delta[2];
      var f = ray_direction[0]*yaxis[0]+ray_direction[1]*yaxis[1]+ray_direction[2]*yaxis[2];
  
          if ( Math.abs(f) > 0.001 ){ // Standard case
  
              var t1 = (e+aabb_min[1])/f; // Intersection with the "left" plane
              var t2 = (e+aabb_max[1])/f; // Intersection with the "right" plane
              // t1 and t2 now contain distances betwen ray origin and ray-plane intersections
  
              // We want t1 to represent the nearest intersection, 
              // so if it's not the case, invert t1 and t2
              if (t1>t2){
          var w=t1;
          var t1=t2;
          var t2=w; // swap t1 and t2
              }
  
              // tMax is the nearest "far" intersection (amongst the X,Y and Z planes pairs)
              if ( t2 < tMax )
                  tMax = t2;
              // tMin is the farthest "near" intersection (amongst the X,Y and Z planes pairs)
              if ( t1 > tMin )
                  tMin = t1;
  
              // And here's the trick :
              // If "far" is closer than "near", then there is NO intersection.
              // See the images in the tutorials for the visual explanation.
              if (tMax < tMin )
                  return -1;
  
          }else{ // Rare case : the ray is almost parallel to the planes, so they don't have any "intersection"
              if(-e+aabb_min[1] > 0.0 || -e+aabb_max[1] < 0.0)
                  return -1;
      }
    }
      
  {
      var zaxis=utils.normalizeVec3([ModelMatrix[2], ModelMatrix[6], ModelMatrix[10]]); // nuovo asse z
      var e =  zaxis[0]*delta[0]+zaxis[1]*delta[1]+zaxis[2]*delta[2];
      var f = ray_direction[0]*zaxis[0]+ray_direction[1]*zaxis[1]+ray_direction[2]*zaxis[2];
  
          if ( Math.abs(f) > 0.001 ){ // Standard case
  
              var t1 = (e+aabb_min[2])/f; // Intersection with the "left" plane
              var t2 = (e+aabb_max[2])/f; // Intersection with the "right" plane
              // t1 and t2 now contain distances betwen ray origin and ray-plane intersections
  
              // We want t1 to represent the nearest intersection, 
              // so if it's not the case, invert t1 and t2
              if (t1>t2){
          var w=t1;
          var t1=t2;
          var t2=w; // swap t1 and t2
              }
  
              // tMax is the nearest "far" intersection (amongst the X,Y and Z planes pairs)
              if ( t2 < tMax )
                  tMax = t2;
              // tMin is the farthest "near" intersection (amongst the X,Y and Z planes pairs)
              if ( t1 > tMin )
                  tMin = t1;
  
              // And here's the trick :
              // If "far" is closer than "near", then there is NO intersection.
              // See the images in the tutorials for the visual explanation.
              if (tMax < tMin )
                  return -1;
  
          }else{ // Rare case : the ray is almost parallel to the planes, so they don't have any "intersection"
              if(-e+aabb_min[2] > 0.0 || -e+aabb_max[2] < 0.0)
                  return -1;
      }
    }
      
      return tMin;
  
  }
  