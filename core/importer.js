export default ({ editor, world }) => {
  const load = (file) => {
    if (!file || file.type.indexOf('image') !== 0) {
      return;
    }
    const url = URL.createObjectURL(file);
    world
      .load({
        map: ['colorRGB', 'heightRGB', 'colorRGBheightRGB'][editor.maps.material.uniforms.display.value],
        url,
      })
      .catch(() => {})
      .finally(() => (
        URL.revokeObjectURL(url)
      ));
  };
  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
  }, false);
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  }, false);
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    load(e.dataTransfer.files[0]);
  }, false);
  const loader = document.getElementById('loader');
  loader.onchange = () => {
    load(loader.files[0]);
    loader.value = null;
  };
  document.getElementById('browse').addEventListener('click', () => loader.click(), false);
};
