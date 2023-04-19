// 画布
const canvas1 = 'canvas1'
// 示例图片
var sampleImage1 = '/assets/1.jpg'
var wx2sync = require("../../utils/wx2sync.js")

//const url = "http://192.168.1.35:5000/SudokuResolver"
const recognizeUrl = "https://localhost:55004//ScanSudoku"
const resolveUrl = "https://localhost:55004/m/ResolveSudoku"

// wasm路径
global.wasm_url = '/assets/opencv3.4.16.wasm.br'
// opencv_exec.js会从global.wasm_url获取wasm路径
let cv = require('../../assets/opencv_exec.js');
let cvHelper = require("../../utils/image-operation")
var ctx = null;

var cvhelper = new cvHelper();

Page({
  // 画布的dom对象
  canvasDom: null,
  srcMat: null,
  grayMat: null,
  blackMat: null,
  imageData: null,
  dstMat: null,
  isTakePhoto: false,
  cameraPos: "back",
  cameraContext: null,
  box: {
    leftTopPoint: null,
    leftBottomPoint: null,
    rightTopPoint: null,
    rightBottomPoint: null
  },

  data: {
    canvas1Width: 360,
    canvas1Height: 360,
    // 示例图片
    sampleImage1Url: sampleImage1,
    sudokuData: [],
    gridChoosed: []
  },
  onReady() {
    for (var i = 0; i < 81; i++) {
      this.data.gridChoosed.push(false);
      this.data.sudokuData.push({
        isGiven: false,
        data: ""
      });
    }
    // 可见的画布
    this.initCanvas(canvas1);
    this.cameraContext = wx.createCameraContext();
  },
  // 获取画布
  async initCanvas(canvasId) {
    var _that = this;
    _that.canvasDom = await wx2sync.createSelectorQuery(canvasId);
  },

  async btnRun1() {
    // var _that = this;
    // // 将图像转换为ImageData
    // var mat = cvhelper.getGrayMat();
    // cv.imshow(_that.canvasDom, mat);

  },
  async btnRun2() {
    var _that = this;
    // 将图像转换为ImageData
    var mat = await cvhelper.getBlackMat();
    cv.imshow(_that.canvasDom, mat);

  },
  async btnRun3() {
    var _that = this;
    await cvhelper.getCanndy();
    cv.line(this.srcMat, this.box.leftTopPoint, this.box.rightTopPoint, new cv.Scalar(255, 0, 255), 2, cv.LINE_AA, 0);
    cv.line(this.srcMat, this.box.rightTopPoint, this.box.rightBottomPoint, new cv.Scalar(255, 0, 255), 2, cv.LINE_AA, 0);
    cv.line(this.srcMat, this.box.rightBottomPoint, this.box.leftBottomPoint, new cv.Scalar(255, 0, 255), 2, cv.LINE_AA, 0);
    cv.line(this.srcMat, this.box.leftBottomPoint, this.box.leftTopPoint, new cv.Scalar(255, 0, 255), 2, cv.LINE_AA, 0);
    cv.imshow(_that.canvasDom, this.srcMat);
  },

  async btnRun4() {
    var _that = this;
    var mat = await cvhelper.getTransform();

    cv.imshow(_that.canvasDom, mat);

  },
  async recognize() {
    recognize(this);
  },

  async choosePhoto() {
    var _that = this;
    wx.showActionSheet({
      itemList: ['从相册选择', '拍照'],
      itemColor: "#CED63A",
      success: async function (res) {
        if (!res.cancel) {
          if (res.tapIndex == 0) {
            imagePath = chooseWxImage(_that, 'album')
          } else if (res.tapIndex == 1) {
            _that.setData({
              isTakePhoto: true
            });
            if (!await authorizeCamera(_that)) {
              return;
            }
          }
        }
      }
    })
  },

  async takePhoto() {
    cameraContext = this.cameraContext;
    await takePhotoDirectly(this, cameraContext);
  },

  async cancelTakePhoto() {
    this.setData({
      isTakePhoto: false
    });
  },

  // 相机前后镜头转换
  switchCamera() {
    this.setData({
      cameraPos: this.data.cameraPos == "back" ? "front" : "back"
    })
  },

  async resolve() {
    // 提交数字串，得到答案
    wx.showLoading({
      title: '求解中，请稍候...',
      mask: true
    });
    let data1 = this.data.sudokuData;
    let data2 = [];
    data1.forEach((item) => {
      data2.push(item.isGiven ? item.data : 0);
    });
    var result = await wx2sync.request(resolveUrl, {
      numbers: data2
    });
    if (!result.hasResult) {
      wx.showToast({
        title: '无解！'
      });
      return;
    }
    var data = this.data.sudokuData;
    for (var i = 0; i < 81; i++) {
      data[i].data = result.numbers[i];
    }
    this.setData({
      sudokuData: data
    });

    wx.hideLoading();
  },

  async chooseGrid(e) {
    var boxId = e.target.dataset.boxid;
    this.data.gridChoosed[boxId] = true;
    this.setData({
      gridChoosed: this.data.gridChoosed
    });

  },
  bindHideKeyboard(e) {
    if (e.detail.value.length >= 1) {
      // 用最后一个字符替换
      var s = e.detail.value;
      var c = s.slice(-1);
      console.debug(c);
      setTimeout(() => {
        // 收起键盘
        wx.hideKeyboard();
      }, 10);
      console.debug(this.data.sudokuData);
      console.debug(this.data.gridChoosed);
      this.data.gridChoosed[e.target.dataset.boxid] = false;
      this.setData({
        gridChoosed: this.data.gridChoosed
      });
      this.data.sudokuData[e.target.dataset.boxid].isGiven = true;
      this.data.sudokuData[e.target.dataset.boxid].data = c;

      this.setData({
        sudokuData: this.data.sudokuData
      });
      console.debug("set sudokuData: ", c);
      return c;
    }

    if (e.detail.value.length == 0) {
      this.data.sudokuData[e.target.dataset.boxid] = {
        isGiven: false,
        data: ""
      };
      this.setData({
        sudokuData: this.data.sudokuData
      });
      console.debug("set sudokuData: ''");
    }
  },
  error(e) {
    console.error(e);
  },
});

async function chooseWxImage(_that, type) {
  try {
    var filepath = await wx2sync.chooseImage(_that, type);
  } catch (ex) {
    console.debug(ex);
    return;
  }
  console.debug("finished photo")

  wx.showLoading({
    title: '识别中，请稍候...',
    mask: true
  });

  try {
    _that.setData({
      sampleImage1Url: filepath,
    })
    sampleImage1 = filepath;

    await cvhelper.createImageElement(sampleImage1);
    var srcMat = await cvhelper.getSrcMat();
    var dstMat = await cvhelper.getTransform();
    cv.imshow(_that.canvasDom, dstMat);


    await recognize(_that);
  } catch (ex) {
    console.log(ex.message);
  }
  wx.hideLoading();
  console.log("gridChoosed: ", _that.data.gridChoosed);

}

async function takePhotoDirectly(_that, cameraContext) {
  try {
    // 拍照
    var photoFilepath = await wx2sync.takePhoto(cameraContext);
    _that.setData({
      isTakePhoto: false
    });
    console.debug("photoFilepath: ", photoFilepath);
    wx.showLoading({
      title: '识别中，请稍候...',
      mask: true
    });

    _that.setData({
      sampleImage1Url: photoFilepath,
    })
    sampleImage1 = photoFilepath;

    await cvhelper.createImageElement(sampleImage1);
    var srcMat = await cvhelper.getSrcMat();
    var dstMat = await cvhelper.getTransform();
    cv.imshow(_that.canvasDom, dstMat);

    await recognize(_that);
    wx.hideLoading();
    console.log("gridChoosed: ", _that.data.gridChoosed);
  } catch (ex) {
    console.error("ex: ", ex);
  }
}

async function authorizeCamera(_that) {
  // 相机授权
  try {
    await wx2sync.authorize("scope.camera");
  } catch (ex) {
    try {
      var modelResult = await wx2sync.showModel("请授权您的摄像头", "如需要拍照识别，授权同意使用您的摄像头", "确认，去同意授权", "不了，我换个用法");
      if (modelResult.confirm) {} else { //取消
        wx.showToast({
          title: '授权失败',
          icon: 'none',
          duration: 1000
        });
        return false;
      }

      var setting = await wx2sync.openSetting();
      if (setting.authSetting['scope.camera']) {
        wx.showToast({
          title: '授权成功',
          icon: 'success',
          duration: 600
        });
      } else {
        wx.showToast({
          title: '授权失败',
          icon: 'none',
          duration: 1000
        });
        return false;
      }
      return true;
    } catch (ex2) {
      wx.showToast({
        title: '授权被取消',
        icon: 'none',
        duration: 1000
      });
      return false;
    }
  }
}

async function recognize(_that) {
  // 将图片进行base64编码，发给服务器，由服务器进行识别
  // // 将图片裁剪为9x9一共81份，分别进行识别
  // // 如果某一个小块，有效区域的面积小于总面积的30%，并且中心点不在中心区域的话，则这个小块没有数字，不需要服务器识别。
  // // 发送给服务器的格式：认为有数字的块，给识别的有效区域重新截图，算出对应的base64编码，识别没有数字的小块，发送空字符串，减小服务器端的压力
  // /*
  //   data: { 
  //     base64Datas: [
  //       "", "ddddd", "", "", "ddddd"......(81个)
  //     ]
  //   }
  // */
  var offscreenCanvas = wx.createOffscreenCanvas({
    type: '2d'
  });
  const image = offscreenCanvas.createImage();
  // 离屏画布的宽度和高度不能小于图像的
  offscreenCanvas.width = 360;
  offscreenCanvas.height = 360;
  // draw image on canvas
  var mat = await cvhelper.getTransform();
  cv.imshow(offscreenCanvas, mat);

  var base64Datas = [];
  for (var i = 0; i < 81; i++) {
    var width = 40;
    var border = 5;

    let x = (i % 9) * width + border;
    let y = Math.trunc(i / 9) * width + border;

    var offscreenCanvasGrid = wx.createOffscreenCanvas({
      type: '2d'
    });

    // 离屏画布的宽度和高度不能小于图像的
    offscreenCanvasGrid.width = width - border * 2;
    offscreenCanvasGrid.height = width - border * 2;
    // draw imageGrid on canvas
    var ctxGrid = offscreenCanvasGrid.getContext('2d');
    ctxGrid.width = width - border * 2;
    ctxGrid.height = width - border * 2;

    var offScreenCtx = offscreenCanvas.getContext('2d');

    //ctxGrid.putImageData(offScreenCtx.getImageData(x, y, (width - border * 2), (width - border * 2)), 0, 0);
    //console.debug("x: %d, y: %d, offscreenCanvasGrid.width: %d, offscreenCanvasGrid.height: %d", x, y, offscreenCanvasGrid.width, offscreenCanvasGrid.height);
    ctxGrid.putImageData(offScreenCtx.getImageData(x, y, offscreenCanvasGrid.width, offscreenCanvasGrid.height), 0, 0);

    // 对这个区域进行contours
    // 获取包围盒
    var boundingRect = await cvhelper.getBoundingRect(ctxGrid);

    // 如果面积过小，排除
    if (boundingRect.width * boundingRect.height < 10) {
      console.debug('too small');
      base64Datas.push("");
      continue;
    }
    // 计算rect中心，是否在至少当前区域中心
    boundingRectCenterX = boundingRect.x + boundingRect.width / 2;
    boundingRectCenterY = boundingRect.y + boundingRect.height / 2;
    ctxCenterX = 20;
    ctxCenterY = 20;
    if ((boundingRectCenterX - ctxCenterX) * (boundingRectCenterX - ctxCenterX) > 100 ||
      (boundingRectCenterY - ctxCenterY) * (boundingRectCenterY - ctxCenterY) > 100) {
      console.debug('too small -2');
      base64Datas.push("");
      continue;
    }

    var canvas2 = await wx2sync.createSelectorQuery("canvas2");
    canvas2.width = boundingRect.width;
    canvas2.height = boundingRect.height;
    var canvas2Ctx = canvas2.getContext("2d");
    var imageData = ctxGrid.getImageData(boundingRect.x, boundingRect.y, boundingRect.width, boundingRect.height);
    canvas2Ctx.putImageData(imageData, 0, 0);

    var filename = await wx2sync.canvasToTempFilePath(canvas2);
    var base64 = await wx2sync.readFile(filename, "base64");
    base64Datas.push(base64.substring(0));
  }

  console.debug("base64Datas: ", base64Datas);

  var result = await wx2sync.request(recognizeUrl, {
    base64Datas: base64Datas
  });
  console.log(result);
  // TODO: 获取到了数字，81个数字。在界面上给显示出来
  let data = [];
  result.forEach(item => {
    data.push({
      isGiven: item == 0 ? false : true,
      data: item == 0 ? "" : item
    });

  });
  _that.setData({
    sudokuData: data
  });
}