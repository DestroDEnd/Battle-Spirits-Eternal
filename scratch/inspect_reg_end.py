f = open('register.html', encoding='utf-8').read()
idx1 = f.find('async function handleRegisterSubmit')
idx2 = f.find('</script>', idx1)
print(repr(f[idx1:idx2]))
