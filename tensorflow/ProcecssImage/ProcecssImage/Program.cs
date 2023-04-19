// See https://aka.ms/new-console-template for more information
using OpenCvSharp;

Console.WriteLine("Hello, World!");
var basefolder = "c:\\tensorflow\\data";

var files = Directory.EnumerateFiles(basefolder + "\\src\\sudoku");
var index = 0;
foreach (var file in files)
{
    try
    {
        var srcMat = Cv2.ImRead(file, ImreadModes.AnyColor);
        var smallsrcMat = srcMat.Resize(new Size(32, 32));
        var grayMat = new Mat();
        if (smallsrcMat.Channels() == 3)
        {
            Cv2.CvtColor(smallsrcMat, grayMat, ColorConversionCodes.BGR2GRAY);
        }
        else
        {
            grayMat = smallsrcMat;
        }


        var binaryMat = new Mat();
        Cv2.Threshold(grayMat, binaryMat, 100, 255, ThresholdTypes.BinaryInv);

        var points = Cv2.FindContoursAsArray(binaryMat, RetrievalModes.CComp, ContourApproximationModes.ApproxSimple);
        var maxContour = points.OrderBy(a => Cv2.ContourArea(a)).First();
        //var maxContour = points[0];
        //Cv2.MedianBlur(binaryMat, binaryMat, 3);


        //// 计算四个角的顶点
        //var centerPoint = new Point(srcMat.Width/2, srcMat.Height/2);

        //var leftTopPoint = new Point(srcMat.Width/2, srcMat.Height/2);

        // 透视变换
        var outfileName = $"{index++.ToString("D5")}.jpg";

        Console.WriteLine($"processing {file} - {outfileName} ...");
        binaryMat.SaveImage($"{basefolder}\\testing\\{outfileName}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($" - file: {file}, Exception: {ex.Message}");
    }

}


Point GetVertexPoint(Point[] points, bool positiveX, bool positiveY, Point centerPoint)
{

    throw new NotImplementedException();
}