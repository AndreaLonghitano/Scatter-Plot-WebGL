(async function main(global) {

  var cubeObjStr, sphereObjStr;


  gl = canvas.getContext("webgl2");
  if (!gl) {
    swal({
      text: "You browser doesn't support WebGL",
      icon: "error",
    });
    return;
  }



  // Create and link the first group of shader
  await utils.loadFiles([shaderDir + 'vs_obj.glsl', shaderDir + 'fs_obj.glsl'], function (shaderText) {
    programs[0] = utils.createAndCompileShaders(gl, shaderText);
  });

  //create the shaders for display simple lines
  await utils.loadFiles([shaderDir + 'vs_simple.glsl', shaderDir + 'fs_simple.glsl'], function (shaderText) {
    programs[1] = utils.createAndCompileShaders(gl, shaderText);
  });

  //cube map shaders
  await utils.loadFiles([shaderDir + 'vs_env.glsl', shaderDir + 'fs_env.glsl'], function (shaderText) {
    programs[2] = utils.createAndCompileShaders(gl, shaderText);
  });

  // load dataset
  await utils.get_json(baseDir + "/model/irisCG.json", function (jsonFile) {
    dataset = jsonFile.values;
    classes = [...new Set(dataset.map(item => item.class))];
  });



  imgtx = new Image();
  imgtx.txNum = 0;
  imgtx.onload = textureLoaderCallback;
  imgtx.src = baseDir + "/texture/cube/brick_color.png";

  imgtx = new Image();
  imgtx.txNum = 1;
  imgtx.onload = textureLoaderCallback;
  imgtx.src = baseDir + "/texture/cube/brick_normal.png";

  imgtx = new Image();
  imgtx.txNum = 2;
  imgtx.onload = textureLoaderCallback;
  imgtx.src = baseDir + "/texture/cube/brick_height.png";


  LoadEnvironment();

  items = new Array(dataset.length);
  dataset.forEach((element, index) => {
    min_x = Math.min(dataset[index].x, min_x)
    max_x = Math.max(dataset[index].x, max_x);
    min_z = Math.min(dataset[index].z, min_z)
    max_z = Math.max(dataset[index].z, max_z);
    min_y = Math.min(dataset[index].y, min_y)
    max_y = Math.max(dataset[index].y, max_y);
    items[index] = new Item([dataset[index].x, dataset[index].y, dataset[index].z], dataset[index].class);
  });


  // centroids for k-means
  await utils.get_json(baseDir + "/model/centroids.json", function (jsonFile) {
    centroids = jsonFile.data;
  });


  centroids.forEach((element, index) => {
    centroid_items[index] = new Item([element[0], element[1], element[2]], "centroid");
  });

  min = new Array(3);
  max = new Array(3);
  min.fill(+Infinity);
  max.fill(0);

  utils.showCanvas();

  cubeObjStr = await utils.get_objstr(baseDir + "/model/cube_test.obj");
  cube = new OBJ.Mesh(cubeObjStr);
  sphereObjStr = await utils.get_objstr(baseDir + "/model/sphere_1.obj");
  sphere = new OBJ.Mesh(sphereObjStr);
  models = { 'Cube': cube, 'Sphere': sphere };

  // get all the attribute location for each program
  gl.useProgram(programs[0]);
  programs[0].positionAttributeLocation = gl.getAttribLocation(programs[0], "inPosition");
  programs[0].normalAttributeLocation = gl.getAttribLocation(programs[0], "inNormal");
  programs[0].uvAttributeLocation = gl.getAttribLocation(programs[0], "a_uv");
  Object.keys(uniforms_zero).forEach((k)=>{
    programs[0][k]=gl.getUniformLocation(programs[0],uniforms_zero[k]);
  }) 

  gl.useProgram(programs[1]);
  programs[1].positionAttributeLocation = gl.getAttribLocation(programs[1], "inPosition");
  programs[1].matrixLocation = gl.getUniformLocation(programs[1], "matrix");
  programs[1].color_axes = gl.getUniformLocation(programs[1], "color_axes");

  //environment
  gl.useProgram(programs[2]);
  programs[2].positionAttributeLocation = gl.getAttribLocation(programs[2], "a_position");
  Object.keys(uniforms_two).forEach((k)=>{
    programs[2][k]=gl.getUniformLocation(programs[2],uniforms_two[k]);
  }) 


  //compute eprspective matrix
  perspectiveMatrix = utils.MakePerspective(90, gl.canvas.width / gl.canvas.height, 0.1, 1300);


  //create all the vertex array objects
  createVaoObjects(programs[0], "Sphere", vertices = sphere.vertices, normals = sphere.vertexNormals, indices = sphere.indices, uv = sphere.textures);
  createVaoObjects(programs[0], "Cube", vertices = cube.vertices, normals = cube.vertexNormals, indices = cube.indices, uv = cube.textures);
  createVaoObjects(programs[1], "Lines", lines_position);
  createVaoObjects(programs[2], "Skybox", vertices = setGeometry(500));
  pyramid = buildPyramid();
  createVaoObjects(programs[1], "Pyramid", vertices = pyramid.vertices, normals = undefined, indices = pyramid.indices);
  listOfPossibleModels = Object.keys(vao);
  listOfPossibleModels.splice(-3, 3);
  createUiModelClass();

  updateScene();

}(window))

var updateScene = function () {
  stats.begin();
  drawScene();
  stats.end();
  window.requestAnimationFrame(updateScene);
};


function drawScene() {

  resize(gl.canvas);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  computeViewMatrix();
  showAxes();

  if (pca && !kmeans) {
    animate_pca();
  }
  else if ((kmeans && count_frames == FRAME_RATE_KMEANS)) {
    if (ObjKMeans.end) {
      kmeans = !kmeans;
      $("#K").css('background-color',color_button);
    }
    else {
      last_centroid = ObjKMeans.centroids;
      new_values = ObjKMeans.performSteps();
      count_frames = 0;
    }
  }
  else if (kmeans && !(count_frames == FRAME_RATE_KMEANS)) {
    count_frames += 1;
    new_values.centroids.forEach((element, index) => {
      anim_points[index] = bezier.linear([last_centroid[index][0], last_centroid[index][1], last_centroid[index][2]], [element[0], element[1], element[2]], count_frames / FRAME_RATE_KMEANS);
      centroid_items[index].set_pos(utils.MakeWorld(anim_points[index].x * MULTIPLICATIVE_FACTOR, anim_points[index].y * MULTIPLICATIVE_FACTOR, anim_points[index].z * MULTIPLICATIVE_FACTOR, centroid_items[index].rotX, centroid_items[index].rotY, centroid_items[index].rotZ, RADIUS));
      centroid_items[index].set_x(anim_points[index].x);
      centroid_items[index].set_y(anim_points[index].y);
      centroid_items[index].set_z(anim_points[index].z);
    });
    for (var i = 0; i < centroids.length; i++) {
      var el = [];
      new_values.assignments.forEach((element, index) => {
        if (element == i) el.push(index);
      });
      el.forEach((e) => {
        min[i] = Math.min(util_distances.euclidean([dataset[e].x, dataset[e].y, dataset[e].z], [anim_points[i].x, anim_points[i].y, anim_points[i].z]), min[i]);
        max[i] = Math.max(util_distances.euclidean([dataset[e].x, dataset[e].y, dataset[e].z], [anim_points[i].x, anim_points[i].y, anim_points[i].z]), max[i]);
      })
    }

  }
  gl.useProgram(programs[0]);

  if (new_values !== undefined) {

    // render centroids
    for (let i = 0; i < centroids.length; i++) {

      var shape = listOfPossibleModels[1];
      var worldMatrix = centroid_items[i].worldM;

      var worldViewMatrix = utils.multiplyMatrices(viewMatrix, worldMatrix);
      
      var eyePosTransformed = utils.multiplyMatrixVector(utils.invertMatrix(worldMatrix), [cx, cy, cz, 1.0]);
      var lightPosTransformed = utils.multiplyMatrixVector(utils.invertMatrix(worldMatrix), [dirLightPos_x, dirLightPos_y, dirLightPos_z, 1.0]);
      var lightDirMatrix = utils.sub3x3from4x4(utils.transposeMatrix(worldMatrix));
      var directionalLightTrasformed = utils.normalizeVec3(utils.multiplyMatrix3Vector3(lightDirMatrix, directionalLight));
      var ambientLightDirTransformed = utils.normalizeVec3(utils.multiplyMatrix3Vector3(lightDirMatrix, ambientLightDir));

      gl.uniformMatrix4fv(programs[0].perspectiveLocation, gl.FALSE, utils.transposeMatrix(perspectiveMatrix));
      gl.uniformMatrix4fv(programs[0].worldViewLocation, gl.FALSE, utils.transposeMatrix(worldViewMatrix));

      setUniformObjects(worldViewMatrix,centroid_colors[i],eyePosTransformed,lightPosTransformed,directionalLightTrasformed,ambientLightDirTransformed,true)

      gl.bindVertexArray(vao[shape]); 
      gl.drawElements(gl.TRIANGLES, models[shape].indices.length, gl.UNSIGNED_SHORT, 0);
    }

    for (var i = 0; i < dataset.length && anim_points.length; i++) {

      var objSelected = $('#class' + dataset[i].class).val();
      var ele = listOfPossibleModels[objSelected];
      var worldMatrix = items[i].worldM;
      var worldViewMatrix = utils.multiplyMatrices(viewMatrix, worldMatrix);
      var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, worldViewMatrix);
      var eyePosTransformed = utils.multiplyMatrixVector(utils.invertMatrix(worldMatrix), [cx, cy, cz, 1.0]);
      var lightPosTransformed = utils.multiplyMatrixVector(utils.invertMatrix(worldMatrix), [dirLightPos_x, dirLightPos_y, dirLightPos_z, 1.0]);
      var lightDirMatrix = utils.sub3x3from4x4(utils.transposeMatrix(worldMatrix));
      var directionalLightTrasformed = utils.normalizeVec3(utils.multiplyMatrix3Vector3(lightDirMatrix, directionalLight));
      var ambientLightDirTransformed = utils.normalizeVec3(utils.multiplyMatrix3Vector3(lightDirMatrix, ambientLightDir));
      var cluster_color = centroid_colors[new_values.assignments[i]];
      var distance_p_centroid = util_distances.euclidean([dataset[i].x, dataset[i].y, dataset[i].z], [anim_points[new_values.assignments[i]].x, anim_points[new_values.assignments[i]].y, anim_points[new_values.assignments[i]].z]);
      var distance_norm = normalize(distance_p_centroid, min[new_values.assignments[i]], max[new_values.assignments[i]]);
      var final_color = new Array();
      for (let i = 0; i < cluster_color.length; i++) {
        final_color[i] = cluster_color[i] * (1 - distance_norm);
      }
      var color = i == object_selected ? cubeMaterialColor : final_color;

      setUniformObjects(worldViewMatrix,color,eyePosTransformed,lightPosTransformed,directionalLightTrasformed,ambientLightDirTransformed,false)


      gl.bindVertexArray(vao[ele]); // va bene metterlo qui prima di diseganre
      gl.drawElements(gl.TRIANGLES, models[ele].indices.length, gl.UNSIGNED_SHORT, 0);
    }


  }

  else {
    for (i = 0; i < dataset.length; i++) {
      if (dataset[i].x < (min_x + (x_range.valueLow * (max_x - min_x) / 100)) || dataset[i].x > (max_x - (1 - x_range.valueHigh / 100) * (max_x - min_x)) ||
        dataset[i].y < (min_y + (y_range.valueLow * (max_y - min_y) / 100)) || dataset[i].y > (max_y - (1 - y_range.valueHigh / 100) * (max_y - min_y)) ||
        dataset[i].z < (min_z + (z_range.valueLow * (max_z - min_z) / 100)) || dataset[i].z > (max_z - (1 - z_range.valueHigh / 100) * (max_z - min_z))) {
        items[i].set_display(false);
        continue;
      }
      var objSelected = $('#class' + dataset[i].class).val();
      var ele = listOfPossibleModels[objSelected];
      var worldMatrix = items[i].worldM;
      var worldViewMatrix = utils.multiplyMatrices(viewMatrix, worldMatrix);
      var eyePosTransformed = utils.multiplyMatrixVector(utils.invertMatrix(worldMatrix), [cx, cy, cz, 1.0]);
      var lightPosTransformed = utils.multiplyMatrixVector(utils.invertMatrix(worldMatrix), [dirLightPos_x, dirLightPos_y, dirLightPos_z, 1.0]);
      var lightDirMatrix = utils.sub3x3from4x4(utils.transposeMatrix(worldMatrix));
      var directionalLightTrasformed = utils.normalizeVec3(utils.multiplyMatrix3Vector3(lightDirMatrix, directionalLight));
      var ambientLightDirTransformed = utils.normalizeVec3(utils.multiplyMatrix3Vector3(lightDirMatrix, ambientLightDir));
      var color = i == object_selected ? cubeMaterialColor : colorDiffuseClass[dataset[i].class];

      setUniformObjects(worldViewMatrix,color,eyePosTransformed,lightPosTransformed,directionalLightTrasformed,ambientLightDirTransformed,false);

      gl.bindVertexArray(vao[ele]); // va bene metterlo qui prima di diseganre
      gl.drawElements(gl.TRIANGLES, models[ele].indices.length, gl.UNSIGNED_SHORT, 0);
    }
  }
  // draw the skybox here
  gl.useProgram(programs[2]);
  gl.disable(gl.CULL_FACE);
  gl.bindVertexArray(vao['Skybox']);
  // (A*B)^T = B^T * A^T
  gl.uniformMatrix4fv(programs[2].perspectiveLocation, false,utils.transposeMatrix(perspectiveMatrix));
  gl.uniformMatrix4fv(programs[2].ViewLocation, false, utils.transposeMatrix(viewMatrix));
  //fog
  gl.uniform1i(programs[2].enableFog, enable_fog);
  gl.uniform1f(programs[2].fogFar,800.0);
  gl.uniform1f(programs[2].fogNear,0.0);
  gl.uniform4fv(programs[2].fogColor,fogColor);
  gl.uniform1i(programs[2].textLocation,3);
  gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);
}


function setUniformObjects(worldViewMatrix,color,eyePosTransformed,lightPosTransformed,directionalLightTrasformed,ambientLightDirTransformed,centroid=false){
      gl.uniformMatrix4fv(programs[0].perspectiveLocation, gl.FALSE, utils.transposeMatrix(perspectiveMatrix));
      gl.uniformMatrix4fv(programs[0].worldViewLocation, gl.FALSE, utils.transposeMatrix(worldViewMatrix));
      gl.uniform4fv(programs[0].diffuseTypeHandle, diffuseType);
      gl.uniform3fv(programs[0].materialDiffColorHandle, color);
      gl.uniform3fv(programs[0].lightColorHandle, directionalLightColor);
      gl.uniform3fv(programs[0].lightDirectionHandle, directionalLightTrasformed);
      gl.uniform4fv(programs[0].lightPosHandle, lightPosTransformed);
      gl.uniform1f(programs[0].lightDecayHandle, lightDecay);
      gl.uniform1f(programs[0].lightTargetHandle, lightTarget);
      gl.uniform1f(programs[0].lightConeOutHandle, lightConeOut);
      gl.uniform1f(programs[0].lightConeInHandle, lightConeIn);
      gl.uniform4fv(programs[0].lightTypeHandle, dirLightType);
      gl.uniform3fv(programs[0].AmbientLightColHandle, ambientLightColor);
      gl.uniform3fv(programs[0].AmbientLightLowColHandle, ambientLightLowColor);
      gl.uniform3fv(programs[0].AmbienttDirHandle, ambientLightDirTransformed);
      gl.uniform3fv(programs[0].AmbientMatColHandle, color);
      gl.uniform4fv(programs[0].AmbientTypeHandle, ambientType);
      gl.uniform3fv(programs[0].MatEmisColHandle, centroid ? color:materialEmissionColor);
      gl.uniform4fv(programs[0].specularTypehandle, specularType);
      gl.uniform1f(programs[0].specShineHandle, SpecShine);
      gl.uniform3fv(programs[0].specularColorHandle, specularColor);
      gl.uniform4fv(programs[0].eyePosUniform, eyePosTransformed);
      //texture
      gl.uniform1f(programs[0].textureMixHandle, textureMix);
      gl.uniform1i(programs[0].textLocation,0); 
      gl.uniform1i(programs[0].normalMapHandle,1);
      gl.uniform1i(programs[0].heightMapHandle,2);
      gl.uniform1i(programs[0].textEnableHandle, textEnable);
      gl.uniform1i(programs[0].nMapEnableHandle, nMapEnable);
      gl.uniform1i(programs[0].pMapEnableHandle, pMapEnable);

      //fog
      gl.uniform1i(programs[0].enableFog, enable_fog);
      gl.uniform1f(programs[0].fogFar,200.0);
      gl.uniform1f(programs[0].fogNear,0.0)
      gl.uniform4fv(programs[0].fogColor,fogColor);
}



function animate_pca() {
  if (!time) {
    initializeControlPoint();
  }
  var quadratic;
  var point;
  for (var i = 0; i < selected_element.length; i++) {
    point = bezier.quadraticBezier([dataset_pca[i][0], dataset_pca[i][1], dataset_pca[i][2]], control_quadratic_points[i], [adjusted_data_x[i], adjusted_data_y[i], 0.0], time / maxT);
    rotation = QuaternionToEuler(items[selected_element[i]].get_quaternion().slerp(Quaternion.fromEuler(utils.degToRad(45), 0, 0, order = "XYZ"))(time / maxT));
    items[selected_element[i]].set_pos(utils.MakeWorld(point.x * MULTIPLICATIVE_FACTOR, point.y * MULTIPLICATIVE_FACTOR, point.z * MULTIPLICATIVE_FACTOR, utils.radToDeg(rotation[0]), utils.radToDeg(rotation[1]), utils.radToDeg(rotation[2]), RADIUS));
    items[selected_element[i]].set_x(point.x);
    items[selected_element[i]].set_y(point.y);
    items[selected_element[i]].set_z(point.z);
    items[selected_element[i]].set_rotX(utils.radToDeg(rotation[0]));
    items[selected_element[i]].set_rotY(utils.radToDeg(rotation[1]));
    items[selected_element[i]].set_rotZ(utils.radToDeg(rotation[2]));
  }
  time += VELOCITY_PCA;
  if (time >= maxT) {
    time = 0;
    pca = !pca;
    element = document.getElementById('P');
    if (element) {
      element.style.backgroundColor = color_button;
    }
  }
}



window.addEventListener('keyup', callbacks.onkeyUp, false);
window.addEventListener('keydown', callbacks.onKeyDown, false);
window.addEventListener('mouseup', onMouseUp, false);






// OBJECTS CLASSES
class Item {
  constructor([x, y, z], clas) {
    this.class = clas;
    this.x = x;
    this.y = y;
    this.z = z;
    this.rotX = Math.floor(Math.random() * (360 - 0 + 1) + 0);
    this.rotY = Math.floor(Math.random() * (360 - 0 + 1) + 0);
    this.rotZ = Math.floor(Math.random() * (360 - 0 + 1) + 0);
    this.initialQuaternion = Quaternion.fromEuler(utils.degToRad(this.rotZ), utils.degToRad(this.rotX), utils.degToRad(this.rotY)); // default order is ZYX
    this.worldM = utils.MakeWorld(this.x * MULTIPLICATIVE_FACTOR, this.y * MULTIPLICATIVE_FACTOR, this.z * MULTIPLICATIVE_FACTOR, this.rotX, this.rotY, this.rotZ, RADIUS);
    this.display = true;
  }

  get_display() {
    return this.display;
  }

  set_display(val) {
    this.display = val;
  }

  set_rotX(x) {
    this.rotX = x;
  }
  set_rotY(y) {
    this.rotY = y;
  }
  set_rotZ(z) {
    this.rotZ = z;
  }

  set_pos(worldMatrix) {
    this.worldM = worldMatrix;
  }
  set_x(x) {
    this.x = x;
  }
  set_y(y) {
    this.y = y;
  }
  set_z(z) {
    this.z = z;
  }

  get_x() {
    return this.x;
  }

  get_y() {
    return this.y;
  }

  get_z() {
    return this.z;
  }

  get_worldMatrix() {
    return this.worldM;
  }
  get_quaternion() {
    return this.initialQuaternion;
  }

  pos() {
    return [this.worldM[3], this.worldM[7], this.worldM[11]];
  }
}






function computeViewMatrix() {
  viewMatrix = utils.MakeView(cx, cy, cz, elevation, angle); // elevation and angle should be expressed in degree

  var viewMatrixTransposed = utils.transposeMatrix(viewMatrix);

  dvecmat = utils.transposeMatrix(viewMatrix); dvecmat[12] = dvecmat[13] = dvecmat[14] = 0.0;
  xaxis = [dvecmat[0], dvecmat[4], dvecmat[8]];
  yaxis = [dvecmat[1], dvecmat[5], dvecmat[9]];
  zaxis = [dvecmat[2], dvecmat[6], dvecmat[10]];


  if ((rvx != 0) || (rvy != 0)) {
    qx = Quaternion.fromAxisAngle(xaxis, utils.degToRad(rvx * 1));
    qy = Quaternion.fromAxisAngle(yaxis, utils.degToRad(rvy * 1));
    newDvecmat = utils.multiplyMatrices(utils.multiplyMatrices(qy.toMatrix4(), qx.toMatrix4()), dvecmat);
    R11 = newDvecmat[10]; R12 = newDvecmat[8]; R13 = newDvecmat[9];
    R21 = newDvecmat[2]; R22 = newDvecmat[0]; R23 = newDvecmat[1];
    R31 = newDvecmat[6]; R32 = newDvecmat[4]; R33 = newDvecmat[5];


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

    elevation = (theta * 180 / Math.PI);
    angle = (-psi * 180 / Math.PI);

  }
  var delta = utils.multiplyMatrixVector(dvecmat, [vx, vy, vz, 0.0]);
  cx += delta[0];
  cy += delta[1];
  cz += delta[2];
  cx = Math.abs(cx) <= MAX_MOVEMENT_X ? cx : Math.sign(cx) * MAX_MOVEMENT_X; // modify this constant to limit the movement
  cz = Math.abs(cz) <= MAX_MOVEMENT_Z ? cz : Math.sign(cz) * MAX_MOVEMENT_Z;
  cy = Math.abs(cy) <= MAX_MOVEMENT_Y ? cy : Math.sign(cy) * MAX_MOVEMENT_Y;
}


function createUiModelClass() {
  classes.forEach((i) => {
    $('#model-class').append(`<div class="row d-flex justify-content-center">
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

  $(".favcol").toArray().forEach((ele) => {
    colorDiffuseClass.push(normalizeColor([hexToRgb(ele.value).r, hexToRgb(ele.value).g, hexToRgb(ele.value).b]));
  });

  $('.modelselect').toArray().forEach(sel => {
    listOfPossibleModels.forEach((model, index) => {
      var o = new Option(model, index);
      sel.append(o);
    });
  });


  $('.modelselect').toArray().forEach(sel => {
    var random_selection = Math.floor(Math.random() * (listOfPossibleModels.length)) + 0;
    sel.value = random_selection;
  });



}

function showAxes() {
  gl.useProgram(programs[1]);
  var worldMatrix = utils.MakeWorld(0, 0, 0, 0, 0, 0, SCALE_FACTOR);
  var worldViewMatrix = utils.multiplyMatrices(viewMatrix, worldMatrix);
  var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, worldViewMatrix);
  gl.uniformMatrix4fv(programs[1].matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
  gl.uniform4fv(programs[1].color_axes, colorAxes);
  gl.bindVertexArray(vao['Lines']);
  gl.drawArrays(gl.LINES, 0, 6);
  if (showNegativeAxes) {
    gl.drawArrays(gl.LINES, 6, 6);
  }
  showPyramid(1);
  if (showNegativeAxes) {
    showPyramid(-1);
  }


}

function showPyramid(negative_axes) {
  // show Pyramid
  for (var i = 0; i < 3; i++) {
    gl.bindVertexArray(vao['Pyramid']);
    switch (i) {
      //x
      case 0:
        var worldMatrix = utils.MakeWorld(SCALE_FACTOR * negative_axes, 0, 0, 0, 0, 90 * negative_axes, 2.0);
        break;
      //y
      case 1:
        var worldMatrix = utils.MakeWorld(0, SCALE_FACTOR * negative_axes, 0, ((180) * (1 - negative_axes)) / 2, 0, 0, 2.0);
        break;
      //z
      case 2:
        var worldMatrix = utils.MakeWorld(0, 0, SCALE_FACTOR * negative_axes, 90 * negative_axes, 0, 0, 2.0);
        break;
    }
    var worldViewMatrix = utils.multiplyMatrices(viewMatrix, worldMatrix);
    var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, worldViewMatrix);
    gl.uniformMatrix4fv(programs[1].matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
    gl.uniform4fv(programs[1].color_axes, colorAxes);
    gl.drawElements(gl.TRIANGLES, pyramid.indices.length, gl.UNSIGNED_SHORT, 0);
  }
}


function createVaoObjects(program, nameObject, vertices, normals = undefined, indices = undefined, uv = undefined) {
  gl.useProgram(program);
  vao[nameObject] = gl.createVertexArray();
  gl.bindVertexArray(vao[nameObject]);

  // position
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(program.positionAttributeLocation);
  gl.vertexAttribPointer(program.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(program.positionAttributeLocation);

  if (!(normals == undefined)) {
    //normals
    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(programs[0].normalAttributeLocation);
    gl.vertexAttribPointer(programs[0].normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);

  }

  if (!(indices == undefined)) {
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  }
  if (!(uv == undefined)) {
    var uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW); // the uv coordinates are in the cubeDefintion files
    gl.enableVertexAttribArray(programs[0].uvAttributeLocation);
    gl.vertexAttribPointer(programs[0].uvAttributeLocation, 2, gl.FLOAT, false, 0, 0); // 2 values for each coordinate...
  }

  gl.bindVertexArray(null);
}


function resize(canvas) {
  // Lookup the size the browser is displaying the canvas.
  var displayWidth = canvas.clientWidth;
  var displayHeight = canvas.clientHeight;

  // Check if the canvas is not the same size.
  if (canvas.width != displayWidth ||
    canvas.height != displayHeight) {

    // Make the canvas the same size
    canvas.width = displayWidth;
    canvas.height = displayHeight;
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

function normalizeColor(color) {
  return [color[0] / 255.0, color[1] / 255.0, color[2] / 255.0];
}

function updatePalette(event) {
  var newValue = event.target.value;
  var id = parseInt(event.target.id[event.target.id.length - 1]);
  colorDiffuseClass[id] = normalizeColor([hexToRgb(newValue).r, hexToRgb(newValue).g, hexToRgb(newValue).b]);
}

function initializeControlPoint() {
  dataset_pca.forEach((element, index) => {
    var sign = Math.floor(Math.random() * 2) == 1 ? 1 : -1;
    control_quadratic_points[index] = [(element[0] + adjusted_data_x[index]) / 2 + sign * Math.random(), (element[1] + adjusted_data_y[index]) / 2 + sign * Math.random(), (element[2] + 0) + sign * Math.random()];
  })

}

function normalize(val, min, max) {
  return (val - min) / (max - min);
}

// texture loader callback
var textureLoaderCallback = function () {
  var textureId = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + this.txNum);
  gl.bindTexture(gl.TEXTURE_2D, textureId);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this);
  // set the filtering so we don't need mips
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
}

// load the environment map
function LoadEnvironment() {
  // Create a texture.
  var texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
  textureCubemapSrc.forEach(([src, dim, type]) => {
    let img = new Image();
    gl.texImage2D(gl[type], 0, gl.RGBA, dim, dim, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    img.addEventListener('load', () => {
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(gl[type], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    });
    img.src = src;
  });
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
}

function setGeometry(size) {
  var positions = 
    [
    -size, -size,  -size,
    -size,  size,  -size,
     size, -size,  -size,
    -size,  size,  -size,
     size,  size,  -size,
     size, -size,  -size,

    -size, -size,   size,
     size, -size,   size,
    -size,  size,   size,
    -size,  size,   size,
     size, -size,   size,
     size,  size,   size,

    -size,   size, -size,
    -size,   size,  size,
     size,   size, -size,
    -size,   size,  size,
     size,   size,  size,
     size,   size, -size,

    -size,  -size, -size,
     size,  -size, -size,
    -size,  -size,  size,
    -size,  -size,  size,
     size,  -size, -size,
     size,  -size,  size,

    -size,  -size, -size,
    -size,  -size,  size,
    -size,   size, -size,
    -size,  -size,  size,
    -size,   size,  size,
    -size,   size, -size,

     size,  -size, -size,
     size,   size, -size,
     size,  -size,  size,
     size,  -size,  size,
     size,   size, -size,
     size,   size,  size,

    ];
    return positions;
  }