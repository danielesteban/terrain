import { Color } from 'three';
import Chunk from '../renderables/chunk.js';

export default () => {
  const { uniforms: { aoEnabled, colors: { value: colors }, colorsEnabled } } = Chunk.material;
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
  {
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.marginRight = '0.5rem';
    const input = document.createElement('input');
    input.style.marginLeft = '1rem';
    input.style.marginRight = '0.5rem';
    input.type = 'checkbox';
    input.checked = aoEnabled.value;
    input.onchange = () => {
      aoEnabled.value = input.checked;
    };
    label.appendChild(input);
    label.appendChild(document.createTextNode('AO'));
    dom.appendChild(label);
  }
};
