
# Inchiostro Story Template

This is the repo where Inchiostro is being developed.

If you are looking for more generic info about Inchiostro, (click here)[https://daniel-wittgenstein.github.io/inchiostro-website/]

# Developing Inchiostro

No build step, no npm used.

After you cloned the repo, add an "ink-package.json" to the root directory, with contents (the file is .gitignored):

  {
    "projectName": "Testing Inchiostro Dev",
    "entryFile": "story.js",
    "inkFile": "story.ink"
  }

This turns the folder into a valid Inkberry project. Then open the folder with the Inkberry app. Now you can implement new features and test them.

# Releasing a new version of Inchiostro

Bump the version number inside "template-package.json"

(The "template-package.json" is necessary so that Inkberry accepts this as a story template when it is loaded locally via "Load a Story Template".)

Then just manually zip up the folder contents (without the .gitignored files, of course) and release them.

