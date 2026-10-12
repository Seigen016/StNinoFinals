"""Builds public/ph-address/ from the PSGC-based dataset that the
select-philippines-address package fetches at runtime, so the app serves the
data itself instead of depending on a third-party site.

  python3 tools/build-ph-address.py

Output: places.json (provinces + cities, ~70KB) and barangays/<province>.json
(loaded only after a province is picked). Entries are [code, name].
"""
import json, os, re, urllib.request

SRC = 'https://isaacdarcilla.github.io/philippine-addresses/{}.json'
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'ph-address')

def get(name):
    with urllib.request.urlopen(SRC.format(name)) as r:
        return json.load(r)

def province_name(p):
    n = p['province_name']
    if p['region_code'] == '13':  # NCR districts are listed as "Ncr, Second District" etc.
        n = re.sub(r'^Ncr,\s*', '', n)
        return 'Metro Manila - ' + n
    return n

def city_name(n):
    return re.sub(r'\s*\(Capital\)$', '', n).strip()

provinces, cities, barangays = get('province'), get('city'), get('barangay')

seen = {}
for p in provinces:  # the dataset repeats some codes (e.g. City of Manila); keep the first
    seen.setdefault(p['province_code'], province_name(p))
places = {
    'provinces': sorted(([c, n] for c, n in seen.items()), key=lambda x: x[1]),
    'cities': {},
}
for c in cities:
    places['cities'].setdefault(c['province_code'], []).append([c['city_code'], city_name(c['city_name'])])
for lst in places['cities'].values():
    lst.sort(key=lambda x: x[1])

by_province = {}
for b in barangays:
    by_province.setdefault(b['province_code'], {}).setdefault(b['city_code'], []).append([b['brgy_code'], b['brgy_name']])

os.makedirs(os.path.join(OUT, 'barangays'), exist_ok=True)
with open(os.path.join(OUT, 'places.json'), 'w') as f:
    json.dump(places, f, separators=(',', ':'), ensure_ascii=False)
for prov, by_city in by_province.items():
    for lst in by_city.values():
        lst.sort(key=lambda x: x[1])
    with open(os.path.join(OUT, 'barangays', f'{prov}.json'), 'w') as f:
        json.dump(by_city, f, separators=(',', ':'), ensure_ascii=False)

print(len(places['provinces']), 'provinces,', len(cities), 'cities,', len(barangays), 'barangays')
