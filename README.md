JS engine prebuilt binaries installer.
```sh
# create config file at ./egist.json if not exists, else install all engines in config file
egisl init

# latest v8
egisl add v8

# llrt v0.8.1-beta
egisl add llrt@v0.8.1-beta

# quickjs 2026-06-04 build for x64 arch
egisl add quickjs@2026-06-04_x64

# porffor alpha-1 for x64 linux
egisl add porffor@alpha-1_x64_linux

# add multiple engines
egisl add v8 quickjs llrt jsc hermes spidermonkey xs

# remove engines, similar arguments to egist add
egisl rm ...

# alias binaries, similar arguments to egist add
egisl use ...
```
