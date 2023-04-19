using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SkiaSharp;
using System;
using System.Collections.Generic;
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
            return RecognizeSudokuService.ScanSudoku(requestData.base64Datas);
        }

    }

    public class ScanSudokuRequestData
    {
        public List<string> base64Datas { get; set; }
    }
}
