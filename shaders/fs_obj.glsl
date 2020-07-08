#version 300 es

precision mediump float;

in vec3 fsNormal;
out vec4 outColor;

uniform vec3 mDiffColor;
uniform vec3 lightDirection; 
uniform vec3 lightColor; 
uniform mat4 lightDirMatrix;       

void main() {

  vec3 nNormal = normalize(fsNormal); /* normalizza sempre perche è bene farlo */
  vec3 lDir = lightDirection; 
  vec3 lambertColor = mDiffColor * lightColor * max(-dot(lDir,nNormal), 0.0);
  outColor = vec4(clamp(lambertColor, 0.0, 1.0), 1.0);
  }
