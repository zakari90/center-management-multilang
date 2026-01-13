import json
import os

def load_keys(filepath, prefix=""):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    keys = set()
    def recurse(d, current_prefix):
        if isinstance(d, dict):
            for k, v in d.items():
                new_prefix = f"{current_prefix}.{k}" if current_prefix else k
                keys.add(new_prefix)
                recurse(v, new_prefix)
    
    recurse(data, "")
    return keys

try:
    en_keys = load_keys('dictionary/en.json')
    fr_keys = load_keys('dictionary/fr.json')
    ar_keys = load_keys('dictionary/ar.json')

    with open('missing_keys_output.txt', 'w', encoding='utf-8') as out:
        out.write("Missing in FR (present in EN):\n")
        for k in sorted(en_keys - fr_keys):
            out.write(k + '\n')

        out.write("\nMissing in AR (present in EN):\n")
        for k in sorted(en_keys - ar_keys):
            out.write(k + '\n')

        out.write("\nMissing in EN (present in FR):\n")
        for k in sorted(fr_keys - en_keys):
            out.write(k + '\n')

        out.write("\nMissing in EN (present in AR):\n")
        for k in sorted(ar_keys - en_keys):
            out.write(k + '\n')

except Exception as e:
    print(e)
