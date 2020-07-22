#version 300 es

precision mediump float;

in vec3 fsNormal;
in vec3 fsPosition;
out vec4 outColor;

uniform vec4 eyePos;


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
uniform sampler2D normalMap;
uniform sampler2D depthMap;
uniform bool enable_text;
uniform bool enable_pMap;
uniform bool enable_nMap;

//fog
in vec3 v_position;
uniform float fogNear;
uniform float fogFar;
uniform vec4 fogColor;
uniform bool enablefog;

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
	float LCosIn = cos(radians(L1_ConeOut*L1_ConeIn / 2.0));

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

  

  return blinnSpecular * specularType.x;
}

vec2 ParallaxMapping(vec2 texCoords, vec3 viewDir){
   float height =  texture(depthMap, texCoords).r;    
   vec2 p = viewDir.xy / viewDir.z * (height * 0.02);
  return texCoords - p;    
}

vec3 NormalMapping(vec3 fsPosition, vec2 fs_uv, vec3 nNormal){
  vec3 p_dx = dFdx(fsPosition);
  vec3 p_dy = dFdy(fsPosition);
  vec2 tc_dx = dFdx(fs_uv);
  vec2 tc_dy = dFdy(fs_uv);
  vec3 t = (tc_dy.y * p_dx - tc_dx.y * p_dy) /(tc_dx.x*tc_dy.y - tc_dy.x*tc_dx.y);
  t = normalize(t - nNormal * dot(nNormal, t));
  vec3 b = normalize(cross(nNormal,t));
  mat3 tbn = mat3(t, b, nNormal);
  vec3 color=vec3(texture(normalMap,fs_uv));
  nNormal=normalize((color*2.0)-1.0);
  nNormal=tbn*nNormal;
  return nNormal;
}


void main() {

  vec3 nNormal = normalize(fsNormal); /* normalizza sempre perche è bene farlo */
  vec3 eyedirVec = normalize(eyePos.xyz - fsPosition);
  vec3 texColor;
  vec2 pMap_uv;

  if(enable_text){
    if(enable_pMap){
      //Parallax Map Computation
      pMap_uv = ParallaxMapping(fs_uv, eyedirVec);
    }
    else pMap_uv = fs_uv;
    if(enable_nMap){
      //Normal Map Computation
      nNormal = NormalMapping(fsPosition,pMap_uv,nNormal);  
    }
    
    //Texture Color
    texColor = vec3(texture(u_texture, pMap_uv));
  }  
  

  vec3 lightPos = L1_Pos.xyz;
  
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
  vec4 final_color = vec4(clamp(diffuse + ambient + emitColor + specularColor, 0.0, 1.0), 1.0);

   if(enablefog){
      //evaluate the color of the output using linear model
      float fogDistance = length(v_position);
      float fogAmount = smoothstep(fogNear, fogFar, fogDistance);
      outColor=mix(final_color, fogColor, fogAmount);
      }
      else{
         outColor=final_color;
      }
  }
