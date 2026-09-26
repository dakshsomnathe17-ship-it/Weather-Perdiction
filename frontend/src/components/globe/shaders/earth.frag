uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uSpecularMap;
uniform vec3 uSunDirection;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 sunDir = normalize(uSunDirection);
  
  // Diffuse illumination with smooth twilight terminator
  float sunDot = dot(normal, sunDir);
  float dayFactor = smoothstep(-0.08, 0.16, sunDot);
  
  // Sample textures
  vec4 dayColor = texture2D(uDayTexture, vUv);
  vec4 nightColor = texture2D(uNightTexture, vUv);
  float specMask = texture2D(uSpecularMap, vUv).r;
  
  // Specular Blinn-Phong highlight on oceans
  vec3 halfVec = normalize(sunDir + viewDir);
  float specDot = max(0.0, dot(normal, halfVec));
  float specular = pow(specDot, 64.0) * specMask * smoothstep(0.0, 0.25, sunDot);
  
  // Night lights: boost city lights on dark hemisphere
  vec3 nightLights = nightColor.rgb * vec3(1.7, 1.2, 0.65) * (1.0 - dayFactor);
  
  // Daylight color with ocean reflection
  vec3 dayLit = dayColor.rgb * (0.035 + 1.25 * max(sunDot, 0.0))
    + vec3(1.0, 0.92, 0.8) * specular * 0.65;
  
  // Atmospheric Rayleigh limb glow on the day side
  float rim = 1.0 - max(0.0, dot(normal, viewDir));
  float atmosphereGlow = pow(rim, 3.5) * max(0.0, sunDot) * 0.6;
  vec3 atmoColor = vec3(0.3, 0.65, 1.0) * atmosphereGlow;
  
  // Final composited Earth surface color
  vec3 finalColor = dayLit + nightLights + atmoColor;
  
  gl_FragColor = vec4(finalColor, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
