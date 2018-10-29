var gl;
var shaderProgram;
var lightAmbient = vec4.fromValues(0.2, 0.2, 0.2, 1.0)
var lightDiffuse = vec4.fromValues(1.0, 1.0, 1.0, 1.0)
var lightSpecular = vec4.fromValues(1.0, 1.0, 1.0, 1.0)
var lightPosition = vec4.fromValues(1.0, 2.0, 3.0, 0.0)
var materialAmbient = vec4.fromValues(1.0, 0.0, 1.0, 1.0)
var materialDiffuse = vec4.fromValues(1.0, 0.8, 0.0, 1.0)
var materialSpecular = vec4.fromValues(1.0, 0.8, 0.0, 1.0)
var materialShininess = 100.0
var emission = vec4.fromValues(0.0, 0.3, 0.3, 1.0)
var ambientProduct = vec4.create()
var diffuseProduct = vec4.create();
var specularProduct = vec4.create()

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
        gl = canvas.getContext("webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}


function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
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

function initShaders() {
    var fragmentShader = getShader(gl, "fragmentShader");
    var vertexShader = getShader(gl, "vertexShader");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal")
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute)

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    return shaderProgram
}


// function handleLoadedTexture(texture) {
//     gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
//     gl.bindTexture(gl.TEXTURE_2D, texture);
//     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
//     gl.generateMipmap(gl.TEXTURE_2D);

//     gl.bindTexture(gl.TEXTURE_2D, null);
// }

var galvanizedTexture;

// function initTextures() {
//     galvanizedTexture = gl.createTexture();
//     galvanizedTexture.image = new Image();
//     galvanizedTexture.image.onload = function () {
//         handleLoadedTexture(galvanizedTexture)
//     }
//     galvanizedTexture.image.src = "galvanizedTexture.jpg";
// }


var mvMatrix = mat4.create();
var pMatrix = mat4.create();


function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}


var teapotVertexPositionBuffer;
var teapotVertexNormalBuffer;
var teapotVertexTextureCoordBuffer;
var teapotVertexIndexBuffer;

function handleLoadedData(loadedData) {
    teapotVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(loadedData.vertexNormals), gl.STATIC_DRAW);
    teapotVertexNormalBuffer.itemSize = 3;
    teapotVertexNormalBuffer.numItems = loadedData.vertexNormals.length / 3;

    teapotVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(loadedData.vertexTextureCoords), gl.STATIC_DRAW);
    teapotVertexTextureCoordBuffer.itemSize = 2;
    teapotVertexTextureCoordBuffer.numItems = loadedData.vertexTextureCoords.length / 2;

    teapotVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(loadedData.vertexPositions), gl.STATIC_DRAW);
    teapotVertexPositionBuffer.itemSize = 3;
    teapotVertexPositionBuffer.numItems = loadedData.vertexPositions.length / 3;

    teapotVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(loadedData.indices), gl.STATIC_DRAW);
    teapotVertexIndexBuffer.itemSize = 1;
    teapotVertexIndexBuffer.numItems = loadedData.indices.length;
}


function loadData(data) {
    var request = new XMLHttpRequest();
    request.open("GET", data);
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            handleLoadedData(JSON.parse(request.responseText));
        }
    }
    request.send();
}


var teapotAngle = 180;


function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (teapotVertexPositionBuffer == null || teapotVertexNormalBuffer == null || teapotVertexTextureCoordBuffer == null || teapotVertexIndexBuffer == null) {
        return;
    }

    mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

    mat4.identity(mvMatrix);

    mat4.translate(mvMatrix, mvMatrix, [0, 0, -40]);
    mat4.rotate(mvMatrix, mvMatrix, -degToRad(teapotAngle), [0, 1, 0]);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, galvanizedTexture);

    gl.uniform1i(shaderProgram.samplerUniform, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, teapotVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, teapotVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, teapotVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, teapotVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
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


function tick() {
    requestAnimationFrame(tick);
    drawScene();
    animate();
}
function lookAt(eye, at, up) {
  if ( equal(eye, at) ) {
    return mat4();
  }

  var v = normalize( subtract(at, eye) );  // view direction vector
  var n = normalize( cross(v, up) );       // perpendicular vector
  var u = normalize( cross(n, v) );        // "new" up vector

  v = negate( v );

  var result = mat4(
      vec4( n, -dot(n, eye) ),
      vec4( u, -dot(u, eye) ),
      vec4( v, -dot(v, eye) ),
      vec4()
  );
}

window.onload = function webGLStart() {
    var canvas = document.getElementById("canvas");
    initGL(canvas);
    shaderProgram = initShaders();
    // initTextures();
    loadData("data/Teapot.json");

    vec4.mul(ambientProduct, lightAmbient, materialAmbient);
    vec4.mul(diffuseProduct, lightDiffuse, materialDiffuse);
    vec4.mul(specularProduct, lightSpecular, materialSpecular);
    gl.uniform4fv( gl.getUniformLocation(shaderProgram,
      "ambientProduct"),new Float32Array(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(shaderProgram,
        "diffuseProduct"),new Float32Array(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(shaderProgram,
        "specularProduct"),new Float32Array(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(shaderProgram,
        "lightPosition"),new Float32Array(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(shaderProgram,
        "shininess"),materialShininess );

    // eye = vec3(radius*Math.sin(theta)*Math.cos(phi),radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));

    // modelViewMatrix = lookAt(eye, at , up);
    // projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    // normalMatrix = [
    //   vec3.fromValues(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
    //   vec3.fromValues(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
    //   vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    // ];

    gl.clearColor(0.0, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);

    tick();
}
