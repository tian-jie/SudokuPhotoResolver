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
            fail: (res) => {
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

async function request(url, data, method = "post") {
    return await new Promise((resolve, reject) => {
        console.debug(data);
        wx.request({
            url: url,
            data: data,
            method: method,
            success: (res) => {
                resolve(res.data);
            },
            fail: (res) => {
                reject(res);
            }
        });
    });
}

async function chooseImage(_that, type, sizeType = ['original', 'compressed'], count = 1) {
    return await new Promise((resolve, reject) => {
        wx.chooseImage({
            sizeType: sizeType,
            sourceType: [type],
            count: count,
            success: function (res) {
                resolve(res.tempFilePaths[0]);
            },
            fail: function (res) {
                reject(res);
            }
        });
    });
}

async function takePhoto(cameraContext) {
    console.debug("taking photo");

    return await new Promise((resolve, reject) => {
        console.debug("cameraContext created: ", cameraContext);

        cameraContext.takePhoto({
            quality: "high",
            success: function (res) {
                console.debug("take photo: ", res);

                resolve(res.tempImagePath);
            },
            fail: (res) => {
                console.debug("take photo failed: ", res);
                reject(res);
            },
            complete: (res) => {
                console.debug("take photo complete: ", res)
            }
        });
    });
}

async function authorize(scope) {
    await new Promise((resolve, reject) => {
        wx.authorize({
            scope: 'scope.camera',
            success: function (res) {
                resolve(res);
            },
            fail: function (res) {
                reject(res);
            }
        });
    });
}

async function openSetting() {
    await new Promise((resolve, reject) => {
        wx.openSetting({
            success: function (res) {
                resolve(res);
            },
            fail: function (res) {
                reject(res);
            }
        });
    });
}

async function showModel(title, content, confirmText, cancelText) {
    await new Promise((resolve, reject) => {
        wx.showModal({
            title: "请授权您的摄像头",
            content: "如需要拍照识别，授权同意使用您的摄像头",
            confirmText: "确认，去同意授权",
            cancelText: "不了，我换个用法",
        })
    });
}

async function sleep(ms){
    await Promise((resolve) => {
        setTimeout(()=>{
            resolve();
        }, 100);
    });
}

module.exports = {
    getImageInfoSync: getImageInfoSync,
    createSelectorQuery: createSelectorQuery,
    canvasToTempFilePath: canvasToTempFilePath,
    readFile: readFile,
    request: request,
    chooseImage: chooseImage,
    authorize: authorize,
    openSetting: openSetting,
    takePhoto: takePhoto,
    sleep: sleep
}