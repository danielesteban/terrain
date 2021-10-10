import SetupColorsUI from './core/colors.js';
import SetupExporter from './core/exporter.js';
import SetupImporter from './core/importer.js';
import Mesher from './core/mesher/index.js';
import Renderer from './core/renderer.js';
import Editor from './scenes/editor.js';
import World from './scenes/world.js';

const mesher = new Mesher({
  width: 640,
  height: 255,
  depth: 640,
  onLoad: () => {
    const renderer = new Renderer({
      fps: document.getElementById('fps'),
      renderer: document.getElementById('renderer'),
    });
    const world = new World({ mesher, renderer });
    const editor = new Editor({ renderer, world });
    renderer.views.push(world);
    renderer.views.push(editor);
    renderer.onResize();

    SetupColorsUI();
    SetupExporter({ world });
    SetupImporter({ editor, world });
    document.getElementById('smooth').addEventListener('click', () => {
      editor.maps.blur();
      world.remesh();
    }, false);
  },
});
