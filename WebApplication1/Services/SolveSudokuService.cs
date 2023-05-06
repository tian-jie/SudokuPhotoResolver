using OpenCvSharp;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using Tesseract;

public static class SolveSudokuService
{
    public static int[] SolveSudoku(int[] board)
    {
        // 先转成int的一维数组
        var boardint = new int[81];

        // 先做一个大表格
        var all = new Dictionary<int, List<int>>();
        for (var i = 0; i < 81; i++)
        {
            if (board[i] == 0)
            {
                all.Add(i, new List<int>() { 1, 2, 3, 4, 5, 6, 7, 8, 9 });
            }
            else
            {
                boardint[i] = board[i];
            }
        }

        var isSolved = Solve(boardint, all);

        if (!isSolved)
        {
            throw new System.Exception("Not result");
        }
        return boardint;
    }

    private static bool Solve(int[] board, Dictionary<int, List<int>> unsolved)
    {
        if (unsolved.Count == 0)
        {
            // 解出来了
            return true;
        }
        var isValid = false;

        while (Filter(board, unsolved, out isValid)) ;

        if (!isValid)
        {
            return false;
        }
        if (unsolved.Count == 0)
        {
            return true;
        }

        //if (isValid && unsolved.Count > 0)
        //{
        // 解不出来了，需要假设一个继续递归
        // 找一个最少的开始循环
        var less = 9;
        var lessIndex = 0;
        for (var i = 0; i < 81; i++)
        {
            if (unsolved.Keys.Contains(i))
            {
                var cnt = unsolved[i].Count;
                if (cnt < less)
                {
                    less = unsolved[i].Count;
                    lessIndex = i;
                }
            }
        }

        // 开始递归
        foreach (var i in unsolved[lessIndex])
        {
            // 复制现场环境
            var newBoard = new int[81];
            for (var j = 0; j < 81; j++)
            {
                newBoard[j] = board[j];
            }
            newBoard[lessIndex] = i;

            var newUnsolved = new Dictionary<int, List<int>>();
            foreach (var j in unsolved.Keys)
            {
                if (j == lessIndex)
                {
                    continue;
                }
                var list = new List<int>();
                newUnsolved.Add(j, list);
                foreach (var e in unsolved[j])
                {
                    list.Add(e);
                }
            }
            // -- 现场环境复制完成
            if (Solve(newBoard, newUnsolved))
            {
                for (var j = 0; j < 81; j++)
                {
                    board[j] = newBoard[j];
                }
                return true;
            }

        }
        //}
        return false;
    }

    private static bool Filter(int[] board, Dictionary<int, List<int>> unsolved, out bool isValid)
    {
        var isChanged = false;
        isValid = true;

        // 然后针对每个格子，计算行、列、小方格的数字，进行排除
        for (var i = 0; i < 81; i++)
        {
            if (!unsolved.Keys.Contains(i))
            {
                continue;
            }
            var m = i / 9;
            var n = i % 9;
            var list = unsolved[i];

            for (var j = 0; j < 9; j++)
            {
                if (j == n)
                {
                    continue;
                }
                var xx = m * 9 + j;
                if (list.Contains(board[xx]))
                {
                    list.Remove(board[xx]);
                    isChanged = true;
                }
            }

            for (var j = 0; j < 9; j++)
            {
                if (j == m)
                {
                    continue;
                }
                var xx = j * 9 + n;
                if (list.Contains(board[xx]))
                {
                    list.Remove(board[xx]);
                    isChanged = true;
                }
            }

            for (var x = m - m % 3; x < m - m % 3 + 3; x++)
            {
                for (var y = n - n % 3; y < n - n % 3 + 3; y++)
                {
                    if (x == m && y == n)
                    {
                        continue;
                    }
                    var xx = x * 9 + y;
                    if (list.Contains(board[xx]))
                    {
                        list.Remove(board[xx]);
                        isChanged = true;
                    }
                }
            }


            if (isChanged && list.Count == 1)
            {
                board[i] = list[0];
                unsolved.Remove(i);
            }

            if (unsolved.Count == 0)
            {
                // 无解，返回
                isValid = false;
            }
        }

        return isChanged;
    }

    private static readonly TesseractEngine _engine = new TesseractEngine(System.AppDomain.CurrentDomain.BaseDirectory + "tessdata", "digits", EngineMode.Default);

    public static List<int> ScanSudoku(List<string> ss)
    {
        var numbers = new List<int>();

        _engine.DefaultPageSegMode = PageSegMode.SingleChar;
        for (var i = 0; i < 81; i++)
        {
            var number = ExtractNumber(ss[i]);
            numbers.Add(number);
        }

        return numbers;
    }


    private static bool isNumberic(string message, out int result)
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

    static int _index = 0;
    public static int ExtractNumber(string base64ImageData)
    {
        // 接受图片
        if (string.IsNullOrEmpty(base64ImageData))
        {
            return 0;
        }
        var bytes = Convert.FromBase64String(base64ImageData);
        Bitmap srcBitmap = null;
        var filename = System.AppDomain.CurrentDomain.BaseDirectory + "tmp\\" + DateTime.Now.Ticks + _index++ + ".png";
        using (MemoryStream ms = new MemoryStream(bytes))
        {
            srcBitmap = new Bitmap(ms);
            srcBitmap.Save(filename);
            ms.Close();
        }


        using (var img = Pix.LoadFromFile(filename))
        {
            using (var page = _engine.Process(img))
            {
                var n = page.GetText();
                int result = 0;
                if (isNumberic(n, out result))
                {
                    return result;
                }
                else
                {
                    return 0;
                }
            }
        }
    }

    public static int[] RecognizeSudoku(Image sudokuImage)
    {
        #region 保存文件
        // 将image保存到文件中，目录为tmp
        var tmpPath = Path.Combine(Directory.GetCurrentDirectory(), "tmp");
        var tmpFileName = Path.Combine(tmpPath, DateTime.Now.Ticks + ".png");
        if (!Directory.Exists(tmpPath))
        {
            Directory.CreateDirectory(tmpPath);
        }
        sudokuImage.Save(tmpFileName, System.Drawing.Imaging.ImageFormat.Png);

        #endregion 保存文件

        #region 调用yolov7进行识别，并截取识别区域
        // 将sudokuImage转成byte[]
        byte[] imageBytes = null;
        using (var ms = new MemoryStream())
        {
            sudokuImage.Save(ms, System.Drawing.Imaging.ImageFormat.Png);
            imageBytes = ms.ToArray();
        }
        Image image = null;
        using (MemoryStream ms = new MemoryStream(imageBytes, 0, imageBytes.Length))
        {
            // Convert byte[] to Image
            ms.Write(imageBytes, 0, imageBytes.Length);
            image = Image.FromStream(ms, true);
        }

        Yolov7net.Yolov7 yolov7 = new Yolov7net.Yolov7("C:\\Users\\JieTi\\OneDrive\\yolov7x-sudoku.onnx", false);
        var predicts = yolov7.Predict(image);
        // [TODO] 然后截取出来的区域，用opencv进行处理，分出数独区域（梯形区域），进行梯形校正
        var sudokuArea = predicts[0].Rectangle;
        // 将这个区域上下左右均向外括张选定区域长宽的10%，注意不要超出原图片边界
        var sudokuAreaWidth = sudokuArea.Width;
        var sudokuAreaHeight = sudokuArea.Height;
        var sudokuAreaX = sudokuArea.X;
        var sudokuAreaY = sudokuArea.Y;
        var sudokuAreaX1 = sudokuAreaX - sudokuAreaWidth / 10;
        var sudokuAreaY1 = sudokuAreaY - sudokuAreaHeight / 10;
        var sudokuAreaX2 = sudokuAreaX + sudokuAreaWidth + sudokuAreaWidth / 10;
        var sudokuAreaY2 = sudokuAreaY + sudokuAreaHeight + sudokuAreaHeight / 10;
        var sudokuAreaWidth1 = sudokuAreaX2 - sudokuAreaX1;
        var sudokuAreaHeight1 = sudokuAreaY2 - sudokuAreaY1;

        // 将新的区域赋值给sudokuArea
        sudokuArea = new RectangleF(sudokuAreaX1, sudokuAreaY1, sudokuAreaWidth1, sudokuAreaHeight1);

        // 将原图像按照sudokuArea进行截图
        var pureSudokuImage = new Bitmap((int)sudokuAreaWidth1, (int)sudokuAreaHeight1);
        using (var g = Graphics.FromImage(sudokuImage))
        {
            g.DrawImage(image, new RectangleF(0, 0, sudokuAreaWidth1, sudokuAreaHeight1), sudokuArea, GraphicsUnit.Pixel);
        }
        #endregion 调用yolov7进行识别，并截取识别区域


        #region 用opencv进行图像处理精确数独区域并进行图像矫正
        // 初始化image为初始化mat，使用opencv进行灰度化、二值化处理
        var srcmat = OpenCvSharp.Extensions.BitmapConverter.ToMat(pureSudokuImage);

        var standardMat = GetStandardSudokuMat(srcmat);

        #endregion 用opencv进行图像处理精确数独区域并进行图像矫正

        #region 识别数字
        // 把这个图片切成9x9=81个小图片
        var sudokuImagesBase64 = new List<string>();
        var sudokuWidth = standardMat.Width / 9;
        var sudokuHeight = standardMat.Height / 9;
        for (int i = 0; i < 9; i++)
        {
            for (int j = 0; j < 9; j++)
            {
                var sudokuImageMat = standardMat[new OpenCvSharp.Rect(j * sudokuWidth, i * sudokuHeight, sudokuWidth, sudokuHeight)];
                // 再次找到最大的轮廓，不包含面积达到整个图片面积98%以上的
                var maxNumberAreaContour = FindMaxContour(sudokuImageMat);
                if (maxNumberAreaContour != null)
                {
                    var tmpImage = OpenCvSharp.Extensions.BitmapConverter.ToBitmap(sudokuImageMat);
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

        var numbers = SolveSudokuService.ScanSudoku(sudokuImagesBase64);
        #endregion 识别数字

        return numbers.ToArray();
    }


    private static OpenCvSharp.Point[] FindMaxContour(Mat srcmat)
    {
        var grayMat = new Mat();
        Cv2.CvtColor(srcmat, grayMat, ColorConversionCodes.BGR2GRAY);
        // medianBlur
        var medianMat = new Mat();
        Cv2.MedianBlur(grayMat, medianMat, 3);
        var gaussianMat = new Mat();
        Cv2.GaussianBlur(medianMat, gaussianMat, new OpenCvSharp.Size(3, 3), 0);

        //var kernelMat = Cv2.GetStructuringElement(MorphShapes.Ellipse, new OpenCvSharp.Size(11, 11));
        //var morphMat = new Mat();
        //Cv2.MorphologyEx(gaussianMat, morphMat, MorphTypes.Close, kernelMat);
        //var divMat = (kernelMat / morphMat);
        //var brightnessAdjustMat = new Mat(divMat, new Rect(0, 0, srcmat.Width, srcmat.Height));
        //Cv2.Normalize(divMat, brightnessAdjustMat, 0, 255, NormTypes.MinMax);

        var binaryImage = new Mat();
        Cv2.AdaptiveThreshold(gaussianMat, binaryImage, 255, AdaptiveThresholdTypes.GaussianC, ThresholdTypes.BinaryInv, 11, 7);

        ShowMatThumb(binaryImage, "bin", 720);

        // 查找轮廓
        OpenCvSharp.Point[][] contours;
        HierarchyIndex[] hierarchyIndex;
        Cv2.FindContours(binaryImage, out contours, out hierarchyIndex, RetrievalModes.External, ContourApproximationModes.ApproxSimple);

        // 过滤出所有面积在总面积50% - 80%范围的contours，返回最大的那个
        var maxArea = srcmat.Width * srcmat.Height * 0.8;
        var minArea = srcmat.Width * srcmat.Height * 0.5;
        var maxAreaIndex = 0;
        var maxAreaInIndex = 0;
        var foundContours = new List<OpenCvSharp.Point[]>();
        for (int i = 0; i < contours.Length; i++)
        {
            var area = Cv2.ContourArea(contours[i]);
            if (area > minArea && area < maxArea && maxAreaInIndex< area)
            {
                maxAreaIndex = i;
                foundContours.Add(contours[i]);
            }
        }
        return contours[maxAreaIndex];
    }
    private static Mat GetStandardSudokuMat(Mat srcmat)
    {
        var maxContour = FindMaxContour(srcmat);

        var tstMat = new Mat(srcmat, new OpenCvSharp.Rect(0, 0, srcmat.Width, srcmat.Height));
        // draw contours
        Cv2.DrawContours(tstMat, new OpenCvSharp.Point[][] { maxContour }, -1, new Scalar(0, 0, 255), 2);
        ShowMatThumb(tstMat, "contours", 720);


        // foundContours[0]里的点，分别计算出左上角、左下角、右上角、右下角这4个点
        // 以图像中心点为基准，分为四个象限，左上象限取x+y最小的点
        var points = maxContour;
        var leftTop = points.OrderBy(p => p.X + p.Y).First();
        var leftBottom = points.OrderBy(p => p.X - p.Y).First();
        var rightTop = points.OrderBy(p => p.X - p.Y).Last();
        var rightBottom = points.OrderBy(p => p.X + p.Y).Last();

        Console.WriteLine(leftTop);
        Console.WriteLine(leftBottom);
        Console.WriteLine(rightTop);
        Console.WriteLine(rightBottom);

        var srcPoints = new Point2f[]
        {
                new Point2f(leftTop.X, leftTop.Y),
                new Point2f(leftBottom.X, leftBottom.Y),
                new Point2f(rightBottom.X, rightBottom.Y),
                new Point2f(rightTop.X, rightTop.Y)
        };

        var dstPoints = new Point2f[]
        {
                new Point2f(0, 0),
                new Point2f(0, srcmat.Height),
                new Point2f(srcmat.Width, srcmat.Height),
                new Point2f(srcmat.Width, 0)
        };

        // 用opencv将srcMat按照srcPoints和dstPoints进行梯形矫正

        var warpTransform = Cv2.GetPerspectiveTransform(srcPoints, dstPoints);
        var warpMat = new Mat();
        Cv2.WarpPerspective(srcmat, warpMat, warpTransform, new OpenCvSharp.Size(srcmat.Width, srcmat.Height));
        return warpMat;
    }

    private static void ShowMatThumb(Mat mat, string winName, int targetWidth)
    {
        //var width = mat.Width;
        //var rate = targetWidth * 1.0F / width;
        //var targetHeight = (int)(mat.Height * rate);

        //var targetMat = new Mat();
        //Cv2.Resize(mat, targetMat, new OpenCvSharp.Size(targetWidth, targetHeight));
        //Cv2.ImShow(winName, targetMat);
        //Cv2.ResizeWindow(winName, targetWidth, targetHeight);
    }
}