class AuroraShader {
  constructor(canvasId) {
    this.container = document.getElementById(canvasId);
    if (!this.container) return;

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });

    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.initShader();
    this.bindEvents();
    this.animate();
  }

  initShader() {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float iTime;
      uniform vec2 iResolution;
      varying vec2 vUv;

      #define NUM_OCTAVES 3

      float rand(vec2 n) {
        return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 ip = floor(p);
        vec2 u = fract(p);
        u = u * u * (3.0 - 2.0 * u);
        
        float res = mix(
          mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
          mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x),
          u.y
        );
        return res * res;
      }

      float fbm(vec2 x) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100);
        // Rotate to reduce axial bias
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for (int i = 0; i < NUM_OCTAVES; ++i) {
          v += a * noise(x);
          x = rot * x * 2.0 + shift;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        // Normalize coords with aspect ratio correction
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        // Make 'p' center-relative and scaled
        vec2 p = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
        
        // Background base color (deep cosmic void)
        vec3 color = vec3(0.03, 0.01, 0.08);

        // Aurora loop
        for (float i = 1.0; i < 4.0; i++) {
          // Dynamic movement
          float t = iTime * 0.2 + i;
          vec2 pos = p;
          
          // Distort position with noise
          pos.x += 0.3 * sin(pos.y * 2.0 + t);
          pos.y += 0.4 * cos(pos.x * 1.5 + t * 0.5);
          
          // FBM noise value
          float n = fbm(pos * 3.0 + vec2(t * 0.5, 0.0));
          
          // Determine aurora 'band' intensity
          // Using smoothstep to create wispy lines
          float intensity = smoothstep(0.3, 0.6, n) * smoothstep(0.7, 0.4, n);
          
          // Color palette for this layer
          // Mixing Purple (Neural) and Cyan (Quantum) from brand
          vec3 auroraColor = mix(
            vec3(0.45, 0.25, 0.95), // Rich Neural Purple
            vec3(0.35, 0.2, 0.85),  // Deep Violet
            sin(t * 0.5) * 0.3 + 0.3
          );
          
          // Additive blending
          color += auroraColor * intensity * 0.5;
        }
        
        // Vignette
        float vignette = 1.0 - length(vUv - 0.5) * 1.0;
        color *= vignette;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    this.uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2(this.container.offsetWidth, this.container.offsetHeight) }
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      if (!this.container) return;
      this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
      this.uniforms.iResolution.value.set(this.container.offsetWidth, this.container.offsetHeight);
    });
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.uniforms.iTime.value += 0.005; // Adjust speed
    this.renderer.render(this.scene, this.camera);
  }
}
