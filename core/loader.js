export default ({ editor, mesher, world }) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = mesher.width;
  canvas.height = mesher.depth;
  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
  }, false);
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
  }, false);
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.indexOf('image') === 0) {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        let x, y, width, height;
        if (image.width / image.height < mesher.width / mesher.depth) {
          width = canvas.width;
          height = image.height * width / image.width;
          x = 0;
          y = canvas.height * 0.5 - height * 0.5;
        } else {
          height = canvas.height;
          width = image.width * height / image.height;
          x = canvas.width * 0.5 - width * 0.5;
          y = 0;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, image.width, image.height, x, y, width, height);
        const { data: pixels } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        editor.texture.load(pixels);
        world.remesh();
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
      };
      image.src = url;
    }
  }, false);  
};
