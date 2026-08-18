uniform vec3 uSunDirection;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  
  // Smooth fresnel glow on outer rim
  float vDotN = dot(normal, viewDir);
  float fresnel = clamp(1.0 - abs(vDotN), 0.0, 1.0);
  float intensity = pow(fresnel, 3.2);
  
  // Sunlight orientation modulation
  float sunDot = max(0.15, dot(normal, normalize(uSunDirection)));
  vec3 atmosphereColor = mix(vec3(0.15, 0.45, 0.95), vec3(0.4, 0.8, 1.0), sunDot);
  
  gl_FragColor = vec4(atmosphereColor, intensity * 0.65);
}
