import {
  BufferGeometry,
  InterleavedBuffer,
  InterleavedBufferAttribute,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const downloader = document.getElementById('downloader');
const exporter = new GLTFExporter();
const uvoffset = [{ x: 0.5, y: -0.5 }, { x: -0.5, y: -0.5 }, { x: -0.5, y: 0.5 }, { x: 0.5, y: 0.5 }];

export default ({ world }) => {
  const {
    aoEnabled,
    aoIntensity,
    colors: { value: colors },
    colorsEnabled,
    colorMapSize: { value: colorMapSize },
  } = world.material.uniforms;
  const material = new MeshStandardMaterial({
    map: world.maps.color,
    vertexColors: true,
  });
  document.getElementById('gltf').addEventListener('click', () => {
    exporter.parse(
      world.chunks.reduce((chunks, subchunks) => {
        subchunks.forEach(({ colorMapOffset, geometry, position, visible }) => {
          if (!visible) return;
          const { data: { array, count } } = geometry.getAttribute('position');
          const vertices = new InterleavedBuffer(new Float32Array(count * 8), 8);
          for (let i = 0, j = 0, l = count * 4; i < l; i += 4, j += 8) {
            const data = array[i + 3];
            const ao = (data & 0xF) * aoIntensity.value;
            const corner = data >> 4;
            let r, g, b;
            r = g = b = (aoEnabled.value ? (1 - ao) : 1);
            if (colorsEnabled.value) {
              const colorStep = (array[i + 1] + colorMapOffset.y) / colorMapSize.y * 5;
              const colorA = colors[Math.floor(colorStep)];
              const colorB = colors[Math.ceil(colorStep)];
              const mix = colorStep % 1;
              r *= (colorA.r * (1 - mix) + colorB.r * mix);
              g *= (colorA.g * (1 - mix) + colorB.g * mix);
              b *= (colorA.b * (1 - mix) + colorB.b * mix);
            }
            vertices.set([
              array[i],
              array[i + 1],
              array[i + 2],
              r,
              g,
              b,
              (array[i] + colorMapOffset.x + uvoffset[corner].x) / colorMapSize.x,
              (array[i + 2] + colorMapOffset.z + uvoffset[corner].y) / colorMapSize.z,
            ], j);
          }
          const chunk = new Mesh(new BufferGeometry(), material);
          chunk.geometry.setIndex(geometry.getIndex());
          chunk.geometry.setAttribute('position', new InterleavedBufferAttribute(vertices, 3, 0));
          chunk.geometry.setAttribute('color', new InterleavedBufferAttribute(vertices, 3, 3));
          chunk.geometry.setAttribute('uv', new InterleavedBufferAttribute(vertices, 2, 6));
          chunk.position.copy(position);
          chunks.push(chunk);
        });
        return chunks;
      }, []),
      (buffer) => {
        downloader.href = URL.createObjectURL(new Blob([buffer]));
        downloader.click();
      },
      { binary: true }
    );
  }, false);
};
