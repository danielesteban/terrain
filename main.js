import SetupColorsUI from './core/colors.js';
import SetupExporter from './core/exporter.js';
import SetupImporter from './core/importer.js';
import Renderer from './core/renderer.js';
import World from './core/world.js';
import Editor from './scenes/editor.js';
import Viewer from './scenes/viewer.js';

const params = location.search.substr(1).split('&').reduce((keys, param) => {
  const [key, val] = param.split('=');
  keys[key] = parseInt(val, 10) || 0;
  return keys;
}, {});

const world = new World({
  width: params.width || 640,
  height: params.height || 255,
  depth: params.depth || params.width || 640,
  onLoad: () => {
    const renderer = new Renderer();
    const viewer = new Viewer({ renderer, world });
    const editor = new Editor({ world });
    renderer.views.push(viewer);
    renderer.views.push(editor);

    SetupColorsUI({ world });
    document.getElementById('smooth').addEventListener('click', () => {
      editor.maps.blur();
      world.remesh();
    }, false);
    SetupExporter({ world });
    SetupImporter({ editor, world });
  },
});
