#version 300 es

precision mediump float;

in vec3 fsNormal;
in vec3 fsPosition;
out vec4 outColor;



uniform mat4 lightDirMatrix;

uniform float SpecShine;
uniform vec3 specularColor;
uniform vec3 ambientMatColor;
uniform vec3 ambientLightColor;
uniform vec4 eyePos;
uniform vec3 mDiffColor;
uniform vec3 emitColor;

// Light 1
//uniform vec3 L1_Pos;
uniform vec3 L1_lightDirection;
uniform vec3 L1_lightColor;

void main() {

  vec3 nNormal = normalize(fsNormal); /* normalizza sempre perche è bene farlo */
  vec3 lDir = L1_lightDirection; 
  //diffuse
  vec3 lambertColor = mDiffColor * clamp(dot(lDir,nNormal), 0.0, 1.0) * L1_lightColor;
  //ambient
  vec3 ambientColor = ambientLightColor * ambientMatColor;
  //specular
  vec3 eyedirVec = normalize(eyePos.xyz - fsPosition);
  vec3 L1_reflection = -reflect(L1_lightDirection, fsNormal);
  vec3 L1_specular = pow(clamp(dot(L1_reflection,eyedirVec), 0.0, 1.0), SpecShine) * L1_lightColor;
  vec3 specular = specularColor * L1_specular; 

  //Final Color
  outColor = vec4(clamp(ambientColor + lambertColor + emitColor, 0.0, 1.0), 1.0);
  }
