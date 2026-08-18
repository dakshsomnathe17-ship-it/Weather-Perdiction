uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uSpecularMap;
uniform vec3 uSunDirection;
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 sunDir = normalize(uSunDirection);
  
  // Diffuse illumination with smooth twilight terminator
  float sunDot = dot(normal, sunDir);
  float dayFactor = smoothstep(-0.2, 0.25, sunDot);
  
  // Sample textures
  vec4 dayColor = texture2D(uDayTexture, vUv);
  vec4 nightColor = texture2D(uNightTexture, vUv);
  float specMask = texture2D(uSpecularMap, vUv).r;
  
  // Specular Blinn-Phong highlight on oceans
  vec3 halfVec = normalize(sunDir + viewDir);
  float specDot = max(0.0, dot(normal, halfVec));
  float specular = pow(specDot, 24.0) * specMask * smoothstep(0.0, 0.4, sunDot);
  
  // Night lights: boost city lights on dark hemisphere
  vec3 nightLights = nightColor.rgb * 1.6 * (1.0 - dayFactor);
  
  // Daylight color with ocean reflection
  vec3 dayLit = dayColor.rgb * max(0.05, dayFactor) + vec3(1.0, 0.95, 0.85) * (specular * 0.85);
  
  // Atmospheric Rayleigh limb glow on the day side
  float rim = 1.0 - max(0.0, dot(normal, viewDir));
  float atmosphereGlow = pow(rim, 3.5) * max(0.0, sunDot) * 0.6;
  vec3 atmoColor = vec3(0.3, 0.65, 1.0) * atmosphereGlow;
  
  // Final composited Earth surface color
  vec3 finalColor = mix(nightLights, dayLit, dayFactor) + atmoColor;
  
  gl_FragColor = vec4(finalColor, 1.0);
}
