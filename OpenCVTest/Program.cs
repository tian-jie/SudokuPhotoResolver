using OpenCvSharp;
using System;
using System.Drawing;
using System.Drawing.Printing;

namespace OpenCVTest
{
    internal class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello, World!");

            var bitmap = Image.FromFile("C:\\Users\\JieTi\\Pictures\\20230507121621.jpg");

                var result = SolveSudokuService.RecognizeSudoku(bitmap);

                for (var i = 0; i < 9; i++)
                {
                    if (i % 3 == 0)
                    {
                        Console.WriteLine("+ - - - + - - - + - - - +");
                    }
                    Console.WriteLine(PrintNumber(result, i * 9));

                }
                Console.WriteLine("+ - - - + - - - + - - - +");



            Cv2.WaitKey();
        }

        private static string PrintNumber(int[] numbers, int index)
        {
            return $"| {ChangeNumberZeroToDot(numbers[index + 0])} {ChangeNumberZeroToDot(numbers[index + 1])} {ChangeNumberZeroToDot(numbers[index + 2])} | {ChangeNumberZeroToDot(numbers[index + 3])} {ChangeNumberZeroToDot(numbers[index + 4])} {ChangeNumberZeroToDot(numbers[index + 5])} | {ChangeNumberZeroToDot(numbers[index + 6])} {ChangeNumberZeroToDot(numbers[index + 7])} {ChangeNumberZeroToDot(numbers[index + 8])} |";
        }
        private static char ChangeNumberZeroToDot(int number)
        {
            return number == 0 ? '.' : number.ToString()[0];
        }
    }
}