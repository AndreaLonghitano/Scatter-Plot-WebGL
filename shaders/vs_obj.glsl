#version 300 es

in vec3 inPosition;
in vec3 inNormal;
out vec3 fsNormal;

uniform mat4 matrix; 


void main() {
  fsNormal = inNormal; /* le normali non le tocco perche mi vanno bene */
  gl_Position = matrix * vec4(inPosition, 1.0);
}
