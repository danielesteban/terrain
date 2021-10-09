import {
  BufferGeometry,
  InterleavedBuffer,
  InterleavedBufferAttribute,
  Mesh,
  MeshBasicMaterial,
} from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const downloader = document.getElementById('downloader');
const exporter = new GLTFExporter();
const uvoffset = [{ x: 0.5, y: -0.5 }, { x: -0.5, y: -0.5 }, { x: -0.5, y: 0.5 }, { x: 0.5, y: 0.5 }];

export default ({ world }) => {
  const material = new MeshBasicMaterial({
    map: world.maps.color,
    vertexColors: true,
  });
  const colors = world.chunks[0][0].material.uniforms.colors.value;
  const origin = world.chunks[0][0].position;
  document.getElementById('gltf').addEventListener('click', () => {
    exporter.parse(
      world.chunks.reduce((chunks, subchunks) => {
        subchunks.forEach(({ geometry, position, visible }) => {
          if (!visible) return;
          const { data: { array, count } } = geometry.getAttribute('position');
          const chunk = new Mesh(new BufferGeometry(), material);
          const vertices = new InterleavedBuffer(new Float32Array(count * 8), 8);
          for (let i = 0, j = 0, l = count * 4; i < l; i += 4, j += 8) {
            const data = array[i + 3];
            const corner = data >> 4;
            const ao = (data & 0xF) * 0.06;
            const colorStep = (position.y + array[i + 1]) / (world.mesher.height + 1.0) * 5.0;
            const colorA = colors[Math.floor(colorStep)];
            const colorB = colors[Math.ceil(colorStep)];
            const mix = colorStep % 1;
            vertices.set([
              array[i],
              array[i + 1],
              array[i + 2],
              (colorA.r * (1 - mix) + colorB.r * mix) * (1 - ao),
              (colorA.g * (1 - mix) + colorB.g * mix) * (1 - ao),
              (colorA.b * (1 - mix) + colorB.b * mix) * (1 - ao),
              (position.x + array[i] - origin.x + uvoffset[corner].x) / world.mesher.width,
              1 - ((position.z + array[i + 2] - origin.z + uvoffset[corner].y) / world.mesher.depth),
            ], j);
          }
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
