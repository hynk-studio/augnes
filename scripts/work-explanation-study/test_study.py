"""Bounded development checks. These are exposed mechanics, never consumers."""
import copy
import csv
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from checker import check_a, check_b, expected, expected_b, milli_kwh, formatted
from prepare import prepare, add_b

HERE=Path(__file__).resolve().parent

class StudyTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='augnes-1464-development-')
        self.addCleanup(self.temp.cleanup)
        self.root=prepare(Path(self.temp.name)/'arm')

    def test_advice_actual_basis_and_changed_contract(self):
        history=self.root/'history'
        self.assertEqual(json.loads((history/'warm-output.json').read_text())['net_kwh'],'1.000')
        self.assertEqual(json.loads((history/'retained-output.json').read_text())['net_kwh'],'1.000')
        self.assertEqual(json.loads((history/'after-removal-output.json').read_text())['net_kwh'],'2.000')
        out=self.root/'current.json'
        r=subprocess.run([sys.executable,str(self.root/'legacy_meter.py'),str(self.root/'task-a/meter.json'),str(out)],capture_output=True,timeout=10)
        self.assertEqual(r.returncode,0)
        with self.assertRaises(AssertionError):check_a(self.root,out)
        # Removing/recreating the output does not repair the changed-contract error.
        original=out.read_bytes();out.unlink()
        subprocess.run([sys.executable,str(self.root/'legacy_meter.py'),str(self.root/'task-a/meter.json'),str(out)],check=True,capture_output=True,timeout=10)
        self.assertEqual(out.read_bytes(),original)

    def test_exact_a_and_checker_negative_controls(self):
        good={'period':'2026-09','unit':'kWh','sites':[
            {'site':'east','net_kwh':'1.500','import_kwh':'2.000','export_kwh':'0.500','events':3},
            {'site':'west','net_kwh':'1.750','import_kwh':'2.000','export_kwh':'0.250','events':2}], 'net_kwh':'3.250'}
        out=self.root/'a.json';out.write_text(json.dumps(good))
        self.assertEqual(check_a(self.root,out)['events'],5)
        for mutate in (
            lambda v:v.update(net_kwh='3250.000'),
            lambda v:v['sites'].pop(),
            lambda v:v['sites'][0].update(import_kwh='1.500'),
            lambda v:v['sites'][0].update(events=True),
            lambda v:v['sites'][0].update(net_kwh=1.5),
            lambda v:v.update(unit='Wh'),
            lambda v:v['sites'][0].update(net_kwh='1.5'),
        ):
            wrong=copy.deepcopy(good);mutate(wrong);out.write_text(json.dumps(wrong))
            with self.assertRaises(AssertionError):check_a(self.root,out)

    def test_fresh_b_different_requirement_and_limit_semantics(self):
        self.assertFalse((self.root/'task-b').exists())
        add_b(self.root)
        with self.assertRaises(ValueError):add_b(self.root)
        rows,portfolio=expected_b(self.root)
        self.assertEqual(portfolio,{'unit':'kWh','periods':['2027-01','2027-02','2027-03'],'net_kwh':'6.150','import_kwh':'6.775','export_kwh':'0.625','highest_import_site':'west'})
        self.assertEqual([x['over_import_limit'] for x in rows],['true','false','false','true','false','true'])
        out=self.root/'b';out.mkdir()
        fields=['period','site','net_kwh','import_kwh','export_kwh','events','over_import_limit']
        with (out/'monthly.csv').open('w',newline='') as f:
            w=csv.DictWriter(f,fieldnames=fields,lineterminator='\n');w.writeheader();w.writerows(rows)
        (out/'portfolio.json').write_text(json.dumps(portfolio))
        self.assertEqual(check_b(self.root,out)['rows'],6)
        text=(out/'monthly.csv').read_text()
        # January east net equals limit, but its imports exceed it.
        (out/'monthly.csv').write_text(text.replace('3,true','3,false').replace('2,true','2,false'))
        with self.assertRaises(AssertionError):check_b(self.root,out)

    def test_units_and_exact_representation(self):
        self.assertEqual(milli_kwh('9007199254740993','Wh'),9007199254740993)
        self.assertEqual(formatted(milli_kwh('-0.125','kWh')),'-0.125')
        self.assertEqual(milli_kwh('125','Wh'),milli_kwh('0.125','kWh'))
        with self.assertRaises(ValueError):milli_kwh('0.125','Wh')
        with self.assertRaises(KeyError):milli_kwh('1','MWh')
        for x in ['NaN','1e3','1.0001','01','+1']:
            with self.assertRaises(ValueError):milli_kwh(x,'kWh')

if __name__=='__main__':unittest.main()
