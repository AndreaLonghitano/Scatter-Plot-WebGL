#version 300 es

precision mediump float;

in vec3 v_normal;

out vec4 outColor;
uniform int uRenderMode;
uniform samplerCube uTextureCubemap;

void main() {

  if(uRenderMode==0){
    outColor=vec4(0.79, 0.11, 0.11, 1);
  }
  else{
    outColor=vec4(0.28, 0.13, 0.93, 1);
  }
}