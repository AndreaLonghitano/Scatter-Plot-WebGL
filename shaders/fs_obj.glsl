#version 300 es

precision mediump float;

in vec3 fsNormal;
in vec3 fsPosition;
out vec4 outColor;



uniform mat4 lightDirMatrix;

uniform vec4 ambientType;
uniform vec4 diffuseType;
uniform vec4 specularType;
uniform vec4 lightType;

//specular
uniform float SpecShine;
uniform vec3 specCol;

//ambient
uniform vec3 ambientMatColor;
uniform vec3 ambientLightColor;
uniform vec3 ambientLightLowColor;
uniform vec3 ambientDir;

uniform vec4 eyePos;

//diffuse
uniform vec3 mDiffColor;

//emission
uniform vec3 emitColor;

// Light 1
uniform vec4 L1_Pos;
uniform vec3 L1_lightDirection;
uniform vec3 L1_lightColor;
uniform float L1_ConeOut;
uniform float L1_ConeIn;
uniform float L1_Decay;
uniform float L1_Target;

//Texture
in vec2 fs_uv;
uniform sampler2D u_texture;
uniform float texture_mix;

vec3 computeLightDir(vec3 lightPos, vec3 lightDir) {
	
	//Direct
	vec3 directLightDir = lightDir;

  //Point
	vec3 pointLightDir = normalize(lightPos - fsPosition);
	
	//Spot
	vec3 spotLightDir = normalize(lightPos - fsPosition);

	return directLightDir * lightType.x + pointLightDir * lightType.y + spotLightDir * lightType.z;
}

vec3 computeLightColor(vec3 lightPos){
  float LCosOut = cos(radians(L1_ConeOut / 2.0));
	float LCosIn = cos(radians(L1_ConeOut * L1_ConeIn / 2.0));

  //Direct
	vec3 directLightCol = L1_lightColor;

	//Point
	vec3 pointLightCol = L1_lightColor * pow(L1_Target / length(lightPos - fsPosition), L1_Decay);
	
	//Spot
	vec3 spotLightDir = normalize(lightPos - fsPosition);
	float CosAngle = dot(spotLightDir, L1_lightDirection);
	vec3 spotLightCol = L1_lightColor * pow(L1_Target / length(lightPos - fsPosition), L1_Decay) *
						clamp((CosAngle - LCosOut) / (LCosIn - LCosOut), 0.0, 1.0);

	return directLightCol * lightType.x + pointLightCol * lightType.y + spotLightCol * lightType.z;
}

vec3 computeAmbientLight(vec3 normalVector){
  //Ambient
  vec3 ambientAmbient = ambientLightColor;
  //Hemispheric
  float amBlend = (dot(normalVector, ambientDir) + 1.0) / 2.0;
  vec3 ambientHemi = ambientLightColor * amBlend + ambientLightLowColor * (1.0 - amBlend);

  return ambientAmbient * ambientType.x + ambientHemi * ambientType.y;
}

vec3 computeDiffuseLight(vec3 normalVector, vec3 lightDir, vec3 eyeDir){

    //Lambert
    vec3 diffuseLambert = vec3(clamp(dot(lightDir, normalVector), 0.0, 1.0));

    //Oren-Nayar with roughness sigma=0.5
    float sigma = 0.5;

	  float theta_i = acos(dot(lightDir, normalVector));
	  float theta_r = acos(dot(eyeDir, normalVector));
	  float alpha = max(theta_i, theta_r);
	  float beta = min(theta_i, theta_r);

    float a = 1.0 - 0.5 * (pow(sigma,2.0) / (pow(sigma, 2.0) + 0.33));
	  float b = 0.45 * (pow(sigma, 2.0) / ( pow(sigma, 2.0) + 0.09));

    vec3 v_i = normalize(lightDir - dot(lightDir, normalVector) * normalVector);
	  vec3 v_r = normalize(eyeDir - dot(eyeDir, normalVector) * normalVector);
    float g = max(0.0, dot(v_i, v_r));

    vec3 diffuseOrenNayar = vec3(clamp(dot(lightDir, normalVector), 0.0, 1.0) * (a + b * g * sin(alpha) * tan(beta)));

    
    
    return diffuseLambert * diffuseType.x + diffuseOrenNayar*diffuseType.y;

}

vec3 computeSpecularLight(vec3 eyeDir, vec3 lightDir, vec3 normalVector, vec3 lightColor){
  
  // Blinn
  vec3 blinnSpecular = vec3(pow(clamp(dot(normalize(eyeDir+lightDir), normalVector),0.0,1.0), SpecShine)) * lightColor;

  //Phong
  vec3 reflection = -reflect(lightDir, normalVector); // FIX!!
  vec3 phongSpecular = vec3(pow(clamp(dot(eyeDir,reflection),0.0,1.0), SpecShine)) * lightColor;

  return blinnSpecular * specularType.x + phongSpecular*specularType.y ;
}

void main() {

  vec3 nNormal = normalize(fsNormal); /* normalizza sempre perche è bene farlo */
  vec3 eyedirVec = normalize(eyePos.xyz - fsPosition);
  vec3 lightPos = L1_Pos.xyz;
  vec3 texColor = vec3(texture(u_texture,fs_uv));
  //direct light
  vec3 lDir = computeLightDir(lightPos, L1_lightDirection);
  vec3 lColor = computeLightColor(lightPos);
  //diffuse
  vec3 diffuseColor = texColor * texture_mix + (1.0 - texture_mix)*mDiffColor;
  vec3 diffuse = computeDiffuseLight(nNormal,lDir,eyedirVec)*diffuseColor*lColor;
  //ambient
  vec3 ambientMatColorMix = texColor * texture_mix + (1.0 - texture_mix)* ambientMatColor;
  vec3 ambient = computeAmbientLight(nNormal) * ambientMatColorMix;
  //specular
  vec3 specular = computeSpecularLight(eyedirVec, lDir, nNormal, lColor);
  vec3 specularColor = specular * specCol;
  
  //Final Color
  outColor = vec4(clamp(diffuse + ambient + emitColor + specularColor, 0.0, 1.0), 1.0);
  }
