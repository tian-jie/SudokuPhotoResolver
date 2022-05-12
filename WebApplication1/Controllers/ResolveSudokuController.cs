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
    public class ResolveSudokuController : ControllerBase
    {
        private readonly ILogger<ResolveSudokuController> _logger;

        public ResolveSudokuController(ILogger<ResolveSudokuController> logger)
        {
            _logger = logger;
        }

        [HttpPost]
        public ResolveSudokuResponseData Post(ResolveSudokuRequestData requestData)
        {
            try
            {
                var result = SolveSudokuService.SolveSudoku(requestData.numbers);
                return new ResolveSudokuResponseData()
                {
                    errorMessage = "ok",
                    hasResult = true,
                    numbers = result
                };
            }
            catch(Exception ex)
            {
                return new ResolveSudokuResponseData()
                {
                    errorMessage = ex.Message,
                    hasResult = false,
                    numbers = null
                };
            }
        }

        public class ResolveSudokuRequestData
        {
            public int[] numbers { get; set; }
        }
        public class ResolveSudokuResponseData
        {
            public bool hasResult { get; set; }
            public int[] numbers { get; set; }
            public string errorMessage { get; set; }
        }
    }

}
