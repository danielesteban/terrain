import { Color } from 'three';
import Chunk from '../renderables/chunk.js';

export default () => {
  if (!Chunk.material) {
    Chunk.setupMaterial();
  }
  const { uniforms: { colors: { value: colors } } } = Chunk.material;
  const dom = document.getElementById('colors');
  const aux = new Color();
  colors.forEach((color) => {
    const input = document.createElement('input');
    input.type = 'color';
    input.value = `#${aux.copy(color).convertLinearToSRGB().getHexString()}`;
    input.oninput = () => {
      color.copy(aux.set(input.value).convertSRGBToLinear());
    };
    dom.appendChild(input);
  });
};
