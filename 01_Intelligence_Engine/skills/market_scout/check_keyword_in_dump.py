import sys
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

path = "data/debug/list_content.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

keyword = "行情汇总"
if keyword in content:
    print(f"Found '{keyword}' in HTML!")
    idx = content.find(keyword)
    print("Snippet:", content[idx-100:idx+200])
else:
    print(f"NOT found '{keyword}' in HTML.")
