import importlib.util
from pathlib import Path
spec = importlib.util.spec_from_file_location('plate_suggest', Path(__file__).resolve().parents[1]/'editor/tools/plate-suggest.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
box = lambda x,y,w,h: [[x,y],[x+w,y],[x+w,y+h],[x,y+h]]
assert module.plate_like('51F-123.45')
assert module.plate_like('29A 1234')
assert not module.plate_like('SALE 50%')
assert not module.plate_like('2026')
assert not module.plate_like('Hotline 0901234567')
assert not module.plate_like('X51F12345X')
assert len(module.proposals([[box(20,20,60,15),'51F-12345',.99]],100,100)) == 1
assert module.proposals([[box(20,20,60,15),'51F-12345',.4]],100,100) == []
assert len(module.proposals([[box(20,20,60,15),'51F',.99],[box(20,38,60,15),'12345',.98]],100,100)) == 1
assert module.proposals([[box(20,20,60,15),'51F',.99],[box(20,80,60,15),'12345',.98]],100,100) == []
assert module.proposals([[box(20,20,30,15),'51F',.99],[box(70,38,25,15),'12345',.98]],100,100) == []
assert len(module.proposals([[box(20,20,60,15),'51F-12345',.99]]*2,100,100)) == 1
print('Plate proposal cases passed: text, confidence, two-line geometry and duplicate filtering.')

assert module.proposals([[box(0,20,100,15),'51F-12345',.99]],100,100)[0]['touchesFrame'] is True
assert module.proposals([[box(30,30,30,15),'51F-12345',.99]],100,100)[0]['touchesFrame'] is False
