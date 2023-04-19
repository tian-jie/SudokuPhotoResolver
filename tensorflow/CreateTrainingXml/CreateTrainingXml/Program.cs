// See https://aka.ms/new-console-template for more information
Console.WriteLine("Hello, World!");
const string template = @"
<annotation>
	<folder>testing</folder>
	<filename>##FILENUMBER##.jpg</filename>
	<path>C:\tensorflow\data\testing\##FILENUMBER##.jpg</path>
	<source>
		<database>Unknown</database>
	</source>
	<size>
		<width>32</width>
		<height>32</height>
		<depth>1</depth>
	</size>
	<segmented>0</segmented>
	<object>
		<name>sudoku</name>
		<pose>Unspecified</pose>
		<truncated>1</truncated>
		<difficult>0</difficult>
		<bndbox>
			<xmin>1</xmin>
			<ymin>1</ymin>
			<xmax>32</xmax>
			<ymax>32</ymax>
		</bndbox>
	</object>
</annotation>
";


const string imgbasefolder = "C:\\tensorflow\\data\\testing";
const string xmlbasefolder = "C:\\tensorflow\\data\\testing\\xml";
var files = Directory.EnumerateFiles(imgbasefolder);
foreach (var filename in files)
{
    var file = new FileInfo(filename);
    var shortFilename = file.Name;
    var filenameNoExt = file.Name.Substring(0, shortFilename.IndexOf('.'));
    Console.WriteLine(filenameNoExt);

    if (!file.Exists)
    {
        break;
    }

    var xmlContent = template.Replace("##FILENUMBER##", filenameNoExt);

	var xmlFilename = filenameNoExt + ".xml";
	using (StreamWriter sw = new StreamWriter(xmlbasefolder + "\\" + xmlFilename))
	{
		await sw.WriteAsync(xmlContent);
	}
}