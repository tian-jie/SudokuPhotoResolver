## 基于tensorflow2.3的果蔬识别系统
hello，大家好，这里是dejahu，你也可以叫我肆十二，这里是果蔬识别的代码同时也是tensorflow物体分类的模板代码，希望能够帮助到你，有问题的小伙伴可以关注我的b站账号：dejahu，或者在b站视频下方留言，看到后我会及时回复大家的！

### 训练自己数据集的童鞋请看这里
这个代码可以作为训练自己分类模型的模板代码，只需要稍微改动几处，即可完成自己模型的构建和训练

csdn教程：[手把手教你用tensorflow2.3训练自己的分类数据集_dejavu的博客-CSDN博客](https://blog.csdn.net/ECHOSON/article/details/117964477)

B站视频：[手把手教你用tensorflow2训练自己的数据集](https://www.bilibili.com/video/BV1rX4y1A7N8)

数据集：[计算机视觉数据集清单-附赠tensorflow模型训练和使用教程_dejavu的博客-CSDN博客](https://blog.csdn.net/ECHOSON/article/details/117964438)

### 果蔬识别的童鞋请看这里
注：这里是果蔬识别的代码和模型

数据集太大无法在git上下载，请在下面这个网址下载数据集并放在代码的同级目录：
[果蔬识别数据集.zip-专业指导文档类资源-CSDN下载](https://download.csdn.net/download/ECHOSON/19404659)

对代码的详细解释请看文章：
[【02】水果蔬菜识别系统-基于tensorflow2.3开发_dejavu的博客-CSDN博客](https://blog.csdn.net/ECHOSON/article/details/117600329)


### 代码结构
主要是通过tensorflow训练两组模型来执行分类任务
模型的结构如下
```
images 目录主要是放置一些图片，包括测试的图片和ui界面使用的图片
models 目录下放置训练好的两组模型，分别是cnn模型和mobilenet的模型
results 目录下放置的是训练的训练过程的一些可视化的图，两个txt文件是训练过程中的输出，两个图是两个模型训练过程中训练集和验证集准确率和loss变化曲线
utils 是主要是我测试的时候写的一些文件，对这个项目没有实际的用途
get_data.py 爬虫程序，可以爬取百度的图片
window.py 是界面文件，主要是利用pyqt5完成的界面，通过上传图片可以对图片种类进行预测
testmodel.py 是测试文件，主要是用于测试两组模型在验证集上的准确率，这个信息你从results的txt的输出中也能获取
train_cnn.py 是训练cnn模型的代码
train_mobilenet.py 是训练mobilenet模型的代码
requirements.txt 是本项目需要的包
```

### 知识点
下面是关于卷积神经网络的教程，这些内容可以帮助你更深入的了解卷积神经网络
```
李老师讲解卷积神经网络: https://www.bilibili.com/video/BV1Lb411b7BS?from=search&seid=14069382285256773171
如何理解卷积神经网络（CNN）中的卷积和池化:https://www.zhihu.com/question/49376084/answer/712089980
轻量级CNN网络之MobileNetv2：https://zhuanlan.zhihu.com/p/52426865
```
