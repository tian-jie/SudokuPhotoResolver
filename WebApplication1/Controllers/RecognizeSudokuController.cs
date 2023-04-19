using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using OpenCvSharp;
using OpenCvSharp.Extensions;
using SkiaSharp;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using Tesseract;
using Point = OpenCvSharp.Point;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class RecognizeSudokuController : ControllerBase
    {
        private readonly ILogger<RecognizeSudokuController> _logger;

        public RecognizeSudokuController(ILogger<RecognizeSudokuController> logger)
        {
            _logger = logger;
        }

        [HttpPost]
        public IEnumerable<int> Post(RecognizeSudokuRequestData requestData)
        {
            return RecognizeSudoku(requestData.imageBase64Data);
        }


        protected int[] RecognizeSudoku(string imageBase64Data)
        {
            // 将imageBase64Data的数据保存到文件中，目录为tmp
            var tmpPath = Path.Combine(Directory.GetCurrentDirectory(), "sourceImages");
            if (!Directory.Exists(tmpPath))
            {
                Directory.CreateDirectory(tmpPath);
            }
            var tmpFileName = Path.Combine(tmpPath, DateTime.Now.Ticks + ".jpg");
            var imageBytes1 = Convert.FromBase64String(imageBase64Data);
            using (var fs = new FileStream(tmpFileName, FileMode.Create))
            {
                fs.Write(imageBytes1, 0, imageBytes1.Length);
            }


            Yolov7net.Yolov7 yolov7 = new Yolov7net.Yolov7("q", true);
            // Decode the base64 string into a byte array.
            byte[] imageBytes = Convert.FromBase64String(imageBase64Data);
            Image image = null;
            using (MemoryStream ms = new MemoryStream(imageBytes, 0, imageBytes.Length))
            {
                // Convert byte[] to Image
                ms.Write(imageBytes, 0, imageBytes.Length);
                image = Image.FromStream(ms, true);
            }

            var predicts = yolov7.Predict(image);
            // [TODO] 然后截取出来的区域，用opencv进行处理，分出数独区域（梯形区域），进行梯形校正
            var sudokuArea = predicts[0].Rectangle;
            
            // 初始化image为初始化mat，使用opencv进行灰度化、二值化处理
            var srcmat = OpenCvSharp.Extensions.BitmapConverter.ToMat(image as Bitmap);

            var maxContours = FindMaxContour(srcmat);
            // 用最大的轮廓，进行梯形校正
            var rect = Cv2.MinAreaRect(maxContours);
            var points = Cv2.BoxPoints(rect);
            var srcPoints = new Point2f[]
            {
                points[0],
                points[1],
                points[2],
                points[3]
            };
            var dstPoints = new Point2f[]
            {
                new Point2f(0, 0),
                new Point2f(0, srcmat.Height),
                new Point2f(srcmat.Width, srcmat.Height),
                new Point2f(srcmat.Width, 0)
            };

            var warpMat = Cv2.GetPerspectiveTransform(srcPoints, dstPoints);
            var warpImage = new Mat();
            Cv2.WarpPerspective(srcmat, warpImage, warpMat, new OpenCvSharp.Size(srcmat.Width, srcmat.Height));

            // 把这个图片切成9x9=81个小图片
            var sudokuImagesBase64 = new List<string>();
            var sudokuWidth = warpImage.Width / 9;
            var sudokuHeight = warpImage.Height / 9;
            for (int i = 0; i < 9; i++)
            {
                for (int j = 0; j < 9; j++)
                {
                    var sudokuImageMat = warpImage[new OpenCvSharp.Rect(j * sudokuWidth, i * sudokuHeight, sudokuWidth, sudokuHeight)];
                    // 再次找到最大的轮廓，不包含面积达到整个图片面积98%以上的
                    var maxNumberAreaContour = FindMaxContour(sudokuImageMat);
                    if(maxNumberAreaContour != null)
                    {
                        // 将sudokuImageMat转换成Image
                        var tmpImage = sudokuImageMat.ToBitmap();
                        // 将Image转换成base64
                        using (var ms = new MemoryStream())
                        {
                            tmpImage.Save(ms, System.Drawing.Imaging.ImageFormat.Jpeg);
                            var sudokuImageBase64Data = Convert.ToBase64String(ms.ToArray());

                            sudokuImagesBase64.Add(sudokuImageBase64Data);
                        }
                    }
                    else
                    {
                        sudokuImagesBase64.Add("");
                    }
                }
            }

            var numbers = RecognizeSudokuService.ScanSudoku(sudokuImagesBase64);

            return numbers.ToArray();
        }

        protected bool isNumberic(string message, out int result)
        {
            //判断是否为整数字符串
            //是的话则将其转换为数字并将其设为out类型的输出值、返回true, 否则为false
            result = -1;   //result 定义为out 用来输出值
            try
            {
                //当数字字符串的为是少于4时，以下三种都可以转换，任选一种
                //如果位数超过4的话，请选用Convert.ToInt32() 和int.Parse()

                //result = int.Parse(message);
                //result = Convert.ToInt16(message);
                result = Convert.ToInt32(message);
                return true;
            }
            catch
            {
                return false;
            }

        }

        private Point[] FindMaxContour(Mat srcmat)
        {
            var grayImage = new Mat();
            Cv2.CvtColor(srcmat, grayImage, ColorConversionCodes.BGR2GRAY);
            var binaryImage = new Mat();
            Cv2.Threshold(grayImage, binaryImage, 0, 255, ThresholdTypes.Otsu | ThresholdTypes.Binary);

            // 查找轮廓
            Point[][] contours;
            HierarchyIndex[] hierarchyIndex;
            Cv2.FindContours(binaryImage, out contours, out hierarchyIndex, RetrievalModes.External, ContourApproximationModes.ApproxSimple);

            // 根据轮廓面积，找到最大的轮廓，不包含面积达到整个图片面积98%以上的
            var maxArea = 0.0;
            var maxAreaIndex = -1;

            for (int i = 0; i < contours.Length; i++)
            {
                var area = Cv2.ContourArea(contours[i]);
                if (area > maxArea && area < srcmat.Width * srcmat.Height * 0.98)
                {
                    maxArea = area;
                    maxAreaIndex = i;
                }
            }

            // 如果面积小于20%，则认为没有找到数独区域
            if (maxArea < srcmat.Width * srcmat.Height * 0.2)
            {
                return null;
            }

            return contours[maxAreaIndex];
        }


    }

    public class RecognizeSudokuRequestData
    {
        public string imageBase64Data { get; set; }
    }
}
