var wx2sync = require("wx2sync.js")
// 画布最大宽度
const maxCanvasWidth = 375
let cv = require('../assets/opencv_exec.js');

async function getGrayMat(_that) {
  if (_that.grayMat == null) {
    var mat = new cv.Mat();
    var srcMat = await getSrcMat(_that);
    cv.cvtColor(srcMat, mat, cv.COLOR_RGBA2GRAY, 0);
    _that.grayMat = mat;
  }
  return _that.grayMat;
}

async function getBlackMat(_that) {
  if (_that.blackMat == null) {
    _that.blackMat = new cv.Mat();
    var grayMat = await getGrayMat(_that);
    cv.threshold(grayMat, _that.blackMat, 100, 255, cv.THRESH_BINARY);
  }
  return _that.blackMat;
}

async function getSrcMat(_that) {
  if (_that.srcMat == null) {
    _that.srcMat = new cv.Mat();
    _that.srcMat = cv.imread(_that.imageData);
    // var width = mat.cols.width;
    // var height = mat.rows.height;
    // var targetWidth = width * 0.8;
    // var x = width * 0.1;
    // var y = (height - targetWidth) / 2;
  
    //let rect = new cv.Rect(0, 0, 200, 200);
    //console.log("getSrcMat, before roi");
    //_that.srcMat = mat;
    //_that.srcMat = mat.roi(rect);
    //console.log("getSrcMat, after roi");

    // 设置画布的显示大小
    _that.setData({
      canvas1Width: _that.imageData.width,
      canvas1Height: _that.imageData.height,
    });
    // mat.delete();
    // console.log("mat.delete()");
  }
  return _that.srcMat;
}

function getPoints(points, positiveX, positiveY, centerX, centerY, that) {
  var newPoints = [];
  points.forEach(a => {
    if (a.x - centerX > 0 == positiveX && a.y - centerY > 0 == positiveY) {
      newPoints.push(a);
      //cv.circle(that.srcMat, a, 2, new cv.Scalar(255, 0, 0), 2, cv.LINE_AA, 0);
      //console.debug("p: ",a, (a.x - centerX) * (positiveX ? 1 : -1) + (a.y - centerY) * (positiveY ? 1 : -1));
    }
  });
  //console.info("newPoints: ", newPoints);
  newPoints.sort(function (a, b) {
    return ((b.x - centerX) * (positiveX ? 1 : -1) + (b.y - centerY) * (positiveY ? 1 : -1)) - ((a.x - centerX) * (positiveX ? 1 : -1) + (a.y - centerY) * (positiveY ? 1 : -1));
  });
  //cv.circle(that.srcMat, newPoints[0], 4, new cv.Scalar(0, 0, 255), 2, cv.LINE_AA, 0);

  return newPoints[0];
}

async function getCanndy(_that) {
  // 将图像转换为ImageData
  var mat = await getBlackMat(_that);

  // 使用滤波处理，也就是模糊处理，这样可以减少一些不需要的噪点。
  //cv.medianBlur(_that.blackMat, _that.blackMat, 3);

  // 边缘检测
  let candyMat = new cv.Mat();
  cv.Canny(_that.blackMat, candyMat, 50, 100, 3, false);

  let M = cv.Mat.ones(3, 3, cv.CV_8U);
  let anchor = new cv.Point(-1, -1);
  // You can try more different parameters
  cv.dilate(candyMat, candyMat, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

  // 查找轮廓
  let hierarchy = new cv.Mat();
  let contourVector = new cv.MatVector();
  cv.findContours(mat, contourVector, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

  var contours = [];
  var contoursWithId = [];
  for (var i = 0; i < contourVector.size(); i++) {
    var contour = contourVector.get(i);
    contoursWithId.push({
      id: i,
      contour: contour
    });
    contours.push(contour);
  }

  // 轮廓排序
  contoursWithId.sort(function (a, b) {
    return cv.contourArea(b.contour) - cv.contourArea(a.contour);
  });

  var canvasArea = _that.data.canvas1Width * _that.data.canvas1Height;
  for (var i = 0; i < contoursWithId.length; i++) {
    var contourArea = cv.contourArea(contoursWithId[i].contour);
    //console.debug("contourArea: ", contourArea, ", canvasArea: ", canvasArea, ", i: ", i, ", contoursWithId.length: ", contoursWithId.length);
    if (contourArea > canvasArea * 0.95) {
      //console.debug("deleting... contourArea: ", contourArea);
      contoursWithId.splice(i, 1);
      i--;
    }
  }

  mainContour = contoursWithId[0];

  var points = [];
  for (let j = 0; j < mainContour.contour.data32S.length; j += 2) {
    let p = {};
    p.x = mainContour.contour.data32S[j];
    p.y = mainContour.contour.data32S[j + 1];
    points.push(p);
  }

  var centerX = _that.data.canvas1Width / 2;
  var centerY = _that.data.canvas1Height / 2;
  _that.box.leftTopPoint = getPoints(points, false, false, centerX, centerY, _that);
  _that.box.rightTopPoint = getPoints(points, true, false, centerX, centerY, _that);
  _that.box.rightBottomPoint = getPoints(points, true, true, centerX, centerY, _that);
  _that.box.leftBottomPoint = getPoints(points, false, true, centerX, centerY, _that);

}

// 透视变换
async function getTransform(_that) {
  await getCanndy(_that);

  var mat = _that.srcMat;
  let dst = cv.Mat.zeros(mat.cols, mat.rows, cv.CV_8UC3);
  let dsize = new cv.Size(mat.cols, mat.rows);

  let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [_that.box.leftTopPoint.x, _that.box.leftTopPoint.y, _that.box.rightTopPoint.x, _that.box.rightTopPoint.y, _that.box.leftBottomPoint.x, _that.box.leftBottomPoint.y, _that.box.rightBottomPoint.x, _that.box.rightBottomPoint.y]);
  let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, _that.data.canvas1Width, 0, 0, _that.data.canvas1Height, _that.data.canvas1Width, _that.data.canvas1Height]);
  let M1 = cv.getPerspectiveTransform(srcTri, dstTri);
  cv.warpPerspective(_that.srcMat, dst, M1, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

  let resizeDSize = new cv.Size(360, 360);

  cv.resize(dst, dst, resizeDSize, 0, 0, cv.INTER_AREA);
  _that.dstMat = dst;
}

// 创建图像对象
async function createImageElement(_that, imgUrl) {
  console.log("async function createImageElement");

  // 创建2d类型的离屏画布（需要微信基础库2.16.1以上）
  var offscreenCanvas = wx.createOffscreenCanvas({
    type: '2d'
  });
  const image = offscreenCanvas.createImage();
  await new Promise(function (resolve, reject) {
    image.onload = resolve
    image.onerror = reject
    image.src = imgUrl
  })
  // 拍完照片后，给主体区域显示出来
  console.log("wx2sync.getImageInfoSync");
  var imageInfo = await wx2sync.getImageInfoSync(imgUrl);
  console.log("imageInfo", imageInfo);

  const ctx = offscreenCanvas.getContext("2d");
  ctx.drawImage(image, 0, 0, image.width, image.height);
  _that.imageData = getImageData(image, offscreenCanvas);
  console.log("_that.imageData set")
}

// 获取图像数据和调整图像大小
function getImageData(image, offscreenCanvas) {
  console.log("getImageData");
  var _that = this
  var canvasWidth = image.width;
  if (canvasWidth > maxCanvasWidth) {
    canvasWidth = maxCanvasWidth;
  }
  // canvas Height
  var canvasHeight = Math.floor(canvasWidth * (image.height / image.width));

  // 离屏画布的宽度和高度不能小于图像的
  offscreenCanvas.width = canvasWidth;
  offscreenCanvas.height = canvasHeight;
  // draw image on canvas
  ctx = offscreenCanvas.getContext('2d')
  ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);
  console.log("ctx created");
  // get image data from canvas
  var imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

  return imgData
}

function cropImageToSquare(mat) {
  var width = mat.cols;
  var height = mat.rows;
  var targetWidth = width * 0.8;
  var x = width * 0.1;
  var y = (height - targetWidth) / 2;

  console.log("x: %d, y: %d, width: %d, height: %d, targetWidth: %d", x, y, width, height, targetWidth);

  let dst = cv.Mat.zeros(mat.cols, mat.rows, cv.CV_8UC3);
  let dsize = new cv.Size(mat.cols, mat.rows);

  let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [x, y, x + targetWidth, y, x, y + targetWidth, x + targetWidth, y + targetWidth]);
  let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, targetWidth, 0, 0, targetWidth, targetWidth, targetWidth]);
  let M1 = cv.getPerspectiveTransform(srcTri, dstTri);
  cv.warpPerspective(mat, dst, M1, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

  let resizeDSize = new cv.Size(360, 360);
  let dstResized = cv.Mat.zeros(360, 360, cv.CV_8UC3);

  cv.resize(dst, dstResized, resizeDSize, 0, 0, cv.INTER_AREA);
  dst.delete();
  return dstResized;
}
module.exports = {
  getGrayMat: getGrayMat,
  getBlackMat: getBlackMat,
  getSrcMat: getSrcMat,
  getPoints: getPoints,
  getCanndy: getCanndy,
  getTransform: getTransform,
  createImageElement: createImageElement,
  cropImageToSquare: cropImageToSquare
}