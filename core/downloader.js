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
    exporter.parse(
      world.chunks.reduce((chunks, subchunks) => {
        subchunks.forEach(({ geometry, position, visible }) => {
          if (!visible) return;
          const { data: { array, count } } = geometry.getAttribute('position');
          const chunk = new Mesh(new BufferGeometry(), material);
          const vertices = new InterleavedBuffer(new Float32Array(count * 6), 6);
          for (let i = 0, j = 0, l = count * 4; i < l; i += 4, j += 6) {
            const ao = array[i + 3] / 0xFF;
            vertices.set([
              array[i],
              array[i + 1],
              array[i + 2],
              1.0 - ao,
              1.0 - ao,
              1.0 - ao,
            ], j);
          }
          chunk.geometry.setIndex(geometry.getIndex());
          chunk.geometry.setAttribute('position', new InterleavedBufferAttribute(vertices, 3, 0));
          chunk.geometry.setAttribute('color', new InterleavedBufferAttribute(vertices, 3, 3));
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
    )
  ), false);
};
