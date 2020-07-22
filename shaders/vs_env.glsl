#version 300 es
in vec4 a_position;

uniform mat4 perspective;
uniform mat4 View;

out vec3 v_normal;

//fog
out vec3 v_position;

void main() {
  // Multiply the position by the matrix.
  gl_Position = perspective*View*a_position;

  // Pass a normal. Since the positions
  // centered around the origin we can just 
  // pass the position
  v_normal = normalize(a_position.xyz);

  // fog
  //retrieve the position relative to the camera
  v_position= (View*a_position).xyz;
}