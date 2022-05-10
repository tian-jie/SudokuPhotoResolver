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

module.exports = {
  getImageInfoSync: getImageInfoSync
}