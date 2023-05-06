using OpenCvSharp;
using System;
using System.Drawing;

namespace OpenCVTest
{
    internal class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello, World!");

            var bitmap = Bitmap.FromFile("C:\\Users\\JieTi\\Pictures\\sk1.jpg");
            var result = SolveSudokuService.RecognizeSudoku(bitmap);

            Console.WriteLine(result.ToString());
            Cv2.WaitKey();
        }
    }
}