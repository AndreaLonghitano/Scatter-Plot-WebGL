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
var cx =0.0,cy=0.0,cz=200.0;
var rvx = 0.0,rvy=0,rvz=0;
var vx=0,vy=0,vz=0;
var elevation=-20.0,angle=0;
var viewMatrix;
var showNegativeAxes=1;

var lookRadius = 50.0;
var mouseState = false;
var lastMouseX = -100, lastMouseY = -100;


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
var ambientLightColor = [ 0.33, 0.33, 0.33]; // modify this for the "shadows"

//Define material color
var cubeMaterialColor = [0.5, 0.5, 0.5]; 
var cubeMaterialColor2 = [1.0, 0.0, 0.0];
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



  

 



