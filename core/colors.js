import { Color } from 'three';
import Chunk from '../renderables/chunk.js';

export default () => {
  if (!Chunk.material) {
    Chunk.setupMaterial();
  }
  const { uniforms: { colors: { value: colors }, colorsEnabled } } = Chunk.material;
  const dom = document.getElementById('colors');
  {
    const input = document.createElement('input');
    input.style.marginRight = '0.5rem';
    input.type = 'checkbox';
    input.checked = colorsEnabled.value;
    input.onchange = () => {
      colorsEnabled.value = input.checked;
    };
    dom.appendChild(input);
  }
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
