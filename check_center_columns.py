import urllib.request
import json

url = "https://qrtvxzdlfurpipvtwian.supabase.co/rest/v1/center_feature_permissions?select=*"
headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydHZ4emRsZnVycGlwdnR3aWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NjkyNzYsImV4cCI6MjA4MDI0NTI3Nn0.OjzNQFSDIV7wLQHJsAADevrSQj27Cw1Obmrjncvoj6s",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydHZ4emRsZnVycGlwdnR3aWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NjkyNzYsImV4cCI6MjA4MDI0NTI3Nn0.OjzNQFSDIV7wLQHJsAADevrSQj27Cw1Obmrjncvoj6s",
    "Range": "0-0"
}
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        if response.status == 200:
            data = json.loads(response.read().decode())
            if data:
                print(sorted(list(data[0].keys())))
            else:
                print("No data")
        else:
            print(f"Error {response.status}")
except Exception as e:
    print(f"Exception: {e}")
