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
    public class ScanSudokuController : ControllerBase
    {
        private readonly ILogger<ScanSudokuController> _logger;

        public ScanSudokuController(ILogger<ScanSudokuController> logger)
        {
            _logger = logger;
        }

        [HttpPost]
        public IEnumerable<int> Post(ScanSudokuRequestData requestData)
        {
            return ScanSudoku(requestData.base64Datas);
        }


        protected List<int> ScanSudoku(List<string> ss)
        {
            var numbers = new List<int>();
  
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

    public class ScanSudokuRequestData
    {
        public List<string> base64Datas { get; set; }
    }
}
