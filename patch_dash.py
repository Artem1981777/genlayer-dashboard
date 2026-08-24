p = "src/lib/projects.ts"
s = open(p, encoding="utf-8").read()
old = '      "0x235F51b11b9F96d6673df37553Ef58373c4324F9",'
new = old + '\n      "0x16C0747A98dCa576Fd1A495DD5FA2be0E1333192",'
if old not in s:
    print("MISSING")
elif "0x16C0747A98dCa576Fd1A495DD5FA2be0E1333192" in s:
    print("ALREADY PRESENT")
else:
    open(p, "w", encoding="utf-8").write(s.replace(old, new, 1))
    print("PATCHED OK")
