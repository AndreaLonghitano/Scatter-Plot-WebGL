#version 300 es

precision mediump float;

in vec3 fsNormal;
in vec3 fsPosition;
out vec4 outColor;



uniform mat4 lightDirMatrix;

uniform vec4 ambientType;
uniform vec4 diffuseType;


uniform float SpecShine;
uniform vec3 specularColor;

uniform vec3 ambientMatColor;
uniform vec3 ambientLightColor;
uniform vec3 ambientLightLowColor;
uniform vec3 ambientDir;

uniform vec4 eyePos;

uniform vec3 mDiffColor;

uniform vec3 emitColor;

// Light 1
//uniform vec3 L1_Pos;
uniform vec3 L1_lightDirection;
uniform vec3 L1_lightColor;

vec3 computeAmbientLight(vec3 normalVector){
  //Ambient
  vec3 ambientAmbient = ambientLightColor;
  //Hemispheric
  float amBlend = (dot(normalVector, ambientDir) + 1.0) / 2.0;
  vec3 ambientHemi = ambientLightColor * amBlend + ambientLightLowColor * (1.0 - amBlend);

  return ambientAmbient * ambientType.x + ambientHemi * ambientType.y;
}

vec3 computeDiffuseLight(vec3 normalVector, vec3 lightDir, vec3 eyeDir){

    //Lambert
    vec3 diffuseLambert = vec3(clamp(dot(lightDir, normalVector), 0.0, 1.0));

    //Oren-Nayar with roughness sigma=0.5
    float sigma = 0.5;

	  float theta_i = acos(dot(lightDir, normalVector));
	  float theta_r = acos(dot(eyeDir, normalVector));
	  float alpha = max(theta_i, theta_r);
	  float beta = min(theta_i, theta_r);

    float a = 1.0 - 0.5 * (pow(sigma,2.0) / (pow(sigma, 2.0) + 0.33));
	  float b = 0.45 * (pow(sigma, 2.0) / ( pow(sigma, 2.0) + 0.09));

    vec3 v_i = normalize(lightDir - dot(lightDir, normalVector) * normalVector);
	  vec3 v_r = normalize(eyeDir - dot(eyeDir, normalVector) * normalVector);
    float g = max(0.0, dot(v_i, v_r));

    vec3 diffuseOrenNayar = vec3(clamp(dot(lightDir, normalVector), 0.0, 1.0) * (a + b * g * sin(alpha) * tan(beta)));

    
    
    return diffuseLambert * diffuseType.x + diffuseOrenNayar*diffuseType.y;

}

void main() {

  vec3 nNormal = normalize(fsNormal); /* normalizza sempre perche è bene farlo */
  vec3 lDir = L1_lightDirection;
  vec3 eyedirVec = normalize(eyePos.xyz - fsPosition); 
  //diffuse
  vec3 diffuseColor = mDiffColor * computeDiffuseLight(nNormal, lDir, eyedirVec) * L1_lightColor;
  //ambient
  
  vec3 ambientColor = computeAmbientLight(nNormal) * ambientMatColor;
  //specular
  vec3 L1_reflection = -reflect(L1_lightDirection, fsNormal);
  vec3 L1_specular = pow(clamp(dot(L1_reflection,eyedirVec), 0.0, 1.0), SpecShine) * L1_lightColor;
  vec3 specular = specularColor * L1_specular; 

  //Final Color
  outColor = vec4(clamp(ambientColor + diffuseColor + emitColor, 0.0, 1.0), 1.0);
  }
