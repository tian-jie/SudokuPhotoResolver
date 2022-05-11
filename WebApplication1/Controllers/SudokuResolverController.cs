using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using Tesseract;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class SudokuResolverController : ControllerBase
    {
        private readonly ILogger<SudokuResolverController> _logger;

        public SudokuResolverController(ILogger<SudokuResolverController> logger)
        {
            _logger = logger;
        }

        [HttpPost]
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Interoperability", "CA1416:Validate platform compatibility", Justification = "<Pending>")]
        public IEnumerable<int> Post(RequestData requestData)
        {
            return ScanSudoku(requestData.base64Datas);
        }


        protected List<int> ScanSudoku(List<string> ss)
        {
            var numbers = new List<int>();
            var gridWidth = 40;
            var gridHeight = 40;

            //// Fast Dictionary
            //Ocr.Language = OcrLanguage.EnglishFast;

            //// Latest Engine 
            //Ocr.Configuration.TesseractVersion = TesseractVersion.Tesseract5;

            ////AI OCR only without font analysis
            //Ocr.Configuration.EngineMode = TesseractEngineMode.LstmOnly;

            ////Turn off unneeded options
            //Ocr.Configuration.ReadBarCodes = false;
            //Ocr.Configuration.RenderSearchablePdfsAndHocr = false;

            // Assume text is laid out neatly in an orthagonal document
            //Ocr.Configuration.PageSegmentationMode = TesseractPageSegmentationMode.Auto;


            // 对blackMat裁剪9x9

            using (var engine = new TesseractEngine(System.AppDomain.CurrentDomain.BaseDirectory + "tessdata", "digits", EngineMode.Default))
            {
                engine.DefaultPageSegMode = PageSegMode.SingleChar;
                for (var i = 0; i < 81; i++)
                {
                    // 接受图片
                    if (string.IsNullOrEmpty(ss[i]))
                    {
                        numbers.Add(0);
                        continue;
                    }
                    var bytes = Convert.FromBase64String(ss[i]);
                    Bitmap srcBitmap = null;
                    using (MemoryStream ms = new MemoryStream(bytes))
                    {
                        srcBitmap = new Bitmap(ms);
                        ms.Close();
                    }
                    var filename = System.AppDomain.CurrentDomain.BaseDirectory + "tmp\\" + i + ".png";
                    srcBitmap.Save(filename, System.Drawing.Imaging.ImageFormat.Png);


                    using (var img = Pix.LoadFromFile(filename))
                    {
                        using (var page = engine.Process(img))
                        {
                            var n = page.GetText();
                            int result = 0;
                            if (isNumberic(n, out result))
                            {
                                numbers.Add(result);
                            }
                            else
                            {
                                numbers.Add(0);
                            }
                        }
                    }

                }
            }

            return numbers;
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
    }

    public class RequestData
    {
        public List<string> base64Datas { get; set; }
    }
}
