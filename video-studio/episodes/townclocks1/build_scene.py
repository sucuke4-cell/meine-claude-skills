"""Builds scene.js = shared helpers + avatar code (taken from episodes/part2/scene.js) + main.js."""
import pathlib
base = pathlib.Path('../part2/scene.js').read_text().splitlines(keepends=True)
start_av = next(i for i, l in enumerate(base) if l.startswith('// ---------- avatars ----------'))
end_av = next(i for i, l in enumerate(base) if l.startswith('const milo = makeAvatar'))
start_r = next(i for i, l in enumerate(base) if l.startswith('// ---------- renderer / scene ----------'))
helpers = ''.join(base[:start_r])
avatars = ''.join(base[start_av:end_av])
pathlib.Path('scene.js').write_text(helpers + avatars + pathlib.Path('main.js').read_text())
print('scene.js built')
