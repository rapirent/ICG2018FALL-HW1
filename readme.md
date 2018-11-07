# IICG2018FALL-HW1

計算機圖學 - HW1

使用 WebGL 與 GLSL 實作各種著色法, 物體操縱與視角操作 (仿射變換)

共實作七種著色法: `flat`, `gouraud`, `phong`, `blinn-phong`, `spherical enviorment(phong and gouraud)`, `cel`

## How to Use

- browse the [website](https://rapirent.github.io/ICG2018FALL-HW1/) of this repo

- or you can clone this repo on your local machine, and open the localhost by python, nodejs or somewhat
```sh
$ python3 -m http.server 5000
```
- view your [localhost port](http://localhost:5000/)

### control table

- `ws` for y axis translate
- `ad` for x axis translate
- `qz` for z axis translate
- `ec` for x axis shear
- `rt` for x axis scaling
- `fg` for y axis scaling
- `vb` for z axis scaling
- `{}` for scaling
- mouse for rotate
- `enter` key for start/stop animate rotate

### then?

- enjoy yourself!

## Reference

- https://www.opengl.org/discussion_boards/showthread.php/172305-Fail-to-initialise-shaders
- https://stackoverflow.com/questions/19722247/webgl-wait-for-texture-to-load/19748905#19748905
- http://mikemurko.com/general/jquery-keycode-cheatsheet/
- https://css-tricks.com/snippets/javascript/javascript-keycodes/
- https://www.clicktorelease.com/code/spherical-environment-mapping/
- http://in2gpu.com/2014/06/23/toon-shading-effect-and-simple-contour-detection/
- https://github.com/aakshayy/toonshader-webgl
- https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html

# LICENSE
Kuoteng, Ding @ MIT, 2018
