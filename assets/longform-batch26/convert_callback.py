"""Convert explicit UTC practice records; no network, calendar or messaging calls."""
import csv,datetime,json,re,sys
from zoneinfo import ZoneInfo

def convert(path):
 result=[];seen=set()
 with open(path,newline='',encoding='utf-8') as f:
  reader=csv.DictReader(f)
  if not reader.fieldnames or not {'id','utc','zone'}<=set(reader.fieldnames) or len(set(reader.fieldnames))!=len(reader.fieldnames):raise ValueError('CSV requires unique id, utc and zone columns')
  for row in reader:
   if any(not isinstance(row.get(key),str) for key in ['id','utc','zone']):raise ValueError('Every row requires id, utc and zone values')
   ident=row['id'].strip();value=row['utc'].strip();zone=row['zone'].strip()
   if not ident or ident in seen:raise ValueError('Each row requires a unique nonempty id')
   seen.add(ident)
   if not re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z',value):raise ValueError('Use explicit UTC YYYY-MM-DDTHH:MM:SSZ')
   instant=datetime.datetime.strptime(value,'%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=datetime.timezone.utc)
   local=instant.astimezone(ZoneInfo(zone))
   result.append({'id':ident,'utc':value,'zone':zone,'local':local.isoformat(timespec='seconds'),'fold':local.fold})
 if not result:raise ValueError('CSV has no data rows')
 return result

if __name__=='__main__':
 try:
  if len(sys.argv)!=2:raise ValueError('Usage: python3 convert_callback.py fictional-callbacks.csv')
  print(json.dumps(convert(sys.argv[1]),indent=2))
 except (ValueError,KeyError,OSError) as e:
  print('Input or time-zone data error: '+str(e),file=sys.stderr);sys.exit(2)
