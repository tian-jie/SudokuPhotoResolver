#将原始图片转换成需要的大小，并将其保存
import os
import tensorflow.compat.v1 as tf
from PIL import Image

tf.disable_v2_behavior()

print(tf.__version__)

#原始图片地址
orig_picture = r'C:\tensorflow\data\src'

#生成图片地址
gen_picture = r'C:\tensorflow\data\generate_data'

#需要识别的物体类型
classes = {"sudoku"}

#样本总数
num_samples = 108

#制作TFRecord数据
#def create_record():
writer = tf.io.TFRecordWriter("sudoku_train.tfrecords")#定义生成的文件名为sudoku_train.records
#定义Writer用于写入数据，tf.python_io.TfRecordWriter()写入到TFRecords中
for index,name in enumerate(classes):
    print("processing folder - " + name)
    class_path = orig_picture + "/"+ name +"/"
    for img_name in os.listdir(class_path):
        print("processing image - " + img_name)

        img_path = class_path + img_name    #每张图片地址
        img = Image.open(img_path)
        img = img.resize((224,224))     #将图片更改后的大小
        img_raw = img.tobytes()     #将图片转化为原生bytes
        # tf.train.Example 协议内存块包含了Features字段，通过feature将图片的二进制数据和label进行统一封装
        example = tf.train.Example(features=tf.train.Features(feature={
            "label":tf.train.Feature(int64_list=tf.train.Int64List(value=[index])),
            "img_raw":tf.train.Feature(bytes_list=tf.train.BytesList(value=[img_raw]))
        }))#example对象对label和image进行封装
        writer.write(example.SerializeToString())   #序列化为字符串
writer.close()

#读取TFRecord数据和解码
def read_and_decode(filename):  #读入flower_train.tfrecords
    filename_queue = tf.train.string_input_producer([filename]) #生成一个queue队列

    reader = tf.TFRecordReader()
    _,serialized_example = reader.read(filename_queue)
    features = tf.parse_single_example(serialized_example,
                                       features={
                                           'label':tf.FixedLenFeature([],tf.int64),
                                           'img_raw':tf.FixedLenFeature([],tf.string)
                                       })       #将image数据和label取出来
    label = features['label']
    img = features['img_raw']
    img = tf.decode_raw(img,tf.uint8)
    img = tf.reshape(img,[224,224,3])   #reshape为224*224的3通道图片
    #归一化
    #img = tf.cast(img,tf.float32)*(1./255)-0.5      #在流中抛出img张量
    label = tf.cast(label,tf.int32)    #在流中抛出label张量
    return img,label

#在显示的时候把归一化操作注释掉，但是在进行数据预处理的时候需要加上，下面的图片是进行归一化之后的显示结果。
if __name__ == '__main__':
    batch = read_and_decode('sudoku_train.tfrecords')

    init_op = tf.group(tf.global_variables_initializer(),tf.local_variables_initializer())

    dict={}     #字典

    with tf.Session() as sess:
        #init_op = tf.global_variables_initializer()
        sess.run(init_op)
        coord = tf.train.Coordinator()
        threads = tf.train.start_queue_runners(coord=coord)

        for i in range(num_samples):
            example, lab =sess.run(batch)   #在会话中取出image和label
            img = Image.fromarray(example,'RGB')

            if dict.get(lab) == None:
                dict[lab] = 1
            else:
                dict[lab] = dict[lab] + 1
            img.save(gen_picture+'/'+str(lab) + '/' + str(dict[lab]-1)+'_samples_'+str(lab)+'.jpg')
            print(example, lab)
        coord.request_stop()
        coord.join(threads)
        sess.close()