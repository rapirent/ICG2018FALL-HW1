"use strict";
var gl;

var near = -10;
var far = 10;
var radius = 1.5;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var left = -3.0;
var right = 3.0;
var ytop =3.0;
var bottom = -3.0;
var eye;
var at = vec3.fromValues(0.0, 0.0, 0.0);
var up = vec3.fromValues(0.0, 1.0, 0.0);

var transFactors = [{
    xFactor: -40,
    yFactor: 0,
    zFactor: -100,
  },{
    xFactor: 0,
    yFactor: 0,
    zFactor: -60,
  },{
    xFactor: 40,
    yFactor: 0,
    zFactor: -100,
}]
var shearFactor = [{
  xFactor: 0,
  yFactor: 0,
  zFactor: 0,
},{
  xFactor: 0,
  yFactor: 0,
  zFactor: 0,
},{
  xFactor: 0,
  yFactor: 0,
  zFactor: 0,
}]
var animateSetting = {
  xSpeed: 0,
  ySpeed: 1,
  xAngle: 0,
  yAngle: 180
}
var scale = {

}
function initGL(canvas) {
  try {
    gl = canvas.getContext("webgl") || canvas.getContext('experimental-webgl');
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    if(!gl.getExtension('OES_standard_derivatives')) {
      console.log('can not open extension')
      throw 'extension not support';
    }
  }catch(e) {
    alert(e)
  }
  if(!gl) {
    console.log(gl);
    alert("Could not initialise WebGL, sorry :-(");
  }
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        alert("can't find shader script")
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;

    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        console.log(shaderScript,type)
        alert("can't find shader type")
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log('create shader fail')
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShaders(shading) {
  console.log('loading shading...' + shading)
  var fragmentShader = getShader(gl, shading + "fragmentShader");
  var vertexShader = getShader(gl, shading + "vertexShader");
  var shaderProgram = gl.createProgram();

  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  // console.log(vertexShader,fragmentShader,shaderProgram)
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log(vertexShader,fragmentShader,shaderProgram)
    console.log(gl.getProgramInfoLog(shaderProgram))
      alert("Could not initialize shaders");
  }

  gl.useProgram(shaderProgram);
  gl.enable(gl.DEPTH_TEST);
  createLocations(shaderProgram);

  return shaderProgram
}

function createLocations(selectedProgram) {
  gl.useProgram(selectedProgram);
  selectedProgram.vertexPositionAttribute = gl.getAttribLocation(selectedProgram, "aVertexPosition");
  if (selectedProgram.vertexPositionAttribute >= 0) {
    gl.enableVertexAttribArray(selectedProgram.vertexPositionAttribute);
  }

  selectedProgram.vertexFrontColorAttribute = gl.getAttribLocation(selectedProgram, "aFrontColor");
  if (selectedProgram.vertexFrontColorAttribute >= 0) {
    gl.enableVertexAttribArray(selectedProgram.vertexFrontColorAttribute);
  }

  selectedProgram.vertexNormalAttribute = gl.getAttribLocation(selectedProgram, "aVertexNormal");
  if (selectedProgram.vertexNormalAttribute >= 0) {
    gl.enableVertexAttribArray(selectedProgram.vertexNormalAttribute);
  }

  selectedProgram.textureCoordAttribute = gl.getAttribLocation(selectedProgram, "aTextureCoord");
  gl.enableVertexAttribArray(selectedProgram.textureCoordAttribute);

  selectedProgram.pMatrixUniform = gl.getUniformLocation(selectedProgram, "uPMatrix");
  selectedProgram.mvMatrixUniform = gl.getUniformLocation(selectedProgram, "uMVMatrix");
  selectedProgram.samplerUniform = gl.getUniformLocation(selectedProgram, "uSampler");
  selectedProgram.lightPosition = gl.getUniformLocation(selectedProgram, "lightPosition");
  selectedProgram.nMatrixUniform = gl.getUniformLocation(selectedProgram, "uNMatrix");
  //對應到ICG課本上的materialAmbient
  selectedProgram.materialAmbient = gl.getUniformLocation(selectedProgram, "uMaterialAmbient");
  selectedProgram.materialDiffuse = gl.getUniformLocation(selectedProgram, "uMaterialDiffuse");
  selectedProgram.materialSpecular = gl.getUniformLocation(selectedProgram, "uMaterialSpecular");
  //light
  selectedProgram.ambient = gl.getUniformLocation(selectedProgram, "uAmbient");
  selectedProgram.diffuse = gl.getUniformLocation(selectedProgram, "uDiffuse");
  selectedProgram.specular = gl.getUniformLocation(selectedProgram, "uSpecular");
  // for specular
  selectedProgram.shininess = gl.getUniformLocation(selectedProgram, "uShininess")
}
function createBuffers(loadedData) {
  var normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(loadedData.vertexNormals), gl.STATIC_DRAW);
  normalBuffer.itemSize = 3;
  normalBuffer.numItems = loadedData.vertexNormals.length / 3;

  var textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(loadedData.vertexTextureCoords), gl.STATIC_DRAW);
  textureCoordBuffer.itemSize = 2;
  textureCoordBuffer.numItems = loadedData.vertexTextureCoords.length / 2;

  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(loadedData.vertexPositions), gl.STATIC_DRAW);
  positionBuffer.itemSize = 3;
  positionBuffer.numItems = loadedData.vertexPositions.length / 3;

  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(loadedData.indices), gl.STATIC_DRAW);
  indexBuffer.itemSize = 1;
  indexBuffer.numItems = loadedData.indices.length;

  var vertexFrontColorBuffer = null;
  if (loadedData.vertexFrontColors) {
    vertexFrontColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexFrontColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(loadedData.vertexFrontColors), gl.STATIC_DRAW);
    vertexFrontColorBuffer.itemSize = 3;
    vertexFrontColorBuffer.numItems = loadedData.vertexFrontColors.length / 3;
  }


  return {
    normal: normalBuffer,
    textureCoord: textureCoordBuffer,
    position: positionBuffer,
    index: indexBuffer,
    frontColor: vertexFrontColorBuffer
  };
}
var mvMatrix = mat4.create();
var pMatrix = mat4.create();

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

function setViewPort() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}
//TODO
function updateMVMatrix(number) {
  mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);
  mat4.identity(mvMatrix);
  mat4.translate(mvMatrix, mvMatrix, [0, 0, -40]);
  // mat4.scale(mvMatrix, mvMatrix, [1,1,1]);

  mat4.translate(
    mvMatrix,
    mvMatrix,
    [transFactors[number].xFactor, transFactors[number].yFactor, transFactors[number].zFactor]
  )
  mat4.multiply(mvMatrix,mvMatrix,canvasRotationMatrix)
  var shearMatrix = mat4.create();
  mat4.identity(shearMatrix);
  shearMatrix[1] = shearFactor[number].xFactor;
  mat4.multiply(mvMatrix, mvMatrix, shearMatrix);
  mat4.rotateX(mvMatrix, mvMatrix, degToRad(animateSetting.xAngle))
  mat4.rotateY(mvMatrix, mvMatrix, degToRad(animateSetting.yAngle));
}
function updateAttributesAndUniforms(selectedProgram, buffers, texture,i) {
  gl.useProgram(selectedProgram);
  if (!buffers ||
    buffers.position == null ||
    buffers.normal == null ||
    buffers.textureCoord == null ||
    buffers.index == null
  ) {
    console.log(buffers)
    return;
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(selectedProgram.samplerUniform, 0);
  updateMVMatrix(i);
  //console.log(mvMatrix)

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(selectedProgram.vertexPositionAttribute, buffers.position.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  gl.vertexAttribPointer(selectedProgram.vertexNormalAttribute, buffers.normal.itemSize, gl.FLOAT, false, 0, 0)

  if (buffers.frontColor !== null) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.frontColor);
    gl.vertexAttribPointer(selectedProgram.vertexFrontColorAttribute, buffers.frontColor.itemSize, gl.FLOAT, false, 0, 0);
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
  gl.vertexAttribPointer(selectedProgram.textureCoordAttribute, buffers.textureCoord.itemSize, gl.FLOAT, false, 0, 0);

  gl.uniform3f(selectedProgram.materialAmbient, 0.2, 0.2, 0.2 );
  gl.uniform3f(selectedProgram.materialDiffuse, 0.8,0.8,0.8 );
  gl.uniform3f(selectedProgram.materialSpecular, 0.8, 0.8, 0.8 );
  gl.uniform3f(selectedProgram.ambient,
    Math.round(pickers.lightColorAmbient.rgb[0])/256,
    Math.round(pickers.lightColorAmbient.rgb[1])/256,
    Math.round(pickers.lightColorAmbient.rgb[2])/256
  );
  gl.uniform3f(selectedProgram.diffuse, 1, 1, 1 );
  gl.uniform3f(selectedProgram.specular, 1, 1, 1 );
  gl.uniform4f(selectedProgram.lightPosition, -10.0, 4.0, 20.0, 1.0 );


  // var lightLocationArray = [],lightEnabledArray = [];
  // for (var i = 0; i < 3; i++) {
  //   lightLocationArray.push();
  //   lightLocationArray.push(parseFloat(document.getElementById("lightPositionY-" + i).value));
  //   lightLocationArray.push(parseFloat(document.getElementById("lightPositionZ-" + i).value));
  //   lightEnabledArray.push(Boolean(document.getElementById('lightPoint-' + i + '-enable').checked) ? 1.0 : 0.0);
  // }
  gl.uniform1f(selectedProgram.shininess, 32.0 );
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
  //課本6.8.3 N = (M^T)^(-1)
  var normalMatrix = mat3.create()
  mat3.fromMat4(normalMatrix,mvMatrix)
  mat3.invert(normalMatrix,normalMatrix)
  mat3.transpose(normalMatrix,normalMatrix);
  gl.uniformMatrix3fv(selectedProgram.nMatrixUniform, false, normalMatrix);

  gl.uniformMatrix4fv(selectedProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(selectedProgram.mvMatrixUniform, false, mvMatrix);
  //gl.drawElements(gl.TRIANGLES, teapotVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  gl.drawElements(gl.TRIANGLES, buffers.index.numItems, gl.UNSIGNED_SHORT, 0);
}

function handleLoadedTexture(texture) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
};

function setupTextureFilteringAndMips(width, height) {
  if (isPowerOf2(width) && isPowerOf2(height)) {
    // the dimensions are power of 2 so generate mips and turn on
    // tri-linear filtering.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    // at least one of the dimensions is not a power of 2 so set the filtering
    // so WebGL will render it.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
}

function initTextures(url) {
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));
  var image = new Image();
  image.src = url;
  image.addEventListener('load', function() {
    // Now that the image has loaded make copy it to the texture.
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);

    // Check if the image is a power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
       gl.bindTexture(gl.TEXTURE_2D, texture);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  });
  return texture
}


var lastTime = 0;
async function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
      var elapsed = timeNow - lastTime;
      var tmp = await handelKeyEvent()
      if (startAnimate === true) {
        animateSetting.yAngle += 0.03*animateSetting.ySpeed * elapsed;
        animateSetting.xAngle += 0.03*animateSetting.xSpeed * elapsed;
      }
    }
    lastTime = timeNow;
}

function tick(shaders,buffersArray,texture) {
    requestAnimationFrame(function(){
      tick(shaders,buffersArray,texture)
    });
    setViewPort();
    updateAttributesAndUniforms(shaders.flatShader,buffersArray[0],texture,0);
    updateAttributesAndUniforms(shaders.gouraudShader,buffersArray[1],texture,1);
    updateAttributesAndUniforms(shaders.phongShader,buffersArray[2],texture,2);
    animate();
}

function loadFile(file_path) {
  var request = new XMLHttpRequest();
  request.open("GET", file_path, false);
  request.send(null);
  if (request.status === 200) {
      // console.log(request.responseText);
      return request.responseText;
  }
  return "";
}

function loadfile(url) {
  var loadedData;
  $.get( url, function( data ) {
    loadedData = $.parseJSON(JSON.stringify(data))
  }).done(function(){
    return loadedData
  })
}
var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;
var canvasRotationMatrix = mat4.create();
mat4.identity(canvasRotationMatrix)
function handleMouseDown(event) {
  mouseDown = true;
  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
}
function handleMouseUp(event) {
  mouseDown = false;
}
function handleMouseMove(event) {
  if (!mouseDown || !lastMouseX ||!lastMouseY) {
    return;
  }
  var newX = event.clientX;
  var newY = event.clientY;
  var newRotationMatrix = mat4.create();
  mat4.identity(newRotationMatrix);

  var deltaX = newX - lastMouseX;
  mat4.rotateX(newRotationMatrix, newRotationMatrix, degToRad(deltaX / 10));
  var deltaY = newY - lastMouseY;
  mat4.rotateY(newRotationMatrix, newRotationMatrix, degToRad(deltaY / 10));

  mat4.multiply(canvasRotationMatrix, newRotationMatrix, canvasRotationMatrix);
  lastMouseX = newX;
  lastMouseY = newY;
}
var currentlyPressedKeys = {};
var startAnimate = false;
function handleKeyDown(event) {
  currentlyPressedKeys[event.keyCode|| event.which] = true;
}
function handleKeyUp(event) {
  currentlyPressedKeys[event.keyCode|| event.which] = false;
}
async function handelKeyEvent(event) {
  return new Promise(function(resolve,reject) {
    if (currentlyPressedKeys[37]) {
      animateSetting.ySpeed -= 1;
    }
    if (currentlyPressedKeys[39]) {
      animateSetting.ySpeed += 1;
    }
    if (currentlyPressedKeys[38]) {
      animateSetting.xSpeed -= 1;
    }
    if (currentlyPressedKeys[40]) {
      animateSetting.xSpeed += 1;
    }
    resolve()
  })
}

window.onload = function webGLStart() {
    // initTextures();
  pickers.lightColorAmbient = new jscolor('lightColorAmbient-button', options);
  pickers.lightColorAmbient.onFineChange = "update('lightColorAmbient')";
  pickers.lightColorAmbient.fromString('AB2567');
  update('lightColorAmbient');
  var canvas = $('#canvas')
  initGL(canvas[0]);
  //keyboard
  $('#canvas')
    .on("mousedown", handleMouseDown)
    .on("mouseup", handleMouseUp)
    .on("mousemove", handleMouseMove)
  $(document)
    .on("keydown", handleKeyDown)
    .on("keyup", handleKeyUp)
    .on("keypress", function(event) {
      var pressKey = event.keyCode|| event.which;
      if (pressKey == 13) {
        startAnimate = !startAnimate;
      }
    })
  function start(url){
    return new Promise(function(resolve, reject) {
      var loadedData;
      $.get( url, function( data ) {
        loadedData = $.parseJSON(JSON.stringify(data))
      }).done(function(data){
        resolve(loadedData);
      })
    })
  }
  async function then() {
    var data1 = await start('data/Teapot.json'),
      data2 = await start('data/Teapot.json'),
      data3 = await start('data/Teapot.json');
    var datas = [data1,data2,data3];
    var texture = initTextures('galvanizedTexture.jpg')
    var shaders = {
      flatShader: initShaders('flat-'),
      gouraudShader: initShaders('gouraud-'),
      phongShader: initShaders('phong-')
    }
    var buffersArray = []
    if (datas != null) {
      for (var i =0; i<datas.length; i++) {
        buffersArray.push(createBuffers(datas[i]))
      }
    }
    gl.clearColor(0.0, 0.2, 0.2, 1.0);
    tick(shaders,buffersArray,texture)
  }
  then();

  // $.getJSON("Teapot.json", function(json){
  //   var buffers = createBuffers(json);
  // }).done(function(json){
  //   var selectedProgram = initShaders();
  //   gl.clearColor(0.8, 0.5, 0.2, 1.0);
  //   gl.enable(gl.DEPTH_TEST);

  //   tick(selectedProgram)
  // })
  //loadTeapot('data/mig27.tri.json')
}

var options = {
  valueElement: null,
  width: 300,
  height: 120,
  sliderSize: 20,
  position: 'top',
  borderColor: '#CCC',
  insetColor: '#CCC',
  backgroundColor: '#202020'
};

var pickers = {};

function update (id) {
  document.getElementById(id + '-rgb').value = pickers[id].toRGBString();
  document.getElementById(id + '-hex').value = pickers[id].toHEXString();
  document.getElementById(id + '-red').value = Math.round(pickers[id].rgb[0]);
  document.getElementById(id + '-grn').value = Math.round(pickers[id].rgb[1]);
  document.getElementById(id + '-blu').value = Math.round(pickers[id].rgb[2]);
}

function setHSV (id, h, s, v) {
  pickers[id].fromHSV(h, s, v);
  update(id);
}

function setRGB (id, r, g, b) {
  pickers[id].fromRGB(r, g, b);
  update(id);
}

function setString (id, str) {
  pickers[id].fromString(str);
  update(id);
}
function hexToRgbA(hex){
  var c;
  if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
      c= hex.substring(1).split('');
      if(c.length== 3){
          c= [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c= '0x'+c.join('');
      return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',1)';
  }
  throw new Error('Bad Hex');
}
