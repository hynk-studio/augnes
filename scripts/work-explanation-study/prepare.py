"""Materialize one constructed case, preserving actual predecessor executions."""
from pathlib import Path
import argparse
import csv
import hashlib
import json
import shutil
import subprocess
import sys
import time

HERE = Path(__file__).resolve().parent

def write_json(path, value):
    path.write_text(json.dumps(value, indent=2) + '\n')

def dataset(root, name, period, unit, rows, limits=None):
    root.mkdir(parents=True, exist_ok=True)
    with (root / (name + '.csv')).open('w', newline='') as stream:
        writer = csv.writer(stream, lineterminator='\n')
        writer.writerow(['event_id', 'site', 'reading'])
        writer.writerows(rows)
    value = dict(period=period, unit=unit, file=name + '.csv')
    if limits is not None:
        value['import_limits_kwh'] = limits
    write_json(root / (name + '.json'), value)

def prepare(root):
    root = Path(root)
    root.mkdir(exist_ok=False)
    shutil.copyfile(HERE / 'legacy_meter.py', root / 'legacy_meter.py')
    history = root / 'history'
    dataset(history, 'warm', '2026-07', 'kWh', [('w1', 'east', '1.000')])
    dataset(history, 'previous', '2026-07', 'kWh', [('p1', 'east', '2.000')])
    target = history / 'generated.json'
    events = []
    for label, source in [('warm', 'warm.json'), ('retained', 'previous.json'), ('after-removal', 'previous.json')]:
        if label == 'after-removal':
            target.unlink()
        command = [sys.executable, str(root / 'legacy_meter.py'), str(history / source), str(target)]
        start = time.monotonic()
        result = subprocess.run(command, capture_output=True, text=True, timeout=10, check=True)
        original = target.read_bytes()
        (history / (label + '-output.json')).write_bytes(original)
        events.append(dict(label=label, argv=['python3', 'legacy_meter.py', 'history/' + source, 'history/generated.json'],
                           removed_output_before=label == 'after-removal', exit_code=result.returncode,
                           stdout=result.stdout, duration_s=time.monotonic()-start,
                           output_sha256=hashlib.sha256(original).hexdigest()))
    write_json(history / 'executions.json', events)
    (history / 'advice.md').write_text(
        '# Supplied advice in a constructed scenario\n\n'
        '“When a meter report is wrong, delete the generated report and rerun.”\n\n'
        'This is developer-supplied advice, not an actual predecessor model or production incident. '
        'The preserved original inputs, CLI and actual process results are in this directory. '
        'The warm invocation produced 1.000 kWh. The next invocation against previous.json still '
        'reported 1.000. Removing generated.json and invoking the same CLI against previous.json '
        'produced 2.000. That is its observed basis; the advice is not guaranteed for other conditions.\n')
    dataset(root / 'task-a', 'meter', '2026-09', 'Wh', [
        ('a1', 'east', '750'), ('a2', 'east', '1250'), ('a3', 'east', '-500'),
        ('a4', 'west', '2000'), ('a5', 'west', '-250')])
    (root / 'TASK.md').write_text((HERE / 'task-a.md').read_text())
    return root

def add_b(root):
    root = Path(root)
    target = root / 'task-b'
    if target.exists():
        raise ValueError('task B already supplied; do not replace a frozen run')
    dataset(target, 'january', '2027-01', 'Wh', [('b1','east','1200'),('b2','east','-200'),('b3','west','2500')], {'east':'1.000','west':'3.000'})
    dataset(target, 'february', '2027-02', 'kWh', [('b4','east','0.750'),('b5','west','1.125'),('b6','west','-0.125')], {'east':'1.000','west':'1.000'})
    dataset(target, 'march', '2027-03', 'Wh', [('b7','east','500'),('b8','west','-300'),('b9','west','700')], {'east':'0.500','west':'0.650'})
    (root / 'TASK-B.md').write_text((HERE / 'task-b.md').read_text())

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=['a','b'])
    parser.add_argument('root')
    args = parser.parse_args()
    (prepare if args.mode == 'a' else add_b)(args.root)
