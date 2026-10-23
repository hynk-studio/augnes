"""Evaluator-only independent integer arithmetic; never an arm's implementation."""
import csv
import json
import re
import sys
from pathlib import Path

def milli_kwh(text, unit):
    # String/integer arithmetic deliberately independent of the CLI's Decimal path.
    if not isinstance(text, str) or not re.fullmatch(r'-?(?:0|[1-9][0-9]*)(?:\.[0-9]{1,3})?', text):
        raise ValueError('invalid exact decimal')
    sign = -1 if text.startswith('-') else 1
    whole, _, fraction = text.lstrip('-').partition('.')
    numerator = sign * (int(whole) * 1000 + int(fraction.ljust(3, '0') or '0'))
    divisor = {'Wh':1000, 'kWh':1}[unit]
    if numerator % divisor:
        raise ValueError('sub-Wh precision is outside the declared input domain')
    return numerator // divisor

def formatted(n):
    return ('-' if n < 0 else '') + str(abs(n)//1000) + '.' + str(abs(n)%1000).zfill(3)

def expected(path):
    contract = json.loads(path.read_text())
    sites = {}
    seen = set()
    with (path.parent / contract['file']).open(newline='') as stream:
        reader = csv.DictReader(stream)
        assert reader.fieldnames == ['event_id','site','reading']
        for row in reader:
            assert row['event_id'] not in seen
            seen.add(row['event_id'])
            v = milli_kwh(row['reading'], contract['unit'])
            s = sites.setdefault(row['site'], [0,0,0,0])
            s[0] += v; s[1] += max(v,0); s[2] += max(-v,0); s[3] += 1
    rows = [dict(site=k, net_kwh=formatted(v[0]), import_kwh=formatted(v[1]), export_kwh=formatted(v[2]), events=v[3]) for k,v in sorted(sites.items())]
    return dict(period=contract['period'],unit='kWh',sites=rows,net_kwh=formatted(sum(v[0] for v in sites.values())))

def check_a(root, output):
    actual = json.loads(Path(output).read_text())
    want = expected(Path(root)/'task-a/meter.json')
    assert actual == want, 'A meaning/format/coverage mismatch'
    # bool and int compare equal in Python: reject booleans explicitly.
    assert all(type(x['events']) is int for x in actual['sites'])
    return {'task':'A','status':'PASS','sites':len(want['sites']),'events':sum(x['events'] for x in want['sites'])}

def expected_b(root):
    monthly=[]; total=[0,0,0]; imports={}
    for path in sorted((Path(root)/'task-b').glob('*.json')):
        raw=json.loads(path.read_text()); result=expected(path)
        for s in result['sites']:
            values=[milli_kwh(s[k], 'kWh') for k in ('net_kwh','import_kwh','export_kwh')]
            for i,v in enumerate(values):total[i]+=v
            imports[s['site']]=imports.get(s['site'],0)+values[1]
            monthly.append(dict(period=raw['period'],**s,over_import_limit='true' if values[1]>milli_kwh(raw['import_limits_kwh'][s['site']],'kWh') else 'false'))
    monthly.sort(key=lambda r:(r['period'],r['site']))
    portfolio=dict(unit='kWh',periods=sorted(set(x['period'] for x in monthly)),net_kwh=formatted(total[0]),import_kwh=formatted(total[1]),export_kwh=formatted(total[2]),highest_import_site=sorted(imports,key=lambda k:(-imports[k],k))[0])
    return monthly,portfolio

def check_b(root, output):
    rows, portfolio=expected_b(root)
    with (Path(output)/'monthly.csv').open(newline='') as stream:
        reader=csv.DictReader(stream)
        assert reader.fieldnames==['period','site','net_kwh','import_kwh','export_kwh','events','over_import_limit'], 'B columns'
        actual=list(reader)
    want=[{k:str(v) for k,v in r.items()} for r in rows]
    assert actual==want, 'B per-period/site meaning/units/limits mismatch'
    assert json.loads((Path(output)/'portfolio.json').read_text())==portfolio, 'B portfolio mismatch'
    return {'task':'B','status':'PASS','rows':len(rows),'periods':len(portfolio['periods'])}

if __name__=='__main__':
    task,root,output=sys.argv[1:]
    try:
        result=({'a':check_a,'b':check_b}[task])(root,output)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'task':task,'status':'FAIL','error':type(e).__name__,'reason':str(e)}))
        sys.exit(1)
