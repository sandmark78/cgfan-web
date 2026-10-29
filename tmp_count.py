#!/usr/bin/env python3
import json
with open('data/auto-collect/preprocessed.json', 'r') as f:
    d = json.load(f)
print(f'Preprocessed items: {len(d)}')
