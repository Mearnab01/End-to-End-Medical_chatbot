import os

folders = [
    ".github/workflows",
    "data",
    "research",
    "src",
    "static",
    "templates",
]

files = [
    ".github/workflows/cicd.yaml",
    "data/Medical_book.pdf",
    "research/trials.ipynb",
    "src/__init__.py",
    "src/helper.py",
    "src/prompt.py",
    "static/style.css",
    "templates/chat.html",
    ".gitignore",
    "Dockerfile",
    "LICENSE",
    "README.md",
    "app.py",
    "requirements.txt",
    "setup.py",
    "store_index.py",
    "template.py",
]

# create folders
for folder in folders:
    os.makedirs(folder, exist_ok=True)
    print(f"Folder created: {folder}")

# create files
for file in files:
    with open(file, "a") as f:
        pass

    print(f"File created: {file}")