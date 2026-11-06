import os
import glob

# Remove temporary scripts
for f in ['fix_cf_readme.py', 'fix_frontend_readme.py']:
    try:
        os.remove(f)
        print(f'Deleted {f}')
    except:
        print(f'{f} not found')

# Remove temp.txt if exists
try:
    os.remove('temp.txt')
    print('Deleted temp.txt')
except:
    print('temp.txt not found')