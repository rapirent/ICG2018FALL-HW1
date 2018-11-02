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
    if (shaderScript.type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShaders(shading) {
  var fragmentShader = getShader(gl, shading + "fragmentShader");
  var vertexShader = getShader(gl, shading + "vertexShader");

  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
  }

  gl.useProgram(shaderProgram);
  gl.enable(gl.DEPTH_TEST);
  return shaderProgram
}

function createLocations(selectedProgram) {

  selectedProgram.vertexPositionAttribute = gl.getAttribLocation(selectedProgram, "aVertexPosition");
  gl.enableVertexAttribArray(selectedProgram.vertexPositionAttribute);

  selectedProgram.vertexFrontColorAttribute = gl.getAttribLocation(selectedProgram, "aFrontColor");
  gl.enableVertexAttribArray(selectedProgram.vertexFrontColorAttribute);

  selectedProgram.vertexNormalAttribute = gl.getAttribLocation(selectedProgram, "aVertexNormal");
  gl.enableVertexAttribArray(selectedProgram.vertexNormalAttribute);

  selectedProgram.textureCoordAttribute = gl.getAttribLocation(selectedProgram, "aTextureCoord");
  gl.enableVertexAttribArray(selectedProgram.textureCoordAttribute);

  selectedProgram.pMatrixUniform = gl.getUniformLocation(selectedProgram, "uPMatrix");
  selectedProgram.mvMatrixUniform = gl.getUniformLocation(selectedProgram, "uMVMatrix");
  selectedProgram.samplerUniform = gl.getUniformLocation(selectedProgram, "uSampler");
  selectedProgram.lightPosition = gl.getUniformLocation(selectedProgram, "lightPosition");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(selectedProgram, "uNMatrix");
  //對應到ICG課本上的materialAmbient
  selectedProgram.ambientWeight = gl.getUniformLocation(selectedProgram, "uAmbientWeight");
  selectedProgram.diffuseWeight = gl.getUniformLocation(selectedProgram, "uDiffuseWeight");
  selectedProgram.specularWeight = gl.getUniformLocation(selectedProgram, "uSpecularWeight");

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

  var vertexFrontColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexFrontColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(loadedData.vertexFrontColors), gl.STATIC_DRAW);
  vertexFrontColorBuffer.itemSize = 3;
  vertexFrontColorBuffer.numItems = loadedData.vertexFrontColors.length / 3;


  return {
    normal: normalBuffer,
    textureCoord: textureCoordBuffer,
    position: positionBuffer,
    index: indexBuffer,
    frontColor: vertexFrontColorBuffer
  };
}

var teapotAngle = 180;
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
function updateMVMatrix() {
  mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
  mat4.identity(mvMatrix);
  mat4.translate(mvMatrix, mvMatrix, [0, 0, -40]);
  mat4.rotate(mvMatrix, mvMatrix, -degToRad(teapotAngle), [0, 1, 0]);
}
function updateAttributesAndUniforms(selectedProgram, buffers, texture) {
  createLocations(selectedProgram)
  if (!buffers ||
    buffers.position == null ||
    buffers.normal == null ||
    buffers.textureCoord == null ||
    buffers.index == null||
    buffers.frontColor == null
  ) {
    console.log(buffers)
    return;
  }
  //TODO
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  updateMVMatrix();
  //console.log(mvMatrix)

  gl.uniform1i(selectedProgram.samplerUniform, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(selectedProgram.vertexPositionAttribute, buffers.position.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  gl.vertexAttribPointer(selectedProgram.vertexNormalAttribute, buffers.normal.itemSize, gl.FLOAT, false, 0, 0)

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.frontColor);
  gl.vertexAttribPointer(selectedProgram.vertexFrontColor, buffers.frontColor.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
  gl.vertexAttribPointer(selectedProgram.textureCoordAttribute, buffers.textureCoord.itemSize, gl.FLOAT, false, 0, 0);

  gl.uniform4f(selectedProgram.ambientWeight, 1.0, 0.0, 1.0, 1.0 );
  gl.uniform4f(selectedProgram.diffuseWeight, 128/256,205/256,26/256, 1.0 );
  gl.uniform4f(selectedProgram.specularWeight, 1.0, 0.8, 0.0, 1.0 );
  gl.uniform4f(selectedProgram.ambient, 0.2, 0.2, 0.2, 1.0 );
  gl.uniform4f(selectedProgram.diffuse, 0.5, 0.5, 0.5, 1.0 );
  gl.uniform4f(selectedProgram.specular, 1.0, 1.0, 1.0, 1.0 );
  gl.uniform4f(selectedProgram.lightPosition, 1.0, 2.0, 3.0, 0.0 );
  gl.uniform1f(selectedProgram.shininess, 100.0 );

  gl.uniformMatrix4fv(selectedProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(selectedProgram.mvMatrixUniform, false, mvMatrix);
  //課本6.8.3 N = (M^T)^(-1)
  var normalMatrix = mat3.create();
  mat4.toInverseMat3(mvMatrix, normalMatrix);
  mat3.transpose(normalMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
  //gl.drawElements(gl.TRIANGLES, teapotVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);
  gl.drawElements(gl.TRIANGLES, buffers.index.numItems, gl.UNSIGNED_SHORT, 0);

}

function handleLoadedTexture(texture) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.bindTexture(gl.TEXTURE_2D, null);
  console.log('fuck')
}

function initTextures(url) {
  var texture = gl.createTexture();
  texture.image = new Image();
  texture.image.onload = function () {
      handleLoadedTexture(texture)
  }
  texture.image.src = url;
  return texture
}


var lastTime = 0;
function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;
        teapotAngle += 0.03 * elapsed;
    }
    lastTime = timeNow;
}

function tick(selectedProgram,buffers,texture) {
    requestAnimationFrame(function(){
      tick(selectedProgram,buffers,texture)
    });
    setViewPort();
    updateAttributesAndUniforms(selectedProgram,buffers,texture);
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

window.onload = function webGLStart() {
    // initTextures();
  initGL(document.getElementById("canvas"));
  function start(){
    return new Promise(function(resolve, reject) {
      var loadedData;
      $.get( "data/mig27.tri.json", function( data ) {
        loadedData = $.parseJSON(JSON.stringify(data))
      }).done(function(){
        resolve(loadedData);
      })
    })
  }
  async function then() {
    var data = await start();
    var selectedProgram = initShaders('flat-');
    var texture = initTextures('galvanizedTexture.jpg')
    console.log(texture)
    var buffers = createBuffers(data);
    gl.clearColor(0.8, 0.5, 0.2, 1.0);
    tick(selectedProgram,buffers,texture)
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
