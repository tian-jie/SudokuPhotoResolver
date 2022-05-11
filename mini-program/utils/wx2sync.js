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
                console.debug(res);
                resolve(canvas2d);
            });
    });
}

module.exports = {
    getImageInfoSync: getImageInfoSync,
    createSelectorQuery: createSelectorQuery
}