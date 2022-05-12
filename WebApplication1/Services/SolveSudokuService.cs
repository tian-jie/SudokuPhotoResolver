using System.Collections.Generic;
using System.Linq;

public static class SolveSudokuService
{
    public static int[] SolveSudoku(int[] board)
    {
        // 先转成int的一维数组
        var boardint = new int[81];

        // 先做一个大表格
        var all = new Dictionary<int, List<int>>();
        for (var i = 0; i < 81; i++)
        {
            if (board[i] == 0)
            {
                all.Add(i, new List<int>() { 1, 2, 3, 4, 5, 6, 7, 8, 9 });
            }
            else
            {
                boardint[i] = board[i];
            }
        }

        var isSolved = Solve(boardint, all);

        if (!isSolved)
        {
            throw new System.Exception("Not result");
        }
        return boardint;
    }

    private static bool Solve(int[] board, Dictionary<int, List<int>> unsolved)
    {
        if (unsolved.Count == 0)
        {
            // 解出来了
            return true;
        }
        var isValid = false;

        while (Filter(board, unsolved, out isValid)) ;

        if (!isValid)
        {
            return false;
        }
        if (unsolved.Count == 0)
        {
            return true;
        }

        //if (isValid && unsolved.Count > 0)
        //{
        // 解不出来了，需要假设一个继续递归
        // 找一个最少的开始循环
        var less = 9;
        var lessIndex = 0;
        for (var i = 0; i < 81; i++)
        {
            if (unsolved.Keys.Contains(i))
            {
                var cnt = unsolved[i].Count;
                if (cnt < less)
                {
                    less = unsolved[i].Count;
                    lessIndex = i;
                }
            }
        }

        // 开始递归
        foreach (var i in unsolved[lessIndex])
        {
            // 复制现场环境
            var newBoard = new int[81];
            for (var j = 0; j < 81; j++)
            {
                newBoard[j] = board[j];
            }
            newBoard[lessIndex] = i;

            var newUnsolved = new Dictionary<int, List<int>>();
            foreach (var j in unsolved.Keys)
            {
                if (j == lessIndex)
                {
                    continue;
                }
                var list = new List<int>();
                newUnsolved.Add(j, list);
                foreach (var e in unsolved[j])
                {
                    list.Add(e);
                }
            }
            // -- 现场环境复制完成
            if (Solve(newBoard, newUnsolved))
            {
                for (var j = 0; j < 81; j++)
                {
                    board[j] = newBoard[j];
                }
                return true;
            }

        }
        //}
        return false;
    }

    private static bool Filter(int[] board, Dictionary<int, List<int>> unsolved, out bool isValid)
    {
        var isChanged = false;
        isValid = true;

        // 然后针对每个格子，计算行、列、小方格的数字，进行排除
        for (var i = 0; i < 81; i++)
        {
            if (!unsolved.Keys.Contains(i))
            {
                continue;
            }
            var m = i / 9;
            var n = i % 9;
            var list = unsolved[i];

            for (var j = 0; j < 9; j++)
            {
                if (j == n)
                {
                    continue;
                }
                var xx = m * 9 + j;
                if (list.Contains(board[xx]))
                {
                    list.Remove(board[xx]);
                    isChanged = true;
                }
            }

            for (var j = 0; j < 9; j++)
            {
                if (j == m)
                {
                    continue;
                }
                var xx = j * 9 + n;
                if (list.Contains(board[xx]))
                {
                    list.Remove(board[xx]);
                    isChanged = true;
                }
            }

            for (var x = m - m % 3; x < m - m % 3 + 3; x++)
            {
                for (var y = n - n % 3; y < n - n % 3 + 3; y++)
                {
                    if (x == m && y == n)
                    {
                        continue;
                    }
                    var xx = x * 9 + y;
                    if (list.Contains(board[xx]))
                    {
                        list.Remove(board[xx]);
                        isChanged = true;
                    }
                }
            }


            if (isChanged && list.Count == 1)
            {
                board[i] = list[0];
                unsolved.Remove(i);
            }

            if (unsolved.Count == 0)
            {
                // 无解，返回
                isValid = false;
            }
        }

        return isChanged;
    }

}