# TODO

- [ ] Verify current .gitignore ignores model weight extensions (.pt/.pth/.onnx/.weights)
- [ ] Stage the .gitignore change if needed (already exists)
- [ ] Untrack existing committed model files (remove from git index, keep files locally)
- [ ] Create sequential commits: helmet.pt, plate.pt, person.pt (one-by-one)
- [ ] Push each commit to remote
- [ ] Confirm with `git status` that no .pt files are tracked except as intended

