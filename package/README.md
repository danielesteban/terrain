[three-terrain](https://terrain.gatunes.com/)
==

[![screenshot](screenshot.png)](https://terrain.gatunes.com/)

> A fast heightmap based voxelizer

#### Installation

```bash
npm install three-terrain
```

#### Usage

```js
import { Scene } from 'three';
import Terrain from 'three-terrain';

const terrain = new Terrain({
  width: 640,
  height: 255,
  depth: 640,
  maps: {
    colorRGBheightAlpha: '/terrain.png',
    /*
      colorRGB: colormap from image RGB
      colorRGBheightAlpha: colormap from image RGB + heightmap from alpha channel
      colorRGBheightRGB: colormap from RGB + heightmap from RGB grayscale
      heightAlpha: heightmap from image alpha channel
      heightR: heightmap from image red channel
      heightRGB: heightmap from image RGB grayscale
    */
  },
});

const scene = new Scene();
scene.add(terrain);

```
