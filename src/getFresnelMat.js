import * as THREE from "three";

// Hàm tạo vật liệu Fresnel
function getFresnelMat({ rimHex = 0x0088ff, facingHex = 0x000000 } = {}) {
  // Tạo các biến toàn cục (uniforms) để sử dụng trong shader
  const uniforms = {
    color1: { value: new THREE.Color(rimHex) }, // Màu sắc của phần highlight (phản chiếu)
    color2: { value: new THREE.Color(facingHex) }, // Màu sắc nền của vật liệu
    fresnelBias: { value: 0.1 }, // Độ lệch cho hiệu ứng Fresnel
    fresnelScale: { value: 1.0 }, // Độ mở rộng cho hiệu ứng Fresnel
    fresnelPower: { value: 4.0 }, // Cường độ của hiệu ứng Fresnel
  };

  // Vertex shader (viết bằng ngôn ngữ GLSL)
  const vs = `
    uniform float fresnelBias;
    uniform float fresnelScale;
    uniform float fresnelPower;

    varying float vReflectionFactor; // Biến truyền giá trị phản xạ đến fragment shader

    void main() {
      // Tính toán vị trí của đỉnh trong không gian model, world, và clip
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);

      // Tính toán vector pháp tuyến tại đỉnh
      vec3 worldNormal = normalize(mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * normal);

      // Tính toán vector từ đỉnh đến camera
      vec3 I = worldPosition.xyz - cameraPosition;

      // Tính toán hệ số phản xạ Fresnel dựa trên góc nhìn và vector pháp tuyến
      vReflectionFactor = fresnelBias + fresnelScale * pow(1.0 + dot(normalize(I), worldNormal), fresnelPower);

      // Thiết lập vị trí cuối cùng của đỉnh trong không gian clip
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  // Fragment shader (viết bằng ngôn ngữ GLSL)
  const fs = `
    uniform vec3 color1;
    uniform vec3 color2;

    varying float vReflectionFactor;

    void main() {
      // Giới hạn giá trị phản xạ trong khoảng 0.0 đến 1.0
      float f = clamp(vReflectionFactor, 0.0, 1.0);

      // Trộn màu nền và màu highlight dựa trên hệ số phản xạ
      gl_FragColor = vec4(mix(color2, color1, vec3(f)), f);
    }
  `;

  // Tạo vật liệu ShaderMaterial
  const fresnelMat = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vs,
    fragmentShader: fs,
    transparent: true, // Cho phép trong suốt
    blending: THREE.AdditiveBlending, // Kết hợp màu sắc theo kiểu cộng
    // wireframe: true, // Hiển thị khung dây (để debug)
  });

  // Trả về vật liệu Fresnel
  return fresnelMat;
}

export { getFresnelMat };