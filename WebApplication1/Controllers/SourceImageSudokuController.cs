using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using OpenCvSharp;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Tesseract;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class SourceImageSudokuController : ControllerBase
    {
        private readonly ILogger<SourceImageSudokuController> _logger;

        public SourceImageSudokuController(ILogger<SourceImageSudokuController> logger)
        {
            _logger = logger;
        }


        [HttpPost]
        public async Task<SourceImageSudokuResponseData> Post(List<IFormFile> files)
        {
            if (files.Count == 0)
            {
                return new SourceImageSudokuResponseData()
                {
                    status = 500,
                    errorMessage = "invalid source image file - filesCount=0"
                };
            }

            var formFile = files[0];
            if (formFile.Length == 0)
            {
                return new SourceImageSudokuResponseData()
                {
                    status = 500,
                    errorMessage = "invalid source image file - fileSize=0"
                };
            }

            string fileName = Guid.NewGuid().ToString() + ".png";
            string filePath = Path.Combine("sourceImages", fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await formFile.CopyToAsync(stream);
            }


            Bitmap bitmap = new Bitmap(Image.FromFile(filePath));
            // 保存完文件后开始直接在服务器端解析数独
            var result = SolveSudokuService.RecognizeSudoku(bitmap);

            return new SourceImageSudokuResponseData()
            {
                status = 0,
                errorMessage = "success"
            };
        }




        public class SourceImageSudokuRequestData
        {
            public string imageBase64Data { get; set; }
        }
        public class SourceImageSudokuResponseData
        {
            public int status { get; set; }
            public string errorMessage { get; set; }
        }
    }

}
