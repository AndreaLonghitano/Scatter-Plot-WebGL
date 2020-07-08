#version 300 es

precision mediump float;

in vec3 fsNormal;
out vec4 outColor;

uniform vec3 mDiffColor;
uniform vec3 lightDirection; 
uniform vec3 lightColor; 
uniform mat4 lightDirMatrix;       

void main() {

  vec3 nNormal = normalize(fsNormal);
  vec3 lDir = mat3(lightDirMatrix) * lightDirection; //this is important
  // it's expensive becuase you just have to do it for each fragment.. Son the GPU is to expensive.
  vec3 lambertColor = mDiffColor * lightColor * max(-dot(lDir,nNormal), 0.0);
  vec4 fogColor=vec4(0.5,0.5,0.5,1);
  float fogAmount=0.0;
  vec4 originalColor = vec4(clamp(lambertColor, 0.0, 1.0), 1.0);
  vec4 trial=mix(originalColor, fogColor, fogAmount);
  outColor=trial;
}