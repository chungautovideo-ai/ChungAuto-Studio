import json, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'tools' / 'preset-fields'))
from lxml import html

data = json.load(sys.stdin)
root = html.fragment_fromstring(data['html'], create_parent='div')
read_values = []
for index, field in enumerate(data['fields']):
    parts = field['sel'].split()
    xpath = '.'
    for part in parts:
        if not re.fullmatch(r'(?:[a-zA-Z][\w-]*)?(?:[.#][\w-]+)+|[a-zA-Z][\w-]*', part):
            raise ValueError('Selector chưa hỗ trợ')
        tag = re.match(r'^[a-zA-Z][\w-]*', part)
        xpath += '//' + (tag.group() if tag else '*')
        for kind, name in re.findall(r'([.#])([\w-]+)', part):
            xpath += "[@id='%s']" % name if kind == '#' else "[contains(concat(' ',normalize-space(@class),' '),' %s ')]" % name
    nodes = root.xpath(xpath)
    if len(nodes) != 1:
        raise ValueError('Trường phải khớp đúng một phần tử')
    node = nodes[0]
    if node.tag.lower() in ('script', 'style', 'svg', 'img', 'iframe'):
        raise ValueError('Trường không phải văn bản')
    if data.get('readOnly'):
        read_values.append(node.text_content())
        continue
    value = data['values'][index]
    for child in list(node):
        node.remove(child)
    node.text = None
    if field.get('words'):
        for word in value.split():
            child = html.Element('span', {'class': 'w'})
            child.text = word
            child.tail = ' '
            node.append(child)
    else:
        node.text = value
result = (root.text or '') + ''.join(html.tostring(child, encoding='unicode') for child in root)
print(json.dumps({'values': read_values} if data.get('readOnly') else {'html': result}, ensure_ascii=False))
