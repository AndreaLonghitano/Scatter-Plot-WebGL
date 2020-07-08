(async function main(global){

    var cubeObjStr,sphereObjStr;

    gl = canvas.getContext("webgl2");
    if (!gl) {
        swal({
            text: "You browser doesn't support WebGL",
            icon: "error",
          });
          return;
    }
    utils.resizeCanvasToDisplaySize(gl.canvas);


    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.85, 0.85, 0.85, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);


    // Create and link the first group of shader
    await utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function (shaderText) {
          programs[0]=utils.createAndCompileShaders(gl,shaderText);
    });

    // load dataset
    await utils.get_json(baseDir+"/model/irisCG.json", function(jsonFile){
        dataset = jsonFile.values;
    });

    // centroids for k-means
    await utils.get_json(baseDir+"/model/centroids.json", function(jsonFile){
      centroids = jsonFile.data;
  });


  utils.showCanvas();

  cubeObjStr=await utils.get_objstr(baseDir+"/model/cube.obj");
  cube=new OBJ.Mesh(cubeObjStr);
  sphereObjStr=await utils.get_objstr(baseDir+"/model/sphere.obj");
  sphere=new OBJ.Mesh(sphereObjStr);

  

    //compute the dataset for pca and k_means
    var i=0;
    dataset.forEach((element)=> dataset_pca.push([element.x,element.y,element.z]));
    dataset.forEach((element)=> dataset_kMeans.push([element.x,element.y,element.z]));
    var eigenvectors = PCA.getEigenVectors(dataset_pca);
    
    var k_means=new KMeans(dataset_kMeans,centroids,rate_k_means,distance="manhattan");
    values=k_means.performSteps();

    
    gl.useProgram(programs[0]);


   positionAttributeLocation = gl.getAttribLocation(programs[0], "inPosition");  
   normalAttributeLocation = gl.getAttribLocation(programs[0], "inNormal");  
   matrixLocation = gl.getUniformLocation(programs[0], "matrix");
   materialDiffColorHandle = gl.getUniformLocation(programs[0], 'mDiffColor');
   lightDirectionHandle = gl.getUniformLocation(programs[0], 'lightDirection');
   lightColorHandle = gl.getUniformLocation(programs[0], 'lightColor');
   normalMatrixPositionHandle = gl.getUniformLocation(programs[0], 'nMatrix');
   lightDirMatrixPositionHandle = gl.getUniformLocation(programs[0], 'lightDirMatrix');

   perspectiveMatrix = utils.MakePerspective(90, gl.canvas.width/gl.canvas.height, 0.1, 100.0);
  
   pyramidDefinition=buildPyramid();
   cubeDefinition=buildCube();

   createObjects("pyramid",pyramidDefinition.vertices,pyramidDefinition.normal,pyramidDefinition.indices);
   createObjects("cube",cubeDefinition.vertices,cubeDefinition.normal,cubeDefinition.indices);

   updateScene();
    
}(window))





function animate(){
    var currentTime = (new Date).getTime();
    if(lastUpdateTime){
      var deltaC = (30 * (currentTime - lastUpdateTime)) / 1000.0;
      cubeRx += deltaC;
      cubeRy -= deltaC;
      cubeRz += deltaC;
      
      if (flag == 0) cubeS += deltaC/100;
      else cubeS -= deltaC/100;
      
      if (cubeS >= 1.5) flag = 1;
      else if (cubeS <= 0.5) flag = 0;
      
    }
    cubeWorldMatrix[3] = utils.MakeWorld( 0.0, 0.0, 0.0, cubeRx, cubeRy, cubeRz, cubeS);
    
    lastUpdateTime = currentTime;     
         
  }

  var updateScene = function () {
    stats.begin();
    drawScene();
    stats.end();
    window.requestAnimationFrame(updateScene);
  };

  function drawScene() {
    animate();

    gl.clearColor(0.85, 0.85, 0.85, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    computeViewMatrix();


       


    var lightDirMatrix = utils.invertMatrix(utils.transposeMatrix(viewMatrix)); // we need to compute it of course and just pass it to the fragment shader


    // just for FUN print two cubes and 2 pyramid.. I will use the cubeMatrix becuase is was already built
    // IT?S REPETAED TWO TIMES I SHOUDL CREATE A FUNCTION BUT DON?T WORRY
    for(i = 0; i < 2; i++){
      var worldViewMatrix = utils.multiplyMatrices(viewMatrix, cubeWorldMatrix[i]);
      var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, worldViewMatrix);
      cubeNormalMatrix = utils.invertMatrix(utils.transposeMatrix(worldViewMatrix));

      gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
      
      gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(cubeNormalMatrix));

      gl.uniformMatrix4fv(lightDirMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(lightDirMatrix)); // send also this matrix remebemr to do the inverse because its coloumn wise
      gl.uniform3fv(materialDiffColorHandle, cubeMaterialColor);
      gl.uniform3fv(lightColorHandle,  directionalLightColor);
      gl.uniform3fv(lightDirectionHandle,  directionalLight);

      gl.bindVertexArray(vao["pyramid"]); // va bene metterlo qui prima di diseganre
      gl.drawElements(gl.TRIANGLES, pyramidDefinition.indices.length, gl.UNSIGNED_SHORT, 0 );
    }

    for(i = 2; i < 4; i++){
      var worldViewMatrix = utils.multiplyMatrices(viewMatrix, cubeWorldMatrix[i]);
      var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, worldViewMatrix);
      cubeNormalMatrix = utils.invertMatrix(utils.transposeMatrix(worldViewMatrix));

      gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
      
      gl.uniformMatrix4fv(normalMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(cubeNormalMatrix));

      gl.uniformMatrix4fv(lightDirMatrixPositionHandle, gl.FALSE, utils.transposeMatrix(lightDirMatrix)); // send also this matrix remebemr to do the inverse because its coloumn wise
      gl.uniform3fv(materialDiffColorHandle, cubeMaterialColor2);
      gl.uniform3fv(lightColorHandle,  directionalLightColor);
      gl.uniform3fv(lightDirectionHandle,  directionalLight);

      gl.bindVertexArray(vao["cube"]); // va bene metterlo qui prima di diseganre
      gl.drawElements(gl.TRIANGLES, cubeDefinition.indices.length, gl.UNSIGNED_SHORT, 0 );
    }
  }



  function createObjects(nameObject,vert,norm,indi){
    vao[nameObject]=gl.createVertexArray();
    gl.bindVertexArray(vao[nameObject]);

    // position
    positionBuffer[nameObject] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer[nameObject]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vert), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
  

    //normals
    normalBuffer[nameObject] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer[nameObject]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norm), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(normalAttributeLocation);
    gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);
  
    //index
    indexBuffer[nameObject] = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer[nameObject]);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indi), gl.STATIC_DRAW); 
    gl.bindVertexArray(null);
  }




function computeViewMatrix(){
  viewMatrix = utils.MakeView(cx, cy, cz, elevation, angle); // elevation and angle should be expressed in degree

  var viewMatrixTransposed = utils.transposeMatrix(viewMatrix);

  dvecmat = utils.transposeMatrix(viewMatrix); dvecmat[12] = dvecmat[13] = dvecmat[14] = 0.0;
	xaxis = [dvecmat[0],dvecmat[4],dvecmat[8]];
	yaxis = [dvecmat[1],dvecmat[5],dvecmat[9]];
	zaxis = [dvecmat[2],dvecmat[6],dvecmat[10]];
  

	if((rvx != 0) || (rvy != 0) || (rvz != 0)) {
		qx = Quaternion.fromAxisAngle(xaxis, utils.degToRad(rvx * 1));
		qy = Quaternion.fromAxisAngle(yaxis, utils.degToRad(rvy * 1));
		qz = Quaternion.fromAxisAngle(zaxis, utils.degToRad(rvz * 1));
		newDvecmat = utils.multiplyMatrices(utils.multiplyMatrices(utils.multiplyMatrices(
			qy.toMatrix4(), qx.toMatrix4()), qz.toMatrix4()), dvecmat);
		R11=newDvecmat[10];R12=newDvecmat[8];R13=newDvecmat[9];
		R21=newDvecmat[2]; R22=newDvecmat[0];R23=newDvecmat[1];
		R31=newDvecmat[6]; R32=newDvecmat[4];R33=newDvecmat[5];
		
	
    if ((R31 < 1) && (R31 > -1)) {
      theta = -Math.asin(R31);
      psi = Math.atan2(R21 / Math.cos(theta), R11 / Math.cos(theta));
  } else if (R31 <= -1) {
      theta = Math.PI / 2;
      psi = Math.atan2(R12, R13);
  } else {
      theta = -Math.PI / 2;
      psi = Math.atan2(-R12, -R13);
  }

  elevation = theta*180/Math.PI;
  angle = -psi*180/Math.PI;
  
	}
  var delta = utils.multiplyMatrixVector(dvecmat, [vx, vy, vz, 0.0]);
  cx += delta[0] / 10;
  cy += delta[1] / 10;
  cz += delta[2] / 10;
  cx= Math.abs(cx)<=MAX_MOVEMENT_X ? cx : Math.sign(cx)*MAX_MOVEMENT_X; // modify this constant to limit the movement
  cz= Math.abs(cz)<=MAX_MOVEMENT_Z ? cz : Math.sign(cz)*MAX_MOVEMENT_Z;
}
  


window.addEventListener('keyup', callbacks.onkeyUp,false);
window.addEventListener('keydown',callbacks.onKeyDown,false);

/* 
canvas.addEventListener("mousedown", callbacks.doMouseDown, false);
canvas.addEventListener("mouseup", callbacks.doMouseUp, false);
canvas.addEventListener("mousemove", callbacks.doMouseMove, false);
canvas.addEventListener("mousewheel", callbacks.doMouseWheel, false);
*/





  