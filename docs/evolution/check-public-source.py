import subprocess,re,json
commits=subprocess.check_output(['git','rev-list','--all'],text=True).splitlines()
patterns=re.compile(rb'(?:ghp_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:authorization|access_token|refresh_token|api_key)\s*[=:]\s*["\x27][^"\x27]{16,})',re.I)
checked=set();hits=[]
for commit in commits:
 for entry in subprocess.check_output(['git','ls-tree','-r',commit],text=True).splitlines():
  meta,path=entry.split('\t',1);blob=meta.split()[2]
  if blob in checked:continue
  checked.add(blob);data=subprocess.check_output(['git','cat-file','blob',blob])
  if patterns.search(data):hits.append({'commit':commit,'path':path})
print(json.dumps({'commits':len(commits),'uniqueBlobs':len(checked),'credentialPatternMatches':hits},indent=2))
