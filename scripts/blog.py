import os
import markdown2
import sys
import json
import ntpath
import datetime

def update_blog_config(title, abstract):
    pass


def get_abstract(content, limit=100):
    return content[:limit]

def get_title(post_id):
    words = post_id.split("-")
    output = " ".join(words)
    return output.upper()


def get_html(markdown):
    return markdown2.markdown(markdown)

def main():
    if len(sys.argv) != 2:
        print("Invalid arguments")
        exit(-1)
    input_file = sys.argv[1]
    filename = ntpath.basename(input_file)
    post_id = filename.split(".")[0] # assume it's XXX-XXX-XXX.md format

    # check if it is a valid markdown file
    if not os.path.isfile(input_file):
        print("File does not exit")
        exit()

    # get output filename
    py_file = os.path.abspath(os.path.dirname(__file__))
    root_dir = os.path.join(py_file, "..")
    output_dir = os.path.join(root_dir, "posts")
    if not os.path.isdir(output_dir):
        print("Python file is not in the right directory")
        exit(-1)
    output_file = os.path.join(output_dir, post_id + ".json")

    # process meta data
    now = datetime.datetime.now()
    date = now.year * 10000 + now.month * 100 + now.day
    with open(input_file) as f:
        content = f.read()
    abstract = get_abstract(content)
    title = get_title(post_id)

    # get markdown
    html = get_html(content)

    # update the global blog config
    config_file = os.path.join(root_dir, "assets", "data", "blogs.json")
    if not os.path.isfile(config_file):
        print("Blog config file not found")
        exit()
    with open(config_file, "r") as f:
        config = json.load(f)

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

    # write to the config file
    with open(config_file, "w") as f:
        json.dump(config, f)
        print("Config written")

    # output the json file
    json_post = {"title": title, "body": html}

    with open(output_file, "w+") as f:
        json.dump(json_post, f)
        print("Post data written")


    print("Finished")

if __name__ == "__main__":
    main()
