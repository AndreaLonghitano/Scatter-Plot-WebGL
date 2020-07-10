var vs = `#version 300 es

in vec3 inPosition;
in vec3 inNormal;
out vec3 fsNormal;

uniform mat4 matrix; 
uniform mat4 nMatrix;     //matrix to transform normals

void main() {
  fsNormal = mat3(nMatrix) * inNormal; 
  gl_Position = matrix * vec4(inPosition, 1.0);
}`;

var fs = `#version 300 es

precision mediump float;

in vec3 fsNormal;
out vec4 outColor;

uniform vec3 mDiffColor; //material diffuse color 
uniform vec3 lightDirection; // directional light direction vec
uniform vec3 lightColor; //directional light color 

void main() {

  vec3 nNormal = normalize(fsNormal);
  vec3 lambertColor = mDiffColor * lightColor * dot(-lightDirection,nNormal);
  outColor = vec4(clamp(lambertColor, 0.0, 1.0),1.0);
}`;

var gl;
var perspectiveMatrix,viewMatrix,cubeWorldMatrix;
var cx=0.0,cy=2.0,cz=10.0;
function main() {

  var program = null;

  var cubeNormalMatrix;
  cubeWorldMatrix = new Array();    //One world matrix for each cube...

  //define directional light
  var dirLightAlpha = -utils.degToRad(60);
  var dirLightBeta  = -utils.degToRad(120);

  var directionalLight = [Math.cos(dirLightAlpha) * Math.cos(dirLightBeta),
              Math.sin(dirLightAlpha),
              Math.cos(dirLightAlpha) * Math.sin(dirLightBeta)
              ];
  var directionalLightColor = [0.1, 1.0, 1.0];

  //Define material color
  var cubeMaterialColor = [0.5, 0.5, 0.5];
  var lastUpdateTime = (new Date).getTime();

  var cubeRx = 0.0;
  var cubeRy = 0.0;
  var cubeRz = 0.0;

  //cubeWorldMatrix[0] = utils.MakeWorld( 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0);
  cubeWorldMatrix[0] = utils.MakeWorld( 0.0, 0.0, -1.5, 45, 0 , 0.0, 1.0);
  //cubeWorldMatrix[2] = utils.MakeWorld( 0.0, 0.0, -3.0, 0.0, 0.0, 0.0, 0.5);

  var canvas = document.getElementById("c");
  gl = canvas.getContext("webgl2");
  if (!gl) {
    document.write("GL context not opened");
    return;
  }
  utils.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0.85, 0.85, 0.85, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, vs);
  var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, fs);
  var program = utils.createProgram(gl, vertexShader, fragmentShader);
  gl.useProgram(program);

  var positionAttributeLocation = gl.getAttribLocation(program, "inPosition");  
  var normalAttributeLocation = gl.getAttribLocation(program, "inNormal");  
  var matrixLocation = gl.getUniformLocation(program, "matrix");
  var materialDiffColorHandle = gl.getUniformLocation(program, 'mDiffColor');
  var lightDirectionHandle = gl.getUniformLocation(program, 'lightDirection');
  var lightColorHandle = gl.getUniformLocation(program, 'lightColor');
  var normalMatrixPositionHandle = gl.getUniformLocation(program, 'nMatrix');
  
  perspectiveMatrix = utils.MakePerspective(90, gl.canvas.width/gl.canvas.height, 0.1, 100.0);
  viewMatrix = utils.MakeView(cx, cy, cz, -5, 20);
    
  var vao = gl.createVertexArray();

  gl.bindVertexArray(vao);
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

  var normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(normalAttributeLocation);
  gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);

  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW); 
    
  drawScene();

  function drawScene() {
    //animate();

    gl.clearColor(0.85, 0.85, 0.85, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for(i = 0; i < 1; i++){
      var viewWorldMatrix = utils.multiplyMatrices(viewMatrix, cubeWorldMatrix[i]);
      var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);
      gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
      
      if (i < 3) gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(cubeWorldMatrix[i]));
      else gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, 
      utils.transposeMatrix(cubeNormalMatrix));

      gl.uniform3fv(materialDiffColorHandle, cubeMaterialColor);
      gl.uniform3fv(lightColorHandle,  directionalLightColor);
      gl.uniform3fv(lightDirectionHandle,  directionalLight);

      gl.bindVertexArray(vao);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0 );
    }
    
    window.requestAnimationFrame(drawScene);
  }

}

main();

window.addEventListener('mouseup',onMouseUp,false);

function onMouseUp(ev){
  console.log("HHDAHAD");

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
   console.log("NormX:"+normX+" NormY"+normY);

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
  console.log("NormalisedRayDir:"+normalisedRayDir);
  //The ray starts from the camera in world coordinates
  var rayStartPoint = [cx, cy, cz];


  for(i = 0; i < 1; i++){
      var test=TestRayOBBINtersection(rayStartPoint,normalisedRayDir,[-1.0,-1.0,-1.0],[1.0,1.0,1.0],cubeWorldMatrix[i]);
      console.log(test);
}
   }
  }

function TestRayOBBINtersection(rayStartPoint,ray_direction,aabb_min,aabb_max,ModelMatrix){
  var tMin=0.0;
  var tMax=10000.0;

  var traslation=[ModelMatrix[3],ModelMatrix[7],ModelMatrix[11]];
  var delta=[traslation[0]-rayStartPoint[0],traslation[1]-rayStartPoint[1],traslation[2]-rayStartPoint[2]];

{

    var xaxis=[ModelMatrix[0], ModelMatrix[4], ModelMatrix[8]];
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
				return false;

		}else{ // Rare case : the ray is almost parallel to the planes, so they don't have any "intersection"
			if(-e+aabb_min[0] > 0.0 || -e+aabb_max[0] < 0.0)
				return false;
    }
  }
    {
    var yaxis=[ModelMatrix[1], ModelMatrix[5], ModelMatrix[9]]; //nuovo asse y
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
				return false;

		}else{ // Rare case : the ray is almost parallel to the planes, so they don't have any "intersection"
			if(-e+aabb_min[1] > 0.0 || -e+aabb_max[1] < 0.0)
				return false;
    }
  }
    
{
    var zaxis=[ModelMatrix[2], ModelMatrix[6], ModelMatrix[10]]; // nuovo asse z
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
				return false;

		}else{ // Rare case : the ray is almost parallel to the planes, so they don't have any "intersection"
			if(-e+aabb_min[2] > 0.0 || -e+aabb_max[2] < 0.0)
				return false;
    }
  }
    
    var intersection_distance=tMin;
    return true;

}


