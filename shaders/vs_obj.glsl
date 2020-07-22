#version 300 es

in vec3 inPosition;
in vec3 inNormal;
out vec3 fsNormal;
out vec3 fsPosition;
out vec2 fs_uv;
out vec3 v_position;

uniform mat4 perspective; 
uniform mat4 ModelView; 


in vec2 a_uv;



void main() {
  fs_uv=a_uv;
  fsNormal = inNormal; /* we're in object space */
  fsPosition = (perspective*ModelView * vec4(inPosition, 1.0)).xyz;
  gl_Position = perspective*ModelView * vec4(inPosition, 1.0);
  v_position=(ModelView*vec4(inPosition,1.0)).xyz; //fog    //retrieve the position relative to the camera

}
