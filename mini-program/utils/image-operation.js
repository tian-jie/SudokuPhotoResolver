var wx2sync = require("wx2sync.js")
// 画布最大宽度
const maxCanvasWidth = 375
let cv = require('../assets/opencv_exec.js');

module.exports = class cvhelper {
    srcMat = null;
    grayMat = null;
    blackMat = null;
    canndyMat = null;
    imageData = null;
    canvas1Width = 360;
    canvas1Height = 360;
    canvasDom = null;
    box = {
        leftTopPoint: null,
        leftBottomPoint: null,
        rightTopPoint: null,
        rightBottomPoint: null
    };
    constructor() { }

    async getGrayMat() {
        if (this.grayMat == null) {
            var mat = new cv.Mat();
            var srcMat = await this.getSrcMat();
            cv.cvtColor(srcMat, mat, cv.COLOR_RGBA2GRAY, 0);
            this.grayMat = mat;
        }
        return this.grayMat;
    }

    async getBlackMat() {
        if (this.blackMat == null) {
            var mat = new cv.Mat();
            var grayMat = await this.getGrayMat();
            cv.threshold(grayMat, mat, 100, 255, cv.THRESH_BINARY);
            this.blackMat = mat;
        }
        return this.blackMat;
    }

    async getSrcMat() {
        if (this.srcMat == null) {
            this.srcMat = new cv.Mat();
            this.srcMat = cv.imread(this.imageData);
            console.debug("cv.imread");

            // 设置画布的显示大小
            this.canvas1Width = this.imageData.width;
            this.canvas1Height = this.imageData.height;

            console.debug("canvas1Width: %d, canvas1Height: %d", this.imageData.width, this.imageData.height);
        }
        return this.srcMat;
    }

    async clearMats() {
        if (this.srcMat != null && this.srcMat != 'undefined') {
            this.srcMat.delete();
            this.srcMat = null;
        }
        if (this.canndyMat != null && this.canndyMat != 'undefined') {
            this.canndyMat.delete();
            this.canndyMat = null;
        }
        if (this.grayMat != null && this.grayMat != 'undefined') {
            this.grayMat.delete();
            this.grayMat = null;
        }
        if (this.blackMat != null && this.blackMat != 'undefined') {
            this.blackMat.delete();
            this.blackMat = null;
        }
        if (this.dstMat != null && this.dstMat != 'undefined') {
            this.dstMat.delete();
            this.dstMat = null;
        }

        this.imageData = null;
    }

    async getCanndy() {
        // 将图像转换为ImageData
        var mat = await this.getBlackMat();

        // 使用滤波处理，也就是模糊处理，这样可以减少一些不需要的噪点。
        //cv.medianBlur(this.blackMat, this.blackMat, 3);

        // // 边缘检测
        // let canndyMat = new cv.Mat();
        // cv.Canny(mat, canndyMat, 50, 100, 3, false);

        // this.canndyMat = canndyMat;
        // let M = cv.Mat.ones(3, 3, cv.CV_8U);
        // let anchor = new cv.Point(-1, -1);
        // // You can try more different parameters
        // cv.dilate(canndyMat, canndyMat, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

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

        var canvasArea = this.canvas1Width * this.canvas1Height;
        for (var i = 0; i < contoursWithId.length; i++) {
            var contourArea = cv.contourArea(contoursWithId[i].contour);
            //console.debug("contourArea: ", contourArea, ", canvasArea: ", canvasArea, ", i: ", i, ", contoursWithId.length: ", contoursWithId.length);
            if (contourArea > canvasArea * 0.95) {
                //console.debug("deleting... contourArea: %d, %: %2.2f", contourArea, contourArea/canvasArea);
                contoursWithId.splice(i, 1);
                i--;
            }
        }

        var mainContour = contoursWithId[0];

        var points = [];
        for (let j = 0; j < mainContour.contour.data32S.length; j += 2) {
            let p = {};
            p.x = mainContour.contour.data32S[j];
            p.y = mainContour.contour.data32S[j + 1];
            points.push(p);
        }

        var centerX = this.canvas1Width / 2;
        var centerY = this.canvas1Height / 2;
        this.box.leftTopPoint = getPoints(points, false, false, centerX, centerY);
        this.box.rightTopPoint = getPoints(points, true, false, centerX, centerY);
        this.box.rightBottomPoint = getPoints(points, true, true, centerX, centerY);
        this.box.leftBottomPoint = getPoints(points, false, true, centerX, centerY);

        hierarchy.delete();
        contourVector.delete();

        //return this.canndyMat;
    }

    // 透视变换
    async getTransform() {
        await this.getCanndy();

        var mat = this.srcMat;
        let dst = cv.Mat.zeros(mat.cols, mat.rows, cv.CV_8UC3);
        let dsize = new cv.Size(mat.cols, mat.rows);

        let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [this.box.leftTopPoint.x, this.box.leftTopPoint.y, this.box.rightTopPoint.x, this.box.rightTopPoint.y, this.box.leftBottomPoint.x, this.box.leftBottomPoint.y, this.box.rightBottomPoint.x, this.box.rightBottomPoint.y]);
        let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, this.canvas1Width, 0, 0, this.canvas1Height, this.canvas1Width, this.canvas1Height]);
        let M1 = cv.getPerspectiveTransform(srcTri, dstTri);
        cv.warpPerspective(this.blackMat, dst, M1, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

        let resizeDSize = new cv.Size(360, 360);

        cv.resize(dst, dst, resizeDSize, 0, 0, cv.INTER_AREA);
        this.dstMat = dst;
        return this.dstMat;
    }

    // 创建图像对象
    async createImageElement(imgUrl, canvasDom) {
        this.canvasDom = canvasDom;
        console.log("async function createImageElement", imgUrl);
        await this.clearMats();
        // 拍完照片后，给主体区域显示出来
        var imageInfo = await wx2sync.getImageInfoSync(imgUrl);

        // get image data from canvas
        var targetWidth = imageInfo.width * 1;
        var x = imageInfo.width * 0.00;
        var y = (imageInfo.height - targetWidth) / 2;

        var imageData = await this.getImageData(imgUrl, x, y, targetWidth, targetWidth);

        this.imageData = imageData;
        return imageData;
    }

    // 获取图像数据和调整图像大小
    async getImageData(imageUrl, targetX, targetY, targetWidth, targetHeight) {
        // 创建2d类型的离屏画布（需要微信基础库2.16.1以上）
        var offscreenCanvas = wx.createOffscreenCanvas({
            type: '2d'
        });
        const image = offscreenCanvas.createImage();
        await new Promise(function (resolve, reject) {
            image.onload = resolve
            image.onerror = reject
            image.src = imageUrl
        })

        // 离屏画布的宽度和高度不能小于图像的
        offscreenCanvas.width = image.width;
        offscreenCanvas.height = image.height;
        // draw image on canvas
        var ctx = offscreenCanvas.getContext('2d')
        ctx.drawImage(image, 0, 0, image.width, image.height);
        console.log("offscreen canvas ctx created, width: %d, height: %d", image.width, image.height);

        var imageData = ctx.getImageData(targetX, targetY, targetWidth, targetHeight);
        console.debug(imageData.width, imageData.height);

        return imageData
    }

    async cropImageToSquare(mat) {
        var width = mat.cols;
        var height = mat.rows;
        //var targetWidth = width * 1;
        var targetWidth = width * 1;
        var x = width * 0.00;
        var y = (height - targetWidth) / 2;

        console.log("x: %d, y: %d, width: %d, height: %d, targetWidth: %d", x, y, width, height, targetWidth);

        let dst = cv.Mat.zeros(targetWidth, targetWidth, cv.CV_8UC3);
        let dsize = new cv.Size(targetWidth, targetWidth);

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

    async getBoundingRect(canvas) {
        // 记得即使没有也要返回一个空rect
        console.debug(canvas);
        var imageData = canvas.getImageData(0, 0, canvas.width, canvas.height);
        console.debug("imageData: ", imageData);
        var mat = cv.imread(imageData);
        console.debug("mat: ", mat);
        // 查找轮廓
        console.debug("0");
        var canvas2 = await wx2sync.createSelectorQuery("canvas2");
        console.debug(canvas2);
        //var canvas2Context = canvas2.getContext("2d");
        cv.imshow(canvas2, mat);
        console.debug("1");

        let canndyMat = new cv.Mat();
        cv.Canny(mat, canndyMat, 50, 100, 3, false);

        this.canndyMat = canndyMat;
        let M = cv.Mat.ones(3, 3, cv.CV_8U);
        let anchor = new cv.Point(-1, -1);
        // You can try more different parameters
        cv.dilate(canndyMat, canndyMat, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

        let hierarchy = new cv.Mat();
        let contourVector = new cv.MatVector();
        cv.findContours(canndyMat, contourVector, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
        console.debug("2");

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

        console.debug("3");
        // 轮廓排序
        contoursWithId.sort(function (a, b) {
            return cv.contourArea(b.contour) - cv.contourArea(a.contour);
        });

        console.debug("4");
        var canvasArea = this.canvas1Width * this.canvas1Height;
        for (var i = 0; i < contoursWithId.length; i++) {
            var contourArea = cv.contourArea(contoursWithId[i].contour);
            //console.debug("contourArea: ", contourArea, ", canvasArea: ", canvasArea, ", i: ", i, ", contoursWithId.length: ", contoursWithId.length);
            if (contourArea > canvasArea * 0.95) {
                //console.debug("deleting... contourArea: %d, %: %2.2f", contourArea, contourArea/canvasArea);
                contoursWithId.splice(i, 1);
                i--;
            }
        }
        console.debug("5");

        if (contoursWithId.length == 0) {
            console.debug("6.1");
            return new cv.rect(0, 0, 0, 0);
        }
        console.debug("6");
        var mainContour = contoursWithId[0];

        var points = [];
        for (let j = 0; j < mainContour.contour.data32S.length; j += 2) {
            let p = {};
            p.x = mainContour.contour.data32S[j];
            p.y = mainContour.contour.data32S[j + 1];
            points.push(p);
        }

        hierarchy.delete();
        contourVector.delete();

        var rect = cv.boundingRect(mainContour.contour);
        console.debug(rect);

        return rect;
    }
}

function getPoints(points, positiveX, positiveY, centerX, centerY) {
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
