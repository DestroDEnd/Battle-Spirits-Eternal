f = open('register.html', encoding='utf-8').read()
idx1 = f.find('<form')
idx2 = f.find('</form>')
print('Form:\n', f[idx1:idx2+7].encode('ascii', errors='replace').decode('ascii'))

idx3 = f.find('handleRegisterSubmit')
print('\nScript:\n', f[idx3:idx3+1200].encode('ascii', errors='replace').decode('ascii'))
