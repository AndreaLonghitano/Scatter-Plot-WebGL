#version 300 es

in vec3 inPosition;
in vec3 inNormal;
out vec3 fsNormal;
out vec3 fsPosition;

uniform mat4 matrix; 

in vec2 a_uv;
out vec2 fs_uv;


void main() {
  fs_uv=a_uv;
  fsNormal = inNormal; /* le normali non le tocco perche mi vanno bene */
  fsPosition = (matrix * vec4(inPosition, 1.0)).xyz;
  gl_Position = matrix * vec4(inPosition, 1.0);
}
