# C:\Users\Scm97\Desktop\单子\新_肿瘤图像_一部_400\data\src

from scipy.io import loadmat, savemat
import h5py
import numpy as np
import cv2
import os


def read_data(folder_path):
    # 1
    # for meningioma, 2 for glioma, 3 for pituitary
    save_folder = "../data/src_image/train"
    names = ["meningioma", "glioma", "pituitary"]
    for mat_name in os.listdir(folder_path):
        mat_path = os.path.join(folder_path, mat_name)
        mat = h5py.File(mat_path)
        cjdata = mat['cjdata']
        image = np.array(cjdata['image'])
        label = int(np.array(cjdata['label'])[0][0]) - 1
        label_name = names[label]
        save_name = mat_name.split(".")[0] + ".png"
        save_path = os.path.join(os.path.join(save_folder, label_name), save_name)
        cv2.imwrite(save_path, image)
        print(save_path, "已保存")


if __name__ == '__main__':
    # read_data(folder_path="../data/src/brainTumorDataPublic_1-766/")
    read_data(folder_path="../data/src/brainTumorDataPublic_767-1532/")
    read_data(folder_path="../data/src/brainTumorDataPublic_1533-2298/")
    read_data(folder_path="../data/src/brainTumorDataPublic_2299-3064/")