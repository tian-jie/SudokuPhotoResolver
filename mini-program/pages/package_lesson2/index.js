// 画布
const canvas1 = 'canvas1'
// 示例图片
var sampleImage1 = '/assets/1.jpg'

//const url = "http://192.168.1.35:5000/SudokuResolver"
const url = "https://localhost:44357/SudokuResolver"

// wasm路径
global.wasm_url = '/assets/opencv3.4.16.wasm.br'
// opencv_exec.js会从global.wasm_url获取wasm路径
let cv = require('../../assets/opencv_exec.js');
var cvhelper = require("../../utils/image-operation")
var ctx = null;

Page({
  // 画布的dom对象
  canvasDom: null,
  srcMat: null,
  grayMat: null,
  blackMat: null,
  imageData: null,
  dstMat: null,
  box: {
    leftTopPoint: null,
    leftBottomPoint: null,
    rightTopPoint: null,
    rightBottomPoint: null
  },


  data: {
    canvas1Width: 375,
    canvas1Height: 150,
    // 示例图片
    sampleImage1Url: sampleImage1,

  },
  onReady() {
    // 可见的画布
    this.initCanvas(canvas1);
  },
  // 获取画布
  initCanvas(canvasId) {
    var _that = this;
    wx.createSelectorQuery()
      .select('#' + canvasId)
      .fields({
        node: true,
        size: true
      })
      .exec((res) => {
        const canvas2d = res[0].node;
        // 设置画布的宽度和高度
        canvas2d.width = res[0].width;
        canvas2d.height = res[0].height;
        _that.canvasDom = canvas2d;
      });
  },

  async btnRun1() {
    var _that = this;
    // 将图像转换为ImageData
    var mat = await cvhelper.getGrayMat(_that);
    cv.imshow(_that.canvasDom, mat);
  },
  async btnRun2() {
    var _that = this;
    // 将图像转换为ImageData
    var mat = await cvhelper.getBlackMat(_that);
    cv.imshow(_that.canvasDom, mat);

  },
  async btnRun3() {
    var _that = this;
    await cvhelper.getCanndy(_that);

    cv.line(this.srcMat, this.box.leftTopPoint, this.box.rightTopPoint, new cv.Scalar(255, 0, 0), 2, cv.LINE_AA, 0);
    cv.line(this.srcMat, this.box.rightTopPoint, this.box.rightBottomPoint, new cv.Scalar(255, 0, 0), 2, cv.LINE_AA, 0);
    cv.line(this.srcMat, this.box.rightBottomPoint, this.box.leftBottomPoint, new cv.Scalar(255, 0, 0), 2, cv.LINE_AA, 0);
    cv.line(this.srcMat, this.box.leftBottomPoint, this.box.leftTopPoint, new cv.Scalar(255, 0, 0), 2, cv.LINE_AA, 0);
    cv.imshow(_that.canvasDom, this.srcMat);
  },

  async btnRun4() {
    var _that = this;
    await cvhelper.getTransform(_that);

    cv.imshow(_that.canvasDom, _that.dstMat);

  },
  async btnRun5() {
    var _that = this;
    // 将图片进行base64编码，发给服务器，由服务器进行识别
    wx.canvasToTempFilePath({
      canvas: _that.canvasDom,
      success(res) {
        wx.getFileSystemManager().readFile({
          filePath: res.tempFilePath,
          encoding: "base64",
          success: async res => {
            console.log('data:image/png;base64,' + res.data);
            var base64Data = res.data;

            wx.request({
              url: url,
              method: "POST",
              data: {
                base64Data: base64Data
              },
              header: { //配置头文件
                "Content-Type": "application/json"
              },
              success(res) {
                console.log(res);
                // 获取到了数字，81个数字。在界面上给显示出来
              }
            })
          }
        })
      },
      fail(res) {
        console.error(res);
      }
    });
  },

  async btnRun6() {
    var _that = this;
    wx.showActionSheet({
      itemList: ['从相册选择', '拍照'],
      itemColor: "#CED63A",
      success: async function (res) {
        var imagePath = "";
        if (!res.cancel) {
          if (res.tapIndex == 0) {
            imagePath = chooseWxImage(_that, 'album')
          } else if (res.tapIndex == 1) {
            imagePath = chooseWxImage(_that, 'camera')
          }
        }
      }
    })
  }
});

async function chooseWxImage(_that, type) {
  wx.chooseImage({
    sizeType: ['original', 'compressed'],
    sourceType: [type],
    count: 1,
    success: async function (res) {
      _that.setData({
        sampleImage1Url: res.tempFilePaths[0],
      })
      sampleImage1 = res.tempFilePaths[0];

      await cvhelper.createImageElement(_that, sampleImage1);
      var srcMat = await cvhelper.getSrcMat(_that);
      // 在这里裁剪后重新放到srcMat里
      var newSrcMat = cvhelper.cropImageToSquare(srcMat);
      console.log("await cvhelper.getSrcMat");
      _that.srcMat = newSrcMat;
      cv.imshow(_that.canvasDom, newSrcMat);
      //srcMat.delete();
      console.log("cv.imshow(_that.canvasDom, srcMat)");
    }
  })
}