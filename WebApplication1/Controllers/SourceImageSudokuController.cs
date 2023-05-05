using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
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
        private readonly ILogger<ResolveSudokuController> _logger;

        public SourceImageSudokuController(ILogger<ResolveSudokuController> logger)
        {
            _logger = logger;
        }


        [HttpPost]
        public async Task<SourceImageSudokuResponseData> Post(List<IFormFile> files)
        {
            long size = files.Sum(f => f.Length);

            foreach (var formFile in files)
            {
                string fileName = Guid.NewGuid().ToString() + ".png";
                string filePath = Path.Combine("sourceImages", fileName);

                if (formFile.Length > 0)
                {
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await formFile.CopyToAsync(stream);
                    }
                }
            }

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
