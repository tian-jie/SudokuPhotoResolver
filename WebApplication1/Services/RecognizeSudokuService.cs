using SkiaSharp;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Tesseract;

public static class RecognizeSudokuService
{
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
        SKImage srcBitmap = null;
        using (MemoryStream ms = new MemoryStream(bytes))
        {
            srcBitmap = SKImage.FromEncodedData(ms);
            ms.Close();
        }
        var filename = System.AppDomain.CurrentDomain.BaseDirectory + "tmp\\" + DateTime.Now.Ticks + _index++ + ".png";
        using (var skData = srcBitmap.Encode(SKEncodedImageFormat.Png, 90))
        {
            using (var stream = new StreamWriter(filename))
            {
                stream.Write(skData.ToArray());
            }
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

}