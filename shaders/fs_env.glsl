#version 300 es
precision highp float;

// Passed in from the vertex shader.
in vec3 v_normal;

// The texture.
uniform samplerCube u_texture;

//fog
uniform bool enablefog;
in vec3 v_position;
uniform float fogNear;
uniform float fogFar;
uniform vec4 fogColor;




// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
   vec4 sample_color = texture(u_texture, normalize(v_normal));
      if(enablefog){
      //evaluate the color of the output using lienar model
      float fogDistance = length(v_position);
      float fogAmount = smoothstep(fogNear, fogFar, fogDistance);
      outColor=mix(sample_color, fogColor, fogAmount);
      }
      else{
         outColor=sample_color;
      }

}