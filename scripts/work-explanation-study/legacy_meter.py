"""Constructed predecessor CLI. Retain this original; author adaptations separately."""
import csv
import json
from decimal import Decimal
from pathlib import Path
import sys

def calculate(manifest_path):
    manifest_path = Path(manifest_path)
    contract = json.loads(manifest_path.read_text())
    sites = {}
    with (manifest_path.parent / contract['file']).open(newline='') as stream:
        for row in csv.DictReader(stream):
            value = Decimal(row['reading'])
            item = sites.setdefault(row['site'], dict(net=Decimal(0), imported=Decimal(0), exported=Decimal(0), events=0))
            item['net'] += value
            item['imported'] += max(value, Decimal(0))
            item['exported'] += max(-value, Decimal(0))
            item['events'] += 1
    return {'period': contract['period'], 'unit': 'kWh', 'sites': [
        {'site': site, 'net_kwh': format(v['net'], '.3f'), 'import_kwh': format(v['imported'], '.3f'),
         'export_kwh': format(v['exported'], '.3f'), 'events': v['events']}
        for site, v in sorted(sites.items())], 'net_kwh': format(sum(v['net'] for v in sites.values()), '.3f')}

if __name__ == '__main__':
    source, target = map(Path, sys.argv[1:])
    if target.exists():
        print('retained existing report')
    else:
        target.write_text(json.dumps(calculate(source), indent=2) + '\n')
        print('wrote report')
