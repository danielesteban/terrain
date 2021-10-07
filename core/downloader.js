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
const material = new MeshStandardMaterial({ vertexColors: true });

export default ({ world }) => {
  document.getElementById('gltf').addEventListener('click', () => (
    exporter.parse(world.chunks.map(({ geometry, position }) => {
      const chunk = new Mesh(new BufferGeometry(), material);
      const vertices = new InterleavedBuffer(new Float32Array(geometry.getAttribute('position').data.array), 6);
      for (let i = 0; i < vertices.count * 6; i += 6) {
        vertices.set([
          vertices.array[i + 3] / 0xFF,
          vertices.array[i + 4] / 0xFF,
          vertices.array[i + 5] / 0xFF,
        ], i + 3);
      }
      chunk.geometry.setIndex(geometry.getIndex());
      chunk.geometry.setAttribute('position', new InterleavedBufferAttribute(vertices, 3, 0));
      chunk.geometry.setAttribute('color', new InterleavedBufferAttribute(vertices, 3, 3));
      chunk.position.copy(position);
      return chunk;
    }), (buffer) => {
      downloader.href = URL.createObjectURL(new Blob([buffer]));
      downloader.click();
    }, {
      binary: true,
    })
  ), false);
};
