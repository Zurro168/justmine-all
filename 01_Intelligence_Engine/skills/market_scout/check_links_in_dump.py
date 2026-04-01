import re
path = "data/debug/list_content.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
    
links = re.findall(r'href="([^"]*p_[0-9]*\.aspx[^"]*)"', content)
print(f"Total hrefs with p_: {len(links)}")
for l in links[:20]:
    print(l)
