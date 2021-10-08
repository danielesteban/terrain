import SetupColorsUI from './core/colors.js';
import SetupDownloader from './core/downloader.js';
import SetupImageDrop from './core/loader.js';
import Mesher from './core/mesher.js';
import Renderer from './core/renderer.js';
import Editor from './scenes/editor.js';
import World from './scenes/world.js';

const renderer = new Renderer({
  fps: document.getElementById('fps'),
  renderer: document.getElementById('renderer'),
});

const mesher = new Mesher({
  width: 640,
  height: 255,
  depth: 640,
  chunkSize: 32,
  onLoad: () => {
    const world = new World({ mesher, renderer });
    const editor = new Editor({ mesher, renderer, world });
    renderer.views.push(world);
    renderer.views.push(editor);
    renderer.onResize();

    SetupColorsUI();
    SetupDownloader({ world });
    SetupImageDrop({ editor, mesher, world });
    document.getElementById('smooth').addEventListener('click', () => {
      editor.texture.blur();
      world.remesh();
    }, false);
  },
});
