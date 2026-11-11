"""Read-only local SAM2 readiness check; no download or model inference."""
import sys, json, hashlib, os
os.environ['HF_HUB_OFFLINE']='1'
os.environ['TRANSFORMERS_OFFLINE']='1'
try:
    if sys.version_info < (3,10): raise ValueError('Cần Python 3.10 trở lên.')
    import numpy
    from PIL import Image
    import torch
    from transformers import Sam2VideoModel, Sam2VideoProcessor
    if not torch.cuda.is_available(): raise ValueError('Torch chưa dùng được CUDA; kiểm driver và bản Torch CUDA.')
    value=(torch.ones(2,device='cuda')*2).sum().item()
    if value!=4: raise ValueError('Phép thử CUDA thất bại.')
    folder=sys.argv[1]
    for name in ['config.json','preprocessor_config.json','video_preprocessor_config.json','processor_config.json']:
        with open(os.path.join(folder,name),encoding='utf8') as stream: json.load(stream)
    h=hashlib.sha256()
    with open(os.path.join(folder,'model.safetensors'),'rb') as stream:
        for block in iter(lambda:stream.read(1048576),b''): h.update(block)
    if h.hexdigest()!='48c14467e5cf9e51870511feb72c89688e82dd74523142c0538b663e193ac2a7': raise ValueError('Model SAM2 không khớp SHA256 đã chốt.')
    print(json.dumps({'ready':True,'python':sys.version.split()[0],'torch':torch.__version__,'transformersSam2':True,'cuda':torch.version.cuda,'device':torch.cuda.get_device_name(0),'modelSha256':h.hexdigest()}))
except Exception as error:
    print(json.dumps({'ready':False,'detail':str(error)}))
    sys.exit(1)
