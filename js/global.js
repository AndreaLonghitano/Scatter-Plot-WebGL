//usual variables
var color_button=document.getElementsByClassName('btn-light')[0].style.backgroundColor;
var programs = new Array(); // in case we have more shaders
var gl;
var path = window.location.pathname;
var showNegativeAxes=1;
var palettes=document.getElementsByClassName('favcolor');

var page = path.split("/").pop();
var baseDir = window.location.href.replace(page, '');
var shaderDir = baseDir+"shaders/"; 
var canvas=document.getElementById('canvas');

var keys=[];
var classes=[0,1,2] // hard-coded done manually.
var colorAxes=[1.0, 0.0, 0.0,1.0];


const KEY_CODE = {
  'A': 65,
  'W': 87,
  'S': 83,
  'D': 68,
  'K': 75,
  'P': 80,
  'E':69,
  'Q':81,
  "ARROWUP": 38,
  "ARROWDOWN":40,
  "ARROWLEFT":37,
  "ARROWRIGHT":39
};


const MAX_MOVEMENT_X=250.0;
const MAX_MOVEMENT_Z=250.0; 
const MAX_MOVEMENT_Y=250.0;
const RADIUS=2.0;
const MULTIPLICATIVE_FACTOR=50.0;
const SCALE_FACTOR=250;



var items;
var dataset,classes; 
var sphere;
var cube;
var pyramid;
var listOfPossibleModels;
var models;

//pca
var dataset_pca=new Array();
var pca=false;
var adjusted_data_x;
var adjusted_data_y;
var maxT=3.0;
var time=0.0;
var control_quadratic_points=[];
var selected_element=[];
const VELOCITY_PCA=0.01;


// kmeans
var kmeans=false;
var ObjKMeans;
var centroids;
var centroid_colors={
  0: [1.0,0.0,0.0],
  1: [0.0,1.0,0.0],
  2: [0.0,0.0,1.0]
}
var centroid_items=new Array();
var dataset_kMeans=new Array();
var anim_points=new Array();
const FRAME_RATE_KMEANS=60;
var count_frames=FRAME_RATE_KMEANS;
var centroid_control_points = [];
var last_centroid=new Array();
var new_values;
var min = [];
var max= [];





// statistics
var stats = new Stats();
stats.setMode(0); // 0: fps, 1: ms, 2: mb
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.top = '0px';
document.body.appendChild( stats.domElement );


// camera
var cx =0.0,cy=0.0,cz=-200.0;
var rvx = 0.0,rvy=0,rvz=0;
var vx=0,vy=0,vz=0;
var elevation=-20.0,angle=-180.00;
var viewMatrix;



//define directional light
var dirLightAlpha = -utils.degToRad($("#alfa_light").val());
var dirLightBeta  = -utils.degToRad($("#beta_light").val());



var directionalLight = [Math.sin(dirLightAlpha) * Math.sin(dirLightBeta),
            Math.cos(dirLightAlpha),
            Math.sin(dirLightAlpha) * Math.cos(dirLightBeta)
            ];

var directionalLightColor = [1.0, 1.0, 1.0];

var dirLightPos_x = 0.0;
var dirLightPos_y = 0.0;
var dirLightPos_z = 0.0;
var lightConeOut = parseInt($("#cone_out").val());
var lightConeIn = parseInt($("#cone_in").val())/100;
var lightDecay = 0;
var lightTarget = 61;

var dirLightTypeDict = {
  0: [1,0,0,0], //direct
  1: [0,1,0,0], //point
  2: [0,0,1,0] //spot
}
var dirLightType = dirLightTypeDict[0];

//Ambient Light
var ambientLightColor = [0.16,0.22,0.25];//[0.33, 0.33, 0.33]; // modify this for the "shadows"
var ambientLightLowColor = [0.25, 0.25, 0.25];
var ambientTypeDict = {
    0: [0,0,0,0], //none
		1: [1,0,0,0], //ambient
		2: [0,1,0,0] //hemispheric
}
var ambientType = ambientTypeDict[1];
var dirAmbAlpha = -utils.degToRad(90);
var dirAmbBeta  = -utils.degToRad(0);
var ambientLightDir = [Math.cos(dirAmbAlpha) * Math.cos(dirAmbBeta),
  Math.sin(dirAmbAlpha),
  Math.cos(dirAmbAlpha) * Math.sin(dirAmbBeta)
  ]; 

//Oggetto selezionato
var object_selected=-1; /* -1 => no object selected, >=0 object selected */
//Define material color
var colorDiffuseClass=new Array();
var cubeMaterialColor = [1.0, 0.0, 0.0]; 
var cubeMaterialColor2 = [0.0, 1.0, 0.0];

var diffuseTypeDict= {
  0: [1,0,0,0], //lambert
  1: [0,1,0,0] //Oren-Nayer
}
var diffuseType = diffuseTypeDict[0];

//Specular Light
var specularTypeDict = {
  0: [0,0,0,0], //none
  1: [1,0,0,0] //Blinn
}

var specularType = specularTypeDict[0];

//Emission
var materialEmissionColor = [0.0, 0.0, 0.0];


var SpecShine = 40;
var specularColor = [1.0,  1.0,  1.0];

var lastUpdateTime = (new Date).getTime();
  
var vao={};

var lines_position=[
      0,0,0,
      1,0,0,
      0,0,0,
      0,1,0,
      0,0,0,
      0,0,1
];

var negatedArray = lines_position.map(value => -value);
var lines_position=lines_position.concat(negatedArray);

var min_x=+Infinity;
var max_x=-+Infinity;
var min_y=+Infinity;
var max_y=-+Infinity;
var max_z=-Infinity;
var min_z=+Infinity;
var x_range=document.getElementById('x_range');
var y_range=document.getElementById('y_range');
var z_range=document.getElementById('z_range');


//texture
var textEnable = 1;
var nMapEnable = 1;
var pMapEnable = 1;
var textureMix = document.getElementById("texture_mix").value/100;
const textureCubemapSrc = [
  [baseDir+'texture/skybox/posx.jpg', 2048, 'TEXTURE_CUBE_MAP_POSITIVE_X'],
  [baseDir+'texture/skybox/negx.jpg', 2048, 'TEXTURE_CUBE_MAP_NEGATIVE_X'],
  [baseDir+'texture/skybox/posy.jpg', 2048, 'TEXTURE_CUBE_MAP_POSITIVE_Y'],
  [baseDir+'texture/skybox/negy.jpg', 2048, 'TEXTURE_CUBE_MAP_NEGATIVE_Y'],
  [baseDir+'texture/skybox/posz.jpg', 2048, 'TEXTURE_CUBE_MAP_POSITIVE_Z'],
  [baseDir+'texture/skybox/negz.jpg', 2048, 'TEXTURE_CUBE_MAP_NEGATIVE_Z'],
];


//bezier

var bezier = {
  linear: (p0, p1, t) => {
    var pFinal = {};
    pFinal.x = (1 - t) * p0[0] + t * p1[0];
    pFinal.y = (1 - t) * p0[1] + t * p1[1];
    pFinal.z = (1 - t) * p0[2] + t * p1[2];
    return pFinal;
  },
  quadraticBezier: (p0, p1, p2, t) => {
    var pFinal = {};
    pFinal.x = Math.pow(1 - t, 2) * p0[0] + (1 - t) * 2 * t * p1[0] + Math.pow(t, 2) * p2[0];
    pFinal.y = Math.pow(1 - t, 2) * p0[1] + (1 - t) * 2 * t * p1[1] + Math.pow(t, 2) * p2[1];
    pFinal.z = Math.pow(1 - t, 2) * p0[2] + (1 - t) * 2 * t * p1[2] + Math.pow(t, 2) * p2[2];
    return pFinal;

  },
  cubicBezier: (p0, p1, p2, p3, t) => {
    var pFinal = {};
    pFinal.x = Math.pow(1 - t, 3) * pO[0] + (1 - t) * 3 * t * p1[0] + (1 - t) * 3 * t * t * p2[0] + Math.pow(t, 3) * p3[0];
    pFinal.y = Math.pow(1 - t, 3) * pO[1] + (1 - t) * 3 * t * p1[1] + (1 - t) * 3 * t * t * p2[1] + Math.pow(t, 3) * p3[1];
    pFinal.z = Math.pow(1 - t, 3) * pO[2] + (1 - t) * 3 * t * p1[2] + (1 - t) * 3 * t * t * p2[2] + Math.pow(t, 3) * p3[2];
    return pFinal;
  }
}


//fog
var enable_fog=0;
var fogColor=[208/255.0, 208/255.0, 208/255.0, 1.0];

const uniforms_zero={
 'perspectiveLocation':'perspective',
 'worldViewLocation':'ModelView',
  'materialDiffColorHandle':'mDiffColor',
  'diffuseTypeHandle':'diffuseType',
  'lightDirectionHandle':'L1_lightDirection',
  'lightColorHandle':'L1_lightColor',
  'lightPosHandle':'L1_Pos',
  'lightDecayHandle':'lightDecayHandle',
  'lightTargetHandle':'L1_Target',
  'lightConeOutHandle':'L1_ConeOut',
  'lightConeInHandle':'L1_ConeIn',
  'lightTypeHandle':'lightType',
  'AmbientMatColHandle':'ambientMatColor',
  'AmbientLightColHandle':'ambientLightColor',
  'AmbientLightLowColHandle':'ambientLightLowColor',
  'AmbienttDirHandle':'ambientDir',
  'AmbientTypeHandle':'ambientType',
  'MatEmisColHandle':'emitColor',
  'specularTypehandle':'specularType',
  'specShineHandle':'SpecShine',
  'specularColorHandle':'specCol',
  'lightDirMatrixPositionHandle':'lightDirMatrix',
  'eyePosHandler':'eyePos',
  'textLocation':'u_texture',
  'textureMixHandle':'texture_mix',
  'normalMapHandle':'normalMap',
  'heightMapHandle':'depthMap',
  'textEnableHandle':'enable_text',
  'nMapEnableHandle':'enable_nMap',
  'pMapEnableHandle':'enable_pMap',
  'enableFog':'enablefog',
  'fogNear':'fogNear',
  'fogFar':'fogFar',
  'fogColor':'fogColor',
}

const uniforms_two={
  'enableFog':'enablefog',
  'fogNear':'fogNear',
  'fogFar':'fogFar',
  'fogColor':'fogColor',
  'perspectiveLocation':'perspective',
  'ViewLocation':'View',
  'textLocation':'u_texture'

}