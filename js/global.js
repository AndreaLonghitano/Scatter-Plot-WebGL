var color_button=document.getElementsByClassName('btn-light')[0].style.backgroundColor;

const KEY_CODE = {
  'A': 65,
  'W': 87,
  'S': 83,
  'D': 68,
  'K': 75,
  'P': 80,
  'ONE': 49,
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
const VELOCITY_PCA=0.01;








var items;
var dataset,classes; 
var dataset_pca=new Array();
var dataset_kMeans=new Array();
var rate_k_means="slow";
var centroids;
var sphere;
var cube;
var pyramid;
var listOfPossibleModels;
var models;
//pca
var pca=false;
var adjusted_data_x;
var adjusted_data_y;
var maxT=3.0;
var time=0.0;
var control_quadratic_points=[];



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
var dirLightAlpha = -utils.degToRad(90);
var dirLightBeta  = -utils.degToRad(0);

var directionalLight = [Math.cos(dirLightAlpha) * Math.cos(dirLightBeta),
            Math.sin(dirLightAlpha),
            Math.cos(dirLightAlpha) * Math.sin(dirLightBeta)
            ];
var directionalLightColor = [1.0, 1.0, 1.0];

//Ambient Light
var ambientLightColor = [0.33, 0.33, 0.33]; // modify this for the "shadows"
var ambientLightLowColor = [0.0, 0.13, 0.0];
var ambientTypeDict = {
    0: [0,0,0,0], //none
		1: [1,0,0,0], //ambient
		2: [0,1,0,0] //hemispheric
}
var ambientType = ambientTypeDict[0];
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
var materialEmissionColor = [0.0, 0.0, 0.0];
var colorAxes=[0.5, 0.5, 0.5];

var SpecShine = 50;
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



  

 



