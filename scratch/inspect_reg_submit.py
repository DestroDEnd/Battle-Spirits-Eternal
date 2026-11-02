f = open('register.html', encoding='utf-8').read()
idx = f.find('async function handleRegisterSubmit')
print(repr(f[idx:idx+500]))
