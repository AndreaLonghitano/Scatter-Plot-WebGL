#version 300 es

in vec3 inPosition;

uniform mat4 matrix; 
out vec3 v_normal;


void main() {
  gl_Position = matrix * vec4(inPosition, 1.0);
  v_normal=inPosition;
}