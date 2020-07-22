#version 300 es

precision mediump float;

uniform vec4 color_axes;
out vec4 outColor;
       

void main() {
  outColor=color_axes;
}