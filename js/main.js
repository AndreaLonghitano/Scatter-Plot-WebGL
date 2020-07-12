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
    await utils.loadFiles([shaderDir + 'vs_obj.glsl', shaderDir + 'fs_obj.glsl'], function (shaderText) {
          programs[0]=utils.createAndCompileShaders(gl,shaderText);
    });

    //create the shaders for display simple lines
    await utils.loadFiles([shaderDir + 'vs_simple.glsl', shaderDir + 'fs_simple.glsl'], function (shaderText) {
      programs[1]=utils.createAndCompileShaders(gl,shaderText);
    }); 

    // load dataset
    await utils.get_json(baseDir+"/model/irisCG.json", function(jsonFile){
        dataset = jsonFile.values;
        classes=[...new Set(dataset.map(item => item.class))];
  });

  items=new Array(dataset.length);
  dataset.forEach((element,index)=> {
    min_x=Math.min(dataset[index].x,min_x)
    max_x=Math.max(dataset[index].x,max_x);
    min_z=Math.min(dataset[index].z,min_z)
    max_z=Math.max(dataset[index].z,max_z);
    min_y=Math.min(dataset[index].y,min_y)
    max_y=Math.max(dataset[index].y,max_y);
    items[index]=new Item([dataset[index].x,dataset[index].y,dataset[index].z],dataset[index].class);
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
  models={'Cube':cube,'Sphere':sphere};

  

  //compute the dataset for pca and k_means
  var i=0;
  //dataset.forEach((element)=> dataset_pca.push([element.x,element.y,element.z]));
  dataset.forEach((element)=> dataset_kMeans.push([element.x,element.y,element.z]));
  //var eigenvectors = PCA.getEigenVectors(dataset_pca);
  //adjusted_data_x=PCA.computeAdjustedData(dataset_pca,eigenvectors[0],eigenvectors[1]).adjustedData[0];
  //adjusted_data_y=PCA.computeAdjustedData(dataset_pca,eigenvectors[0],eigenvectors[1]).adjustedData[1];
  var k_means=new KMeans(dataset_kMeans,centroids,rate_k_means,distance="manhattan");
  values=k_means.performSteps();

  
  gl.useProgram(programs[0]);
  programs[0].positionAttributeLocation = gl.getAttribLocation(programs[0], "inPosition");  
  programs[0].normalAttributeLocation = gl.getAttribLocation(programs[0], "inNormal");  
  programs[0].matrixLocation = gl.getUniformLocation(programs[0], "matrix");
  programs[0].materialDiffColorHandle = gl.getUniformLocation(programs[0], 'mDiffColor');
  programs[0].diffuseTypeHandle = gl.getUniformLocation(programs[0], "diffuseType");
  programs[0].lightDirectionHandle = gl.getUniformLocation(programs[0], 'L1_lightDirection');
  programs[0].lightColorHandle = gl.getUniformLocation(programs[0], 'L1_lightColor');
  programs[0].lightPosHandle = gl.getUniformLocation(programs[0], "L1_Pos");
  programs[0].lightDecayHandle = gl.getUniformLocation(programs[0], "L1_Decay");
  programs[0].lightTargetHandle = gl.getUniformLocation(programs[0], "L1_Target");
  programs[0].lightConeOutHandle = gl.getUniformLocation(programs[0], "L1_ConeOut");
  programs[0].lightConeInHandle = gl.getUniformLocation(programs[0], "L1_ConeIn");
  programs[0].lightTypeHandle = gl.getUniformLocation(programs[0], "lightType");
  programs[0].AmbientMatColHandle = gl.getUniformLocation(programs[0], "ambientMatColor");
  programs[0].AmbientLightColHandle = gl.getUniformLocation(programs[0], "ambientLightColor");
  programs[0].AmbientLightLowColHandle = gl.getUniformLocation(programs[0], "ambientLightLowColor");
  programs[0].AmbienttDirHandle = gl.getUniformLocation(programs[0], "ambientDir");
  programs[0].AmbientTypeHandle = gl.getUniformLocation(programs[0], "ambientType");
  programs[0].MatEmisColHandle = gl.getUniformLocation(programs[0], "emitColor");
  programs[0].specularTypehandle = gl.getUniformLocation(programs[0], "specularType");
  programs[0].specShineHandle = gl.getUniformLocation(programs[0], "SpecShine");
  programs[0].specularColorHandle = gl.getUniformLocation(programs[0], "specCol");
  programs[0].lightDirMatrixPositionHandle = gl.getUniformLocation(programs[0], 'lightDirMatrix');
  programs[0].eyePosHandler = gl.getUniformLocation(programs[0], "eyePos");

  gl.useProgram(programs[1]);
  programs[1].positionAttributeLocation = gl.getAttribLocation(programs[1], "inPosition");
  programs[1].matrixLocation = gl.getUniformLocation(programs[1], "matrix");
  programs[1].color_axes = gl.getUniformLocation(programs[1], "color_axes");



  

  perspectiveMatrix = utils.MakePerspective(90, gl.canvas.width/gl.canvas.height, 0.1, 1000);


  createVaoObjects(programs[0],"Sphere",vertices=sphere.vertices,normals=sphere.vertexNormals,indices=sphere.indices);
  createVaoObjects(programs[0],"Cube",vertices=cube.vertices,normals=cube.vertexNormals,indices=cube.indices);
  createVaoObjects(programs[1],"Lines",lines_position);
  pyramid=buildPyramid();
  createVaoObjects(programs[1],"Pyramid",vertices=pyramid.vertices,normals=undefined,indices=pyramid.indices);
  listOfPossibleModels=Object.keys(vao);
  listOfPossibleModels.splice(-2, 2);
  createUiModelClass();

  updateScene();
    
}(window))

function createVaoObjects(program,nameObject,vertices,normals=undefined,indices=undefined){
    gl.useProgram(program);
    vao[nameObject]=gl.createVertexArray();
    gl.bindVertexArray(vao[nameObject]);

    // position
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(program.positionAttributeLocation);
    gl.vertexAttribPointer(program.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.positionAttributeLocation);

    if(!(normals==undefined)){
      //normals
      var normalBuffer= gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(programs[0].normalAttributeLocation);
      gl.vertexAttribPointer(programs[0].normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    }

    if(!(indices==undefined)){
      var indexBuffer= gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW); 
    }
    gl.bindVertexArray(null);
} 



// OBJECTS CLASSES
class Item {
  constructor([x,y,z],clas){
      this.class=clas;
      this.x=x;
      this.y=y;
      this.z=z;
      this.rotX=Math.floor(Math.random() * (360 - 0 + 1) + 0);
      this.rotY=Math.floor(Math.random() * (360 - 0 + 1) + 0);
      this.rotZ=Math.floor(Math.random() * (360 - 0 + 1) + 0);
      this.initialQuaternion=Quaternion.fromEuler(utils.degToRad(this.rotZ),utils.degToRad(this.rotX),utils.degToRad(this.rotY)); // default order is ZYX
      this.worldM = utils.MakeWorld(this.x*MULTIPLICATIVE_FACTOR,this.y*MULTIPLICATIVE_FACTOR,this.z*MULTIPLICATIVE_FACTOR,this.rotX,this.rotY,this.rotZ,RADIUS);
      this.display=true;
  }

  get_display(){
    return this.display;
  }

  set_display(val){
    this.display=val;
  }

  set_rotX(x){
    this.rotX=x;
  }
  set_rotY(y){
    this.rotY=y;
  }
  set_rotZ(z){
    this.rotZ=z;
  }

  set_pos(worldMatrix){
    this.worldM=worldMatrix;
  }
  set_x(x){
    this.x=x;
  }
  set_y(y){
    this.y=y;
  }
  set_z(z){
    this.z=z;
  }
  
  get_x(){
    return this.x;
  }

  get_y(){
    return this.y;
  }

  get_z(){
    return this.z;
  }

  get_worldMatrix(){
    return this.worldM;
  }
  get_quaternion(){
    return this.initialQuaternion;
  }

  pos(){
    return [this.worldM[3],this.worldM[7],this.worldM[11]];
  }
}

function animate(){
  if (!time){
    initializeControlPoint();
  }
  var quadratic;
  var point;
  for (var i=0;i<selected_element.length;i++){
    point=bezier.quadraticBezier([dataset_pca[i][0],dataset_pca[i][1],dataset_pca[i][2]],control_quadratic_points[i],[adjusted_data_x[i],adjusted_data_y[i],0.0],time/maxT);
    rotation=QuaternionToEuler(items[selected_element[i]].get_quaternion().slerp(Quaternion.fromEuler(utils.degToRad(45),0,0,order="XYZ"))(time/maxT));
    items[selected_element[i]].set_pos(utils.MakeWorld(point.x*MULTIPLICATIVE_FACTOR,point.y*MULTIPLICATIVE_FACTOR,point.z*MULTIPLICATIVE_FACTOR,utils.radToDeg(rotation[0]),utils.radToDeg(rotation[1]),utils.radToDeg(rotation[2]),RADIUS));
    items[selected_element[i]].set_x(point.x);
    items[selected_element[i]].set_y(point.y);
    items[selected_element[i]].set_z(point.z);
    items[selected_element[i]].set_rotX(utils.radToDeg(rotation[0]));
    items[selected_element[i]].set_rotY(utils.radToDeg(rotation[1]));
    items[selected_element[i]].set_rotZ(utils.radToDeg(rotation[2]));
  }
  time+=VELOCITY_PCA;
  if(time>=maxT){
    time=0;
    pca=!pca;
    element=document.getElementById('P');
    if (element){
        element.style.backgroundColor=color_button;
    }
  }         
}

  var updateScene = function () {
    stats.begin();
    drawScene();
    stats.end();
    window.requestAnimationFrame(updateScene);
  };

  function resize(canvas) {
    // Lookup the size the browser is displaying the canvas.
    var displayWidth  = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;
   
    // Check if the canvas is not the same size.
    if (canvas.width  != displayWidth ||
        canvas.height != displayHeight) {
   
      // Make the canvas the same size
      canvas.width  = displayWidth;
      canvas.height = displayHeight;
    }
  }

  function drawScene() {
    if(pca){
      animate();
    }
    resize(gl.canvas);
    gl.clearColor(0.85, 0.85, 0.85, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    computeViewMatrix();
    showAxes();
    gl.useProgram(programs[0]);

    for(i = 0; i < dataset.length; i++){

      if(dataset[i].x < (min_x+(x_range.valueLow*(max_x-min_x)/100)) || dataset[i].x>(max_x-(1-x_range.valueHigh/100)*(max_x-min_x)) || 
          dataset[i].y < (min_y+(y_range.valueLow*(max_y-min_y)/100)) || dataset[i].y >(max_y-(1-y_range.valueHigh/100)*(max_y-min_y)) ||
          dataset[i].z < (min_z+(z_range.valueLow*(max_z-min_z)/100)) || dataset[i].z >(max_z-(1- z_range.valueHigh/100)*(max_z-min_z))){
          items[i].set_display(false);
          continue;
      }
      

      

      var objSelected=$('#class'+dataset[i].class).val();
      var ele=listOfPossibleModels[objSelected];

      var worldMatrix=items[i].worldM;

      var worldViewMatrix = utils.multiplyMatrices(viewMatrix, worldMatrix);
      var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, worldViewMatrix);

      var eyePosTransformed = utils.multiplyMatrixVector(utils.invertMatrix(worldMatrix),[cx,cy,cz,1.0]);
      
      sliderPosLight(); //Update Light postions
      var lightPosTransformed = utils.multiplyMatrixVector(utils.invertMatrix(worldMatrix),[dirLightPos_x,dirLightPos_y,dirLightPos_z,1.0]);
      
      sliderLightConesChange(); //update Light Cones
      sliderSpecShineChange(); //update specular shine
      var lightDirMatrix = utils.sub3x3from4x4(utils.transposeMatrix(worldMatrix));
      sliderLightChange(); //This update directionalLight based on the sliders
      var directionalLightTrasformed=utils.normalizeVec3(utils.multiplyMatrix3Vector3(lightDirMatrix,directionalLight));

      sliderAmbientDirChange(); //Update direction hemispheric ambient
      var ambientLightDirTransformed = utils.normalizeVec3(utils.multiplyMatrix3Vector3(lightDirMatrix,ambientLightDir));


      gl.uniformMatrix4fv(programs[0].matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
      
      var color= i==object_selected ? cubeMaterialColor: colorDiffuseClass[dataset[i].class];
      gl.uniform4fv(programs[0].diffuseTypeHandle, diffuseType);
      gl.uniform3fv(programs[0].materialDiffColorHandle, color);
      gl.uniform3fv(programs[0].lightColorHandle,  directionalLightColor);
      gl.uniform3fv(programs[0].lightDirectionHandle,  directionalLightTrasformed);
      gl.uniform4fv(programs[0].lightPosHandle, lightPosTransformed);
      gl.uniform1f(programs[0].lightDecayHandle, lightDecay);
      gl.uniform1f(programs[0].lightTargetHandle, lightTarget);
      gl.uniform1f(programs[0].lightConeOutHandle, lightConeOut);
      gl.uniform1f(programs[0].lightConeInHandle, lightConeIn);
      gl.uniform4fv(programs[0].lightTypeHandle, dirLightType);
      gl.uniform3fv(programs[0].AmbientLightColHandle,  ambientLightColor);
      gl.uniform3fv(programs[0].AmbientLightLowColHandle, ambientLightLowColor);
      gl.uniform3fv(programs[0].AmbienttDirHandle, ambientLightDirTransformed);
      gl.uniform3fv(programs[0].AmbientMatColHandle, color);
      gl.uniform4fv(programs[0].AmbientTypeHandle, ambientType);
      gl.uniform3fv(programs[0].MatEmisColHandle, materialEmissionColor);
      gl.uniform4fv(programs[0].specularTypehandle, specularType);
      gl.uniform1f(programs[0].specShineHandle, SpecShine);
      gl.uniform3fv(programs[0].specularColorHandle, specularColor);
      gl.uniform4fv(programs[0].eyePosUniform, eyePosTransformed);

      gl.bindVertexArray(vao[ele]); // va bene metterlo qui prima di diseganre
      gl.drawElements(gl.TRIANGLES, models[ele].indices.length, gl.UNSIGNED_SHORT, 0 );
    }

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

  elevation = (theta*180/Math.PI);
  angle = (-psi*180/Math.PI);
  
	}
  var delta = utils.multiplyMatrixVector(dvecmat, [vx, vy, vz, 0.0]);
  cx += delta[0];
  cy += delta[1];
  cz += delta[2];
  cx= Math.abs(cx)<=MAX_MOVEMENT_X ? cx : Math.sign(cx)*MAX_MOVEMENT_X; // modify this constant to limit the movement
  cz= Math.abs(cz)<=MAX_MOVEMENT_Z ? cz : Math.sign(cz)*MAX_MOVEMENT_Z;
  cy= Math.abs(cy)<=MAX_MOVEMENT_Y ? cy : Math.sign(cy)*MAX_MOVEMENT_Y;
}
  


window.addEventListener('keyup', callbacks.onkeyUp,false);
window.addEventListener('keydown',callbacks.onKeyDown,false);
window.addEventListener('mouseup',onMouseUp,false);


function createUiModelClass(){
  classes.forEach((i)=>{
    $('#model-class').append( `<div class="row d-flex justify-content-center">
    <div class="col-2 offset-1 justify-content-center">
      <label for="class">Class${i}</label>
      </div>
    <div class="col-6 offset-1 justify-content-center">
    <select class="mdb-select md-form modelselect" style="background-color: azure;" id="class${i}">
    </select>
    </div>
    <div class="col-2">
    <input type="color" class="favcol" id="favcolor${i}"  value="#${(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0')}" onchange="updatePalette(event)";
    ">
  </div>
  </div>`);
  });

  $(".favcol").toArray().forEach((ele)=>{
      colorDiffuseClass.push(normalizeColor([hexToRgb(ele.value).r,hexToRgb(ele.value).g,hexToRgb(ele.value).b]));
  });
  
  $('.modelselect').toArray().forEach(sel => {
    listOfPossibleModels.forEach((model,index) => {
      var o = new Option(model, index);
      sel.append(o);
      });
    });
    

    $('.modelselect').toArray().forEach(sel => {
        var random_selection=Math.floor(Math.random() * (listOfPossibleModels.length)) + 0;
        sel.value=random_selection;
      });



}



function showAxes(){
  gl.useProgram(programs[1]);
  var worldMatrix=utils.MakeWorld(0,0,0,0,0,0,SCALE_FACTOR);
  var worldViewMatrix = utils.multiplyMatrices(viewMatrix, worldMatrix);
  var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, worldViewMatrix);
  gl.uniformMatrix4fv(programs[1].matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
  gl.uniformMatrix3fv(programs[1].color_axes,gl.FALSE,colorAxes);
  gl.bindVertexArray(vao['Lines']);
  gl.drawArrays(gl.LINES, 0, 6);
  if (showNegativeAxes){
    gl.drawArrays(gl.LINES,6,6);
  }

  showPyramid(1);
  if (showNegativeAxes){
    showPyramid(-1);
  }


}

function showPyramid(negative_axes){
  // show Pyramid
  for(var i=0;i<3;i++){
    gl.bindVertexArray(vao['Pyramid']);
      switch(i){
        //x
        case 0:
          var worldMatrix=utils.MakeWorld(SCALE_FACTOR*negative_axes,0,0,0,0,90*negative_axes,2.0);
        break;
        //y
        case 1:
          var worldMatrix=utils.MakeWorld(0,SCALE_FACTOR*negative_axes,0,((180)*(1-negative_axes))/2,0,0,2.0);
        break;
        //z
        case 2:
          var worldMatrix=utils.MakeWorld(0,0,SCALE_FACTOR*negative_axes,90*negative_axes,0,0,2.0);
        break;
      }
    var worldViewMatrix = utils.multiplyMatrices(viewMatrix, worldMatrix);
    var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, worldViewMatrix);
    gl.uniformMatrix4fv(programs[1].matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
    gl.uniformMatrix3fv(programs[1].color_axes,gl.FALSE,colorAxes);
    gl.drawElements(gl.TRIANGLES, pyramid.indices.length, gl.UNSIGNED_SHORT, 0);
    }
}





function sliderLightChange(){
  var t = -utils.degToRad(document.getElementById("alfa_light").value);
	var p = -utils.degToRad(document.getElementById("beta_light").value);
	directionalLight = [Math.sin(t)*Math.sin(p), Math.cos(t), Math.sin(t)*Math.cos(p)];
}

function sliderAmbientDirChange(){
  var t = -utils.degToRad(document.getElementById("alfa_ambient").value);
	var p = -utils.degToRad(document.getElementById("beta_ambient").value);
	ambientLightDir = [Math.sin(t)*Math.sin(p), Math.cos(t), Math.sin(t)*Math.cos(p)];
}

function sliderPosLight(){
  dirLightPos_x = document.getElementById("x_light").value;
  dirLightPos_y = document.getElementById("y_light").value;
  dirLightPos_z = document.getElementById("z_light").value;
}
function sliderLightConesChange(){
  lightConeOut = document.getElementById("cone_out").value;
  lightConeIn = document.getElementById("cone_in").value /100;
}

function sliderSpecShineChange(){
  SpecShine = document.getElementById("spec_shine").value;
}

function ambientTypeSelection(){
  var type = document.getElementById("ambient-type-select").value;
  ambientType = ambientTypeDict[type];
  if (type == 2) {
    document.getElementById("hemispheric-dir").style.display = "block";
  }
  else {
    document.getElementById("hemispheric-dir").style.display = "none";
  }
}
function diffuseTypeSelection(){
  var type = document.getElementById("diffuse-type-select").value;
  diffuseType = diffuseTypeDict[type];
 
}
function lightTypeSelection(){
  var type = document.getElementById("light-type-select").value;
  dirLightType = dirLightTypeDict[type];
  if (type == 0) {
    document.getElementById("direct").style.display = "block";
    document.getElementById("point").style.display = "none";
    document.getElementById("cone").style.display = "none";
  }
  else if (type == 1){
    document.getElementById("point").style.display = "block";
    document.getElementById("direct").style.display = "none";
    document.getElementById("cone").style.display = "none";
  }
  else {
    document.getElementById("point").style.display = "block";
    document.getElementById("direct").style.display = "block";
    document.getElementById("cone").style.display = "block";
  }
}

function specularTypeSelection(){
  var type = document.getElementById("specular-type-select").value;
  specularType = specularTypeDict[type];
  if (type != 0){
    document.getElementById("spec-shine-div").style.display = "block";
  }
  else {
    document.getElementById("spec-shine-div").style.display = "none";
  }
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function normalizeColor(color){
  return [color[0]/255.0,color[1]/255.0,color[2]/255.0];
}

function updatePalette(event){
  var newValue=event.target.value;
  var id=parseInt(event.target.id[event.target.id.length-1]);
  colorDiffuseClass[id]=normalizeColor([hexToRgb(newValue).r,hexToRgb(newValue).g,hexToRgb(newValue).b]);
}


var bezier={
  quadraticBezier:(p0,p1,p2,t)=>{
    var pFinal={};
    pFinal.x= Math.pow(1-t,2) * p0[0] + (1-t)*2*t*p1[0] + Math.pow(t,2)*p2[0];
    pFinal.y= Math.pow(1-t,2) * p0[1] + (1-t)*2*t*p1[1] + Math.pow(t,2)*p2[1];
    pFinal.z= Math.pow(1-t,2) * p0[2] + (1-t)*2*t*p1[2] + Math.pow(t,2)*p2[2];
    return pFinal;

  },
  cubicBezier:(p0,p1,p2,p3,t)=>{
    var pFinal={};
    pFinal.x= Math.pow(1-t,3) *pO[0] + (1-t)*3*t*p1[0] + (1-t)*3*t*t*p2[0] + Math.pow(t,3)*p3[0];
    pFinal.y= Math.pow(1-t,3) *pO[1] + (1-t)*3*t*p1[1] + (1-t)*3*t*t*p2[1] + Math.pow(t,3)*p3[1];
    pFinal.z= Math.pow(1-t,3) *pO[2] + (1-t)*3*t*p1[2] + (1-t)*3*t*t*p2[2] + Math.pow(t,3)*p3[2];
    return pFinal;
  }
}


function initializeControlPoint(){
  dataset_pca.forEach((element,index)=>{
    var sign=Math.floor(Math.random()*2) == 1 ? 1 : -1;
    control_quadratic_points[index]=[(element[0]+adjusted_data_x[index])/2 + sign*Math.random(),(element[1]+adjusted_data_y[index])/2 + sign*Math.random(),(element[2] + 0) +sign*Math.random()];
  })

}