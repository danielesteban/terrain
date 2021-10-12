import SetupColorsUI from './core/colors.js';
import SetupExporter from './core/exporter.js';
import SetupImporter from './core/importer.js';
import Renderer from './core/renderer.js';
import World from './core/world.js';
import Editor from './scenes/editor.js';
import Viewer from './scenes/viewer.js';

const world = new World({
  width: 640,
  height: 255,
  depth: 640,
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
