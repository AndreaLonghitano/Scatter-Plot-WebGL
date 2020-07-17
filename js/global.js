var color_button=document.getElementsByClassName('btn-light')[0].style.backgroundColor;

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

const DISTANCE_KMEANS={
  0:"euclidean",
  1:"manhattan",
  2:"max",
  3:"min",
  4:"euclidean_square"
}

const MAX_MOVEMENT_X=250.0;
const MAX_MOVEMENT_Z=250.0; 
const MAX_MOVEMENT_Y=250.0;
const RADIUS=2.0;
const MULTIPLICATIVE_FACTOR=50.0;
const SCALE_FACTOR=250;
const VELOCITY_PCA=0.01;








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

// kmeans
var kmeans=false;
var ObjKMeans;
var rate_k_means="slow";
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
var init_kmeans = true;
var centroid_control_points = [];
var last_centroid=new Array();
var new_values;
var min = [];
var max= [];



var keys=[];
var classes=[0,1,2] // hard-coded done manually.
var stats = new Stats();
stats.setMode(0); // 0: fps, 1: ms, 2: mb
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.top = '0px';
document.body.appendChild( stats.domElement );


var programs = new Array(); // in case we have more shaders
var gl;
var path = window.location.pathname;

var page = path.split("/").pop();
var baseDir = window.location.href.replace(page, '');
var shaderDir = baseDir+"shaders/"; 
var canvas=document.getElementById('canvas');


// camera
var cx =0.0,cy=0.0,cz=-200.0;
var rvx = 0.0,rvy=0,rvz=0;
var vx=0,vy=0,vz=0;
var elevation=-20.0,angle=-180.00;
var viewMatrix;
var showNegativeAxes=1;
var palettes=document.getElementsByClassName('favcolor');

// da qui sono tutte da elimianre 
var cubeNormalMatrix;

var cubeWorldMatrix = new Array();    //One world matric for each cube...

//define directional light
var dirLightAlpha = -utils.degToRad(document.getElementById("alfa_light").value);
var dirLightBeta  = -utils.degToRad(document.getElementById("beta_light").value);

var directionalLight = [Math.cos(dirLightAlpha) * Math.cos(dirLightBeta),
            Math.sin(dirLightAlpha),
            Math.cos(dirLightAlpha) * Math.sin(dirLightBeta)
            ];
var directionalLightColor = [1.0, 1.0, 1.0];

var dirLightPos_x = 0.0;
var dirLightPos_y = 0.0;
var dirLightPos_z = 0.0;
var lightConeOut = 30;
var lightConeIn = 80;
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
  1: [1,0,0,0], //Blinn
  2: [0,1,0,0] //Phong
}

var specularType = specularTypeDict[0];

//Emission
var materialEmissionColor = [0.0, 0.0, 0.0];



var colorAxes=[0.5, 0.5, 0.5];

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



  

 



var texture=[];
var texture_mix=1;

const textureCubemapSrc = [
  [baseDir+'texture/skybox/posx.jpg', 2048, 'TEXTURE_CUBE_MAP_POSITIVE_X'],
  [baseDir+'texture/skybox/negx.jpg', 2048, 'TEXTURE_CUBE_MAP_NEGATIVE_X'],
  [baseDir+'texture/skybox/posy.jpg', 2048, 'TEXTURE_CUBE_MAP_POSITIVE_Y'],
  [baseDir+'texture/skybox/negy.jpg', 2048, 'TEXTURE_CUBE_MAP_NEGATIVE_Y'],
  [baseDir+'texture/skybox/posz.jpg', 2048, 'TEXTURE_CUBE_MAP_POSITIVE_Z'],
  [baseDir+'texture/skybox/negz.jpg', 2048, 'TEXTURE_CUBE_MAP_NEGATIVE_Z'],
];