import os
import markdown2
import sys
import json
import ntpath
import datetime
import subprocess

WATCH_DIR = "posts/raw"
POST_OUTPUT = "posts"


# wrapper functions for git
def git_add(path):
    p = subprocess.Popen('git add ' + path, shell=True, stdout=0)

def git_remove(path):
    p = subprocess.Popen('git rm -f ' + path, shell=True)


def git_get_files():
    results = []
    p = subprocess.Popen('git diff --cached --name-status', shell=True, stdout=subprocess.PIPE)
    for line in p.stdout.readlines():
        results.append([x.decode("ascii") for x in line.split() if len(x) > 0])
    return results

def git_commit():
    p = subprocess.Popen("git commit 'AUTO: Markdown to HTML commit'", shell=True, stdout=0)

def get_abstract(content, limit=100):
    return content[:limit]

def get_title(post_id):
    words = post_id.split("-")
    output = " ".join(words)
    return output.upper()


def get_html(markdown):
    return markdown2.markdown(markdown)

def get_wd():
    # get the working dir, aka, git root folder
    py_file = os.path.abspath(os.path.dirname(__file__))
    return os.path.join(py_file, "..")


def get_diff_path(diff):
    if diff.a_blob:
        return diff.a_blob.path
    elif diff.b_blob:
        return diff.b_blob.path
    return ""

def main():
    root_dir = get_wd()
    # change it to the root dir for easier file management
    os.chdir(root_dir)
    md_files = {}
    changed_files = git_get_files()
    for change_type, path in changed_files:
        extension = os.path.splitext(path)[-1]
        compare_path = os.path.relpath(path, WATCH_DIR)
        # filter only the markdown files in the watched dir
        if extension == ".md" and os.path.basename(path) == compare_path:
            md_files[path] = change_type
    process_md(md_files)


def process_md(md_files):
    for path in md_files:
        change_type = md_files[path]
        if change_type not in ["M", "D", "A"]:
            print("Not recognized change. Got", change_type)
            exit(1)
        handle_posts(path, change_type)


def handle_posts(input_file, change_type):
    filename = ntpath.basename(input_file)
    post_id = filename.split(".")[0] # assume it's XXX-XXX-XXX.md format

    # check if it is a valid markdown file
    if not os.path.isfile(input_file) and change_type != "D":
        print("File does not exit:", input_file, "type", change_type)
        exit(1)

    # get output filename
    if not os.path.isdir(POST_OUTPUT):
        print("Python file is not in the right directory")
        exit(1)
    output_file = os.path.join(POST_OUTPUT, post_id + ".json")

    # update the global blog config
    config_file = os.path.join("assets", "data", "blogs.json")
    if not os.path.isfile(config_file):
        print("Blog config file not found")
        exit(1)
    with open(config_file, "r") as f:
        config = json.load(f)


    # add/modify a post
    if change_type == "A" or change_type == "M":
        # process meta data
        now = datetime.datetime.now()
        date = now.year * 10000 + now.month * 100 + now.day
        with open(input_file) as f:
            content = f.read()
        abstract = get_abstract(content)
        title = get_title(post_id)

        # get markdown
        html = get_html(content)

        entry = None
        for post in config:
            if post["id"] == post_id:
                entry = post
                break
        if entry is not None:
            print("Updating the old entry")
            entry["date"] = date
            entry["title"] = title
            entry["abstract"] = abstract
        else:
            print("Adding new entry", post_id, "to the config")
            entry = {"title": title, "abstract": abstract, "id": post_id, "date": date}
            config.append(entry)

        # output the json file
        json_post = {"title": title, "body": html}

        with open(output_file, "w+") as f:
            json.dump(json_post, f)
            print("Post data written", output_file)
        git_add(output_file)

    else:
        entry = None
        for post in config:
            if post["id"] == post_id:
                entry = post
                break
        if entry is not None:
            # delete the blog entry
            config.remove(entry)

            # delete the json file
            git_remove(output_file)

    # write to the config file
    with open(config_file, "w") as f:
        json.dump(config, f)
        print("Config written")

        git_add(config_file)


if __name__ == "__main__":
    main()
