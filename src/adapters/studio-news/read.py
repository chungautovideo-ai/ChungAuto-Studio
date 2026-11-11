import json
import sys
from pathlib import Path
# Python nhúng (._pth) bỏ qua PYTHONPATH và thư mục script: tự thêm thư mục này và lxml đóng gói sẵn.
sys.path[:0] = [str(Path(__file__).resolve().parent), str(Path(__file__).resolve().parents[3] / 'tools' / 'preset-fields')]
import ingest

sys.stdout.reconfigure(encoding='utf-8')
sys.stdin.reconfigure(encoding='utf-8')
try:
    request = json.load(sys.stdin)
    if request.get('html') is not None:
        article = ingest.parse_html(request['html'], request['url'])
        article['warnings'].append('HTML do người dùng nhập; chưa tải URL hoặc kiểm robots.txt.')
    else:
        article = ingest.ingest(request['url'], timeout=10, total_timeout=22,
                                max_bytes=2 * 1024 * 1024, respect_robots=True,
                                allow_private=False)
    if not article.get('ok'):
        raise ingest.IngestError('NO_ARTICLE', 'Không trích được bài báo. Dán trích đoạn đã đọc vào form.')
    print(json.dumps({'article': article, 'facts': ingest.facts_doc(article, max_facts=80)}, ensure_ascii=False))
except ingest.IngestError as error:
    print(json.dumps({'error': error.to_dict()}, ensure_ascii=False))
    sys.exit(2)
except Exception as error:
    print(json.dumps({'error': {'code': 'READ_FAILED', 'message': str(error)}}, ensure_ascii=False))
    sys.exit(2)
