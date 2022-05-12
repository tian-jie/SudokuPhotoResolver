async function getImageInfoSync(imageUrl) {
  return await new Promise((resolve, reject) => {
    wx.getImageInfo({
      src: imageUrl,
      success: (res) => {
        resolve(res);
      }
    });
  });
}

async function createSelectorQuery(canvasId) {
  return await new Promise((resolve, reject) => {
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
        resolve(canvas2d);
      });
  });
}

async function canvasToTempFilePath(canvasId) {
  return await new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvas: canvasId,
      success: (res) => {
        resolve(res.tempFilePath);
      },
      fail: (res) =>{
        console.debug(res);
        reject(res);
      }
    });
  });
}

async function readFile(filename, encoding) {
  return await new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath: filename,
      encoding: encoding,
      success: res => {
        resolve(res.data);
      }
    });
  });
}

async function request(url, data, method="post"){
  return await new Promise((resolve, reject) => {
    console.debug(data);
    wx.request({
      url: url,
      data: data,
      method: method,
      success: (res) =>{
        resolve(res.data);
      },
      fail: (res) => {
        reject(res);
      }
    });
  });
}

async function chooseImage(type, sizeType = ['original', 'compressed'], count = 1){
  return await new Promise((resolve, reject) => {
    wx.chooseImage({
      sizeType: sizeType,
      sourceType: [type],
      count: count,
      success: function (res) {
        resolve(res.tempFilePaths[0]);
      }
    });
  });
}

module.exports = {
  getImageInfoSync: getImageInfoSync,
  createSelectorQuery: createSelectorQuery,
  canvasToTempFilePath: canvasToTempFilePath,
  readFile: readFile,
  request: request,
  chooseImage: chooseImage
}